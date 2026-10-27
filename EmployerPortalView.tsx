import React, { useState } from 'react';
import type { GrievanceItem, OrgDataset } from '../types';

interface EmployerPortalViewProps {
  org: OrgDataset;
  onResolveDispute: (disputeId: string, status: 'Approved' | 'Rejected') => Promise<void>;
  onUpdateGrievanceStatus: (
    grievanceId: string,
    status: GrievanceItem['status'],
    noteText?: string
  ) => Promise<void>;
  onVerifySkill: (skillId: string, status: 'Verified') => Promise<void>;
  onResolveFatigue: (alertId: string, correctiveAction: string) => Promise<void>;
  onResolvePayslipDiscrepancy: (payslipId: string) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onTriggerToast: (msg: string) => void;
}

export const EmployerPortalView: React.FC<EmployerPortalViewProps> = ({
  org,
  onResolveDispute,
  onUpdateGrievanceStatus,
  onVerifySkill,
  onResolveFatigue,
  onResolvePayslipDiscrepancy,
  onResetDemo,
  onTriggerToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    'disputes' | 'grievances' | 'fatigue' | 'skills' | 'payroll'
  >('grievances');
  const [managerNoteMap, setManagerNoteMap] = useState<Record<string, string>>({});

  const openGrievancesCount = org.grievances.filter((g) => g.status !== 'Resolved').length;
  const pendingDisputesCount = org.disputes.filter((d) => d.status === 'Pending Review').length;
  const activeFatigueCount = org.fatigueAlerts.filter((a) => a.status === 'Active Alert').length;
  const pendingSkillsCount = org.skills.filter((s) => s.status !== 'Verified').length;

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span>Employer Operations</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">HR &amp; HSE Compliance Console</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Workforce Operations &amp; SDG 8 Governance
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Logged in as <strong>{org.managerName}</strong> ({org.managerRole}) • {org.name}
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={async () => {
              await onResetDemo();
              onTriggerToast('Restored initial demo seed dataset across all organizations');
            }}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">restart_alt</span>
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* 4-Column Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Daily Site Attendance
            </span>
            <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">
              groups
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary tabular-nums">96.4%</div>
          <span className="font-label-sm text-label-sm text-on-tertiary-container">
            All active shifts geofence-verified
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Open HSE &amp; Grievance Cases
            </span>
            <span className="material-symbols-outlined text-[20px] text-secondary">
              shield_with_heart
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary tabular-nums">
            {String(openGrievancesCount).padStart(2, '0')}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            SLA target: &lt;48h resolution
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Pending Time Disputes
            </span>
            <span className="material-symbols-outlined text-[20px] text-amber-600">
              pending_actions
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary tabular-nums">
            {String(pendingDisputesCount).padStart(2, '0')}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Dual-signature audit required
          </span>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-1">
            <span className="font-label-sm text-label-sm uppercase tracking-wider">
              Active Fatigue Alerts
            </span>
            <span className="material-symbols-outlined text-[20px] text-error">
              health_and_safety
            </span>
          </div>
          <div className="font-headline-lg text-headline-lg text-primary tabular-nums">
            {String(activeFatigueCount).padStart(2, '0')}
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Human-reviewed intervention queue
          </span>
        </div>
      </div>

      {/* Navigation Tabs for HR / HSE Actions */}
      <div className="bg-surface-container-lowest rounded-xl p-space-sm shadow-sm border border-outline-variant/20 flex items-center gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('grievances')}
          className={`px-space-md py-2 rounded-lg font-label-lg text-label-lg whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'grievances'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          HSE &amp; Grievance Escalations ({org.grievances.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('disputes')}
          className={`px-space-md py-2 rounded-lg font-label-lg text-label-lg whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Attendance &amp; Time Disputes ({org.disputes.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('fatigue')}
          className={`px-space-md py-2 rounded-lg font-label-lg text-label-lg whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'fatigue'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Fatigue &amp; Hours Guardrails ({org.fatigueAlerts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`px-space-md py-2 rounded-lg font-label-lg text-label-lg whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Payroll Approval &amp; Audits ({org.payslips.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('skills')}
          className={`px-space-md py-2 rounded-lg font-label-lg text-label-lg whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'skills'
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Skill Verification ({pendingSkillsCount} Pending)
        </button>
      </div>

      {/* Tab 1: HSE & Grievance Escalations */}
      {activeTab === 'grievances' && (
        <div className="space-y-space-md">
          {org.grievances.map((g) => (
            <div
              key={g.id}
              className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col gap-space-md"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-headline-sm text-headline-sm text-primary font-mono">
                      #{g.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                      {g.categoryBadge}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                      {g.status}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      • Submitter: {g.identityLabel} • {g.locationRef}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface">{g.title}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    {g.fullDescription}
                  </p>
                </div>

                {/* Status Action Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  {(['Submitted', 'Under Review', 'In Progress', 'Resolved'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={async () => {
                          await onUpdateGrievanceStatus(g.id, st);
                          onTriggerToast(`Updated case #${g.id} status to "${st}"`);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-colors cursor-pointer ${
                          g.status === st
                            ? 'bg-secondary-container text-on-secondary-container font-semibold'
                            : 'bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Add Official HSE Officer Action Note */}
              <div className="flex gap-2 pt-2 border-t border-outline-variant/20">
                <input
                  type="text"
                  value={managerNoteMap[g.id] || ''}
                  onChange={(e) =>
                    setManagerNoteMap((prev) => ({ ...prev, [g.id]: e.target.value }))
                  }
                  placeholder={`Record official HSE corrective action on #${g.id} ledger...`}
                  className="flex-1 h-9 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const note = managerNoteMap[g.id];
                    if (!note?.trim()) return;
                    await onUpdateGrievanceStatus(g.id, g.status, note.trim());
                    setManagerNoteMap((prev) => ({ ...prev, [g.id]: '' }));
                    onTriggerToast(`Signed HSE corrective action onto #${g.id} timeline`);
                  }}
                  className="px-4 h-9 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer"
                >
                  Log Action
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Attendance & Time Disputes */}
      {activeTab === 'disputes' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Worker Time Correction Dispute Queue
          </h2>
          {org.disputes.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant py-space-md">
              No pending time correction disputes for {org.name}. Workers can submit adjustments from the Attendance &amp; Shifts table.
            </p>
          ) : (
            <div className="space-y-space-sm">
              {org.disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-primary">#{d.id}</span>
                      <span className="font-label-md text-label-md text-on-surface font-semibold">
                        {d.shiftTarget}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                          d.status === 'Approved'
                            ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                            : d.status === 'Rejected'
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-surface-container-highest text-on-surface-variant'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Proposed Window:{' '}
                      <strong className="font-mono">
                        {d.proposedClockIn} – {d.proposedClockOut}
                      </strong>{' '}
                      • Submitted by {d.submittedBy} ({d.submittedAt})
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Reason: &ldquo;{d.reason}&rdquo;
                    </p>
                  </div>

                  {d.status === 'Pending Review' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={async () => {
                          await onResolveDispute(d.id, 'Approved');
                          onTriggerToast(`Approved time correction #${d.id}`);
                        }}
                        className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer"
                      >
                        Approve &amp; Sync Payroll
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await onResolveDispute(d.id, 'Rejected');
                          onTriggerToast(`Marked #${d.id} for secondary supervisor audit`);
                        }}
                        className="px-3 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Fatigue & Excessive-Hours Monitor */}
      {activeTab === 'fatigue' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary">
              Fatigue &amp; Excessive-Hours Guardrail Alerts (FR-07)
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Alerts support protective human review and rest scheduling—never automated worker penalties.
            </p>
          </div>
          {org.fatigueAlerts.length === 0 ? (
            <p className="font-body-sm text-body-sm text-on-surface-variant py-space-md">
              All scheduled crew members currently comply with the 11-hour mandatory rest buffer and weekly overtime caps.
            </p>
          ) : (
            <div className="space-y-space-sm">
              {org.fatigueAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-space-md rounded-xl bg-surface-container-low flex flex-col md:flex-row md:items-center justify-between gap-space-md"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-label-lg text-label-lg text-primary font-semibold">
                        {alert.workerName} ({alert.workerId})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                          alert.severity === 'High'
                            ? 'bg-error-container text-error'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {alert.severity} Risk
                      </span>
                      <span className="font-mono text-label-sm text-secondary">
                        {alert.metricValue}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      Rule Triggered: <strong>{alert.ruleTriggered}</strong> • {alert.worksite}
                    </p>
                    {alert.correctiveAction && (
                      <p className="font-body-sm text-body-sm text-on-tertiary-container mt-1">
                        Logged Action: {alert.correctiveAction}
                      </p>
                    )}
                  </div>
                  {alert.status === 'Active Alert' && (
                    <button
                      type="button"
                      onClick={async () => {
                        await onResolveFatigue(
                          alert.id,
                          'Assigned relief operator and enforced mandatory 12-hour rest recovery window.'
                        );
                        onTriggerToast(`Logged protective rest intervention for ${alert.workerName}`);
                      }}
                      className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shrink-0 cursor-pointer"
                    >
                      Assign Relief &amp; Log Rest Buffer
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Payroll Approvals */}
      {activeTab === 'payroll' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Payroll Batch &amp; Discrepancy Audit
          </h2>
          <div className="space-y-space-sm">
            {org.payslips.map((p) => (
              <div
                key={p.id}
                className="p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-md"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-lg text-label-lg text-primary font-semibold">
                      {org.workerName} — {p.periodLabel}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-container-lowest font-label-sm text-label-sm">
                      {p.status}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant font-mono tabular-nums mt-0.5">
                    Net Pay: {p.currency}
                    {p.netPay.toFixed(2)} (Base: {p.baseHours}h, OT: {p.overtimeHours}h @{' '}
                    {p.overtimeMultiplier}x)
                  </p>
                  {p.discrepancyNote && (
                    <p className="font-body-sm text-body-sm text-error mt-1">
                      Worker Flag: &ldquo;{p.discrepancyNote}&rdquo;
                    </p>
                  )}
                </div>
                {p.status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={async () => {
                      await onResolvePayslipDiscrepancy(p.id);
                      onTriggerToast(`Audited and approved payslip ${p.id}`);
                    }}
                    className="px-4 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md cursor-pointer"
                  >
                    Approve &amp; Resolve Flag
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Skill Verification */}
      {activeTab === 'skills' && (
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-md">
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Employee Skill Passport Verification Queue
          </h2>
          <div className="space-y-space-sm">
            {org.skills.map((s) => (
              <div
                key={s.id}
                className="p-space-md rounded-xl bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-space-md"
              >
                <div>
                  <div className="font-label-lg text-label-lg text-primary font-semibold">
                    {s.skillName}
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {org.workerName} • {s.issuer} • Ref: <span className="font-mono">{s.certificateRef}</span>
                  </p>
                </div>
                {s.status === 'Verified' ? (
                  <span className="px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                    Verified Credential
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      await onVerifySkill(s.id, 'Verified');
                      onTriggerToast(`Verified credential ${s.certificateRef} for ${org.workerName}`);
                    }}
                    className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer"
                  >
                    Verify Certificate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
