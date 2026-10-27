import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_DATABASE, HOTLINKED_ASSETS } from './src/data/seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'fairshift-db.json');

function loadDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.organizations && parsed.organizations.apex) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read DB file, falling back to seed:', err);
  }
  const cloned = JSON.parse(JSON.stringify(INITIAL_DATABASE));
  saveDatabase(cloned);
  return cloned;
}

function saveDatabase(db) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save DB file:', err);
  }
}

let db = loadDatabase();

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // GET full state
  app.get('/api/state', (_req, res) => {
    res.json(db);
  });

  // POST reset demo state
  app.post('/api/reset', (_req, res) => {
    db = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    saveDatabase(db);
    res.json(db);
  });

  // POST user login — updates active worker or manager name across organizations
  app.post('/api/auth/login', (req, res) => {
    const { role = 'worker', displayName, identifier } = req.body;
    if (displayName && displayName.trim()) {
      const cleanName = displayName.trim();
      const cleanEmail =
        identifier && identifier.includes('@')
          ? identifier.trim()
          : `${cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@apexbuild.com`;

      Object.values(db.organizations).forEach((org) => {
        if (role === 'manager') {
          org.managerName = cleanName;
          org.managerEmail = cleanEmail;
        } else {
          org.workerName = cleanName;
          org.workerEmail = cleanEmail;
        }
      });
      saveDatabase(db);
    }
    res.json(db);
  });

  // POST attendance punch (clock_in, break_toggle, clock_out, qr_checkin)
  app.post('/api/attendance/punch', (req, res) => {
    const { orgId = 'apex', action, timestampLabel } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const nowTime =
      timestampLabel ||
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (action === 'break_toggle') {
      org.dutyState = org.dutyState === 'On Break' ? 'Active on Shift' : 'On Break';
    } else if (action === 'clock_out') {
      org.dutyState = 'Clocked Out';
      const liveShift = org.shifts.find((s) => s.isLive);
      if (liveShift) {
        liveShift.clockOut = nowTime;
        liveShift.paidHours = '5.6h';
        liveShift.auditStatus = 'Present';
      }
      org.importantUpdates.unshift({
        id: 'upd-' + Date.now(),
        icon: 'schedule',
        iconColorClass: 'text-on-tertiary-container',
        title: `Shift Clock-Out Recorded (${nowTime})`,
        badgeText: 'Synced',
        badgeTone: 'success',
        subtitle: `Biometric timestamp verified and synced with ${org.name}`,
        timeLabel: 'Just now',
        targetRoute: 'attendance-and-shifts',
      });
    } else if (action === 'clock_in' || action === 'qr_checkin') {
      org.dutyState = 'Active on Shift';
      org.clockInTime = nowTime;
      org.punchEarlyNote = `Punch: ${nowTime} (QR Verified)`;
      const liveShift = org.shifts.find((s) => s.isLive);
      if (liveShift) {
        liveShift.clockIn = nowTime;
        liveShift.clockOut = 'In progress...';
        liveShift.paidHours = '--';
        liveShift.auditStatus = 'Live Active';
      }
    }

    saveDatabase(db);
    res.json(db);
  });

  // POST submit time correction dispute
  app.post('/api/attendance/dispute', (req, res) => {
    const { orgId = 'apex', shiftTarget, proposedClockIn, proposedClockOut, reason } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const newDispute = {
      id: `FS-DSP-${Math.floor(9040 + Math.random() * 900)}`,
      shiftTarget: shiftTarget || 'Morning Shift (Oct 28, 2024)',
      proposedClockIn: proposedClockIn || '07:00',
      proposedClockOut: proposedClockOut || '15:30',
      reason: reason || 'Scanner discrepancy verified by supervisor.',
      submittedBy: org.workerName,
      submittedAt: 'Just now',
      status: 'Pending Review',
    };

    org.disputes.unshift(newDispute);
    org.importantUpdates.unshift({
      id: 'upd-' + Date.now(),
      icon: 'pending_actions',
      iconColorClass: 'text-secondary',
      title: `Time Dispute Ticket (#${newDispute.id})`,
      badgeText: 'Under Review',
      badgeTone: 'neutral',
      subtitle: `${newDispute.shiftTarget} • Proposed ${newDispute.proposedClockIn}–${newDispute.proposedClockOut}`,
      timeLabel: 'Just now',
      targetRoute: 'attendance-and-shifts',
    });

    saveDatabase(db);
    res.json({ db, dispute: newDispute });
  });

  // PATCH resolve time dispute (HR Manager)
  app.patch('/api/attendance/dispute/:id', (req, res) => {
    const { orgId = 'apex', status, resolutionNote } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const dispute = org.disputes.find((d) => d.id === req.params.id);
    if (dispute) {
      dispute.status = status || 'Approved';
      dispute.resolutionNote =
        resolutionNote || 'Verified against gate supervisor log by Marcus Vance.';
    }

    saveDatabase(db);
    res.json(db);
  });

  // POST submit confidential grievance / safety report
  app.post('/api/grievances', (req, res) => {
    const {
      orgId = 'apex',
      token,
      category,
      description,
      isAnonymous,
      locationRef,
      photoName,
    } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const categoryMap = {
      safety: { key: 'safety', badge: 'Safety Hazard', prefix: 'SAF' },
      machinery: { key: 'safety', badge: 'Unsafe Machinery', prefix: 'SAF' },
      treatment: { key: 'fairness', badge: 'Fair Treatment', prefix: 'GRV' },
      overtime: { key: 'pay', badge: 'Pay & Overtime', prefix: 'GRV' },
      facilities: { key: 'fairness', badge: 'Sanitation & Facilities', prefix: 'GRV' },
    };

    const mapped = categoryMap[category] || categoryMap.safety;
    const cleanId =
      (token ? token.replace('#', '') : '') ||
      `${mapped.prefix}-2024-${Math.floor(94 + Math.random() * 50)}`;

    const firstSentence =
      (description || 'Workplace safety observation reported')
        .split('.')[0]
        .slice(0, 72) || 'Confidential workplace safety report';

    const newGrievance = {
      id: cleanId,
      categoryKey: mapped.key,
      categoryBadge: mapped.badge,
      status: 'Submitted',
      title: firstSentence,
      summary: description,
      fullDescription: description,
      assignedOfficer: org.managerName,
      assignedRole: 'HSE Lead Specialist',
      assignedAvatar: HOTLINKED_ASSETS.marcusAvatar,
      assignedIcon: 'shield_with_heart',
      isAnonymous: Boolean(isAnonymous),
      identityLabel: isAnonymous ? 'Anonymous' : 'Verified Worker',
      dateLabel: 'Oct 28, 2024',
      locationRef: locationRef || org.siteBadge,
      gridRef: `Grid Reference: #FS-${Math.floor(100 + Math.random() * 899)}`,
      urgencyLevel:
        mapped.key === 'safety'
          ? 'Level 1 (Immediate Hazard)'
          : 'Level 2 (Compliance Inquiry)',
      urgencySub: 'SDG 8 Independent Audit Guard Active',
      photos: photoName
        ? [
            {
              url: HOTLINKED_ASSETS.stagingBayPhoto,
              caption: `Uploaded Evidence: ${photoName} (EXIF Stripped)`,
              alt: 'Uploaded workplace documentation photo',
            },
          ]
        : [],
      timeline: [
        {
          id: 'tl-' + Date.now(),
          title: isAnonymous
            ? 'Incident report submitted anonymously'
            : 'Incident report submitted by Verified Worker',
          timestamp: 'Just now',
          description:
            'Worker logged report via FairShift secure portal. Zero-knowledge tracking token generated and routed to HSE Compliance Board.',
          token: `ZK_TOKEN: 0x${Math.random().toString(16).slice(2, 9)}`,
          isPrimary: true,
        },
      ],
    };

    org.grievances.unshift(newGrievance);
    org.importantUpdates.unshift({
      id: 'upd-' + Date.now(),
      icon: 'verified_user',
      iconColorClass: 'text-on-surface',
      title: `${newGrievance.categoryBadge} (#${newGrievance.id})`,
      badgeText: 'Submitted',
      badgeTone: 'neutral',
      subtitle: newGrievance.title,
      timeLabel: 'Just now',
      targetRoute: 'grievances-and-safety',
    });

    saveDatabase(db);
    res.json({ db, grievance: newGrievance });
  });

  // PATCH update grievance status or add encrypted note
  app.patch('/api/grievances/:id', (req, res) => {
    const { orgId = 'apex', status, noteText, actorRole } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const item = org.grievances.find((g) => g.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Grievance not found' });
      return;
    }

    if (status) {
      item.status = status;
      item.timeline.forEach((t) => {
        t.isPrimary = false;
      });
      item.timeline.unshift({
        id: 'tl-' + Date.now(),
        title: `Case status updated to "${status}"`,
        timestamp: 'Just now',
        description: `Status updated by ${org.managerName} (${org.managerRole}) via HSE Compliance Console.`,
        token: `AUDIT_SIG: 0x${Math.random().toString(16).slice(2, 9)}`,
        isPrimary: true,
      });
    }

    if (noteText && noteText.trim()) {
      item.timeline.forEach((t) => {
        t.isPrimary = false;
      });
      item.timeline.unshift({
        id: 'tl-' + Date.now(),
        title:
          actorRole === 'manager'
            ? `Official HSE Response from ${org.managerName}`
            : 'Encrypted Worker Clarification Note',
        timestamp: 'Just now',
        description: noteText.trim(),
        token: `E2EE_MSG: 0x${Math.random().toString(16).slice(2, 9)}`,
        isPrimary: true,
      });
    }

    saveDatabase(db);
    res.json(db);
  });

  // PATCH payslip status / flag discrepancy
  app.patch('/api/payslips/:id', (req, res) => {
    const { orgId = 'apex', status, discrepancyNote } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const slip = org.payslips.find((p) => p.id === req.params.id);
    if (slip) {
      if (status) slip.status = status;
      if (discrepancyNote !== undefined) slip.discrepancyNote = discrepancyNote;
    }

    saveDatabase(db);
    res.json(db);
  });

  // POST add skill record
  app.post('/api/skills', (req, res) => {
    const { orgId = 'apex', skillName, category, issuer, expiryDate } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const newSkill = {
      id: `SKL-${Math.floor(200 + Math.random() * 799)}`,
      skillName: skillName || 'Advanced Site Safety & Rigging Certification',
      category: category || 'Workplace Safety',
      issuer: issuer || 'ILO & Trade Qualification Board',
      issuedDate: 'Oct 28, 2024',
      expiryDate: expiryDate || 'Oct 28, 2027',
      status: 'Pending Review',
      certificateRef: `CERT-FS-${Math.floor(10000 + Math.random() * 89999)}`,
      sharedWithEmployers: true,
    };

    org.skills.unshift(newSkill);
    saveDatabase(db);
    res.json(db);
  });

  // PATCH verify or toggle share skill
  app.patch('/api/skills/:id', (req, res) => {
    const { orgId = 'apex', status, sharedWithEmployers } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const skill = org.skills.find((s) => s.id === req.params.id);
    if (skill) {
      if (status) skill.status = status;
      if (typeof sharedWithEmployers === 'boolean') {
        skill.sharedWithEmployers = sharedWithEmployers;
      }
    }

    saveDatabase(db);
    res.json(db);
  });

  // POST submit anonymous feedback
  app.post('/api/feedback', (req, res) => {
    const { orgId = 'apex', category, sentiment, message, departmentScope } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const newFeedback = {
      id: `FB-${Math.floor(300 + Math.random() * 699)}`,
      category: category || 'Work Conditions',
      sentiment: sentiment || 'Constructive',
      message: message || 'Anonymous workplace observation submitted.',
      departmentScope: departmentScope || 'All Site Crew (k ≥ 15 workers)',
      createdAt: 'Just now',
      upvotes: 1,
    };

    org.feedback.unshift(newFeedback);
    saveDatabase(db);
    res.json(db);
  });

  // PATCH upvote anonymous feedback
  app.patch('/api/feedback/:id/upvote', (req, res) => {
    const { orgId = 'apex' } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const fb = org.feedback.find((f) => f.id === req.params.id);
    if (fb) {
      fb.upvotes += 1;
    }
    saveDatabase(db);
    res.json(db);
  });

  // PATCH resolve fatigue alert
  app.patch('/api/fatigue/:id', (req, res) => {
    const { orgId = 'apex', correctiveAction } = req.body;
    const org = db.organizations[orgId];
    if (!org) {
      res.status(404).json({ error: 'Organization not found' });
      return;
    }

    const alert = org.fatigueAlerts.find((a) => a.id === req.params.id);
    if (alert) {
      alert.status = 'Action Logged';
      alert.correctiveAction =
        correctiveAction ||
        'Mandatory 12-hour rest interval scheduled and relief operator assigned by HR Director.';
    }
    saveDatabase(db);
    res.json(db);
  });

  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'));
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FairShift server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
