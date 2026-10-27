import React, { useEffect, useRef, useState } from 'react';
import type { GrievanceItem, OrgDataset } from '../types';

interface GrievancesViewProps {
  org: OrgDataset;
  onSubmitGrievance: (payload: {
    token: string;
    category: string;
    description: string;
    isAnonymous: boolean;
    photoName?: string;
  }) => Promise<GrievanceItem>;
  onAddNote: (grievanceId: string, noteText: string) => Promise<void>;
  onTriggerToast: (msg: string) => void;
}

export const GrievancesView: React.FC<GrievancesViewProps> = ({
  org,
  onSubmitGrievance,
  onAddNote,
  onTriggerToast,
}) => {
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<'all' | 'safety' | 'pay' | 'fairness'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedIssueId, setSelectedIssueId] = useState<string>(
    org.grievances[0]?.id || 'SAF-2024-88'
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);

  // Report form state
  const [nextToken, setNextToken] = useState('#SAF-2024-94');
  const [issueCategory, setIssueCategory] = useState('safety');
  const [reportLang, setReportLang] = useState('en');
  const [issueDescription, setIssueDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [uploadedPhotoName, setUploadedPhotoName] = useState<string>('');
  const [isDictating, setIsDictating] = useState(false);

  // Clarification note state
  const [noteInput, setNoteInput] = useState('');
  const [beaconModalOpen, setBeaconModalOpen] = useState(false);
  const [zoomedPhoto, setZoomedPhoto] = useState<{ url: string; caption: string } | null>(null);

  const reportDrawerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (org.grievances.length > 0 && !org.grievances.some((g) => g.id === selectedIssueId)) {
      setSelectedIssueId(org.grievances[0].id);
    }
  }, [org.id, org.grievances, selectedIssueId]);

  const filteredIssues = org.grievances.filter((g) => {
    const matchesTab = selectedCategoryTab === 'all' || g.categoryKey === selectedCategoryTab;
    const statusMap: Record<string, string> = {
      submitted: 'Submitted',
      review: 'Under Review',
      progress: 'In Progress',
      resolved: 'Resolved',
    };
    const matchesStatus =
      statusFilter === 'all' || g.status === statusMap[statusFilter] || g.status === statusFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      g.id.toLowerCase().includes(q) ||
      g.title.toLowerCase().includes(q) ||
      g.summary.toLowerCase().includes(q) ||
      g.categoryBadge.toLowerCase().includes(q);
    return matchesTab && matchesStatus && matchesSearch;
  });

  const selectedIssue =
    org.grievances.find((g) => g.id === selectedIssueId) ||
    filteredIssues[0] ||
    org.grievances[0];

  const safetyCount = org.grievances.filter((g) => g.categoryKey === 'safety').length;
  const payCount = org.grievances.filter((g) => g.categoryKey === 'pay').length;
  const fairnessCount = org.grievances.filter((g) => g.categoryKey === 'fairness').length;

  const handleOpenReportDrawer = () => {
    setIsDrawerOpen(true);
    reportDrawerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;
    const created = await onSubmitGrievance({
      token: nextToken,
      category: issueCategory,
      description: issueDescription.trim(),
      isAnonymous,
      photoName: uploadedPhotoName || undefined,
    });
    setSelectedIssueId(created.id);
    setIssueDescription('');
    setUploadedPhotoName('');
    setNextToken(`#SAF-2024-${Math.floor(95 + Math.random() * 90)}`);
    onTriggerToast(
      `Your confidential report has been submitted to the HSE board with ID #${created.id}.`
    );
  };

  const handleVoiceDictation = () => {
    setIsDictating(true);
    setTimeout(() => {
      setIsDictating(false);
      setIssueDescription((prev) =>
        prev
          ? `${prev} Guardrail toe-board loose on East Wing Level 2 walkway near hoist bay.`
          : 'Guardrail toe-board loose on East Wing Level 2 walkway near hoist bay; tagged caution tape and notified crew.'
      );
      onTriggerToast('Voice dictation transcribed into incident description');
    }, 900);
  };

  const handleSendClarificationNote = async () => {
    if (!selectedIssue || !noteInput.trim()) return;
    await onAddNote(selectedIssue.id, noteInput.trim());
    setNoteInput('');
    onTriggerToast(`Encrypted note added to #${selectedIssue.id} HSE audit timeline`);
  };

  const handleDownloadDossier = () => {
    if (!selectedIssue) return;
    const content = [
      `FAIRSHIFT HSE INCIDENT DOSSIER — #${selectedIssue.id}`,
      `Organization: ${org.name}`,
      `Status: ${selectedIssue.status}`,
      `Category: ${selectedIssue.categoryBadge}`,
      `Identity Protection: ${selectedIssue.identityLabel}`,
      `Location: ${selectedIssue.locationRef} (${selectedIssue.gridRef})`,
      `Urgency: ${selectedIssue.urgencyLevel}`,
      `\nINVESTIGATIVE OVERVIEW:\n${selectedIssue.fullDescription}`,
      `\nAUDIT TIMELINE:`,
      ...selectedIssue.timeline.map((t) => `- [${t.timestamp}] ${t.title}: ${t.description}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FairShift_Dossier_${selectedIssue.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onTriggerToast(`Downloaded dossier for #${selectedIssue.id}`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Top Stat Ticker / Trust Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md mb-space-lg">
        <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Active Inquiries
            </span>
            <span className="font-headline-lg text-headline-lg text-primary mt-1 tabular-nums">
              {String(org.grievances.length).padStart(2, '0')}
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">verified</span> SDG 8.8
              Monitored
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[24px]">shield_with_heart</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Average Resolution
            </span>
            <span className="font-headline-lg text-headline-lg text-primary mt-1 tabular-nums">
              26
              <span className="font-headline-sm text-headline-sm text-on-surface-variant">h</span>
            </span>
            <span className="font-label-sm text-label-sm text-on-tertiary-container flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">speed</span> SLA: &lt;48 Hours
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
            <span className="material-symbols-outlined text-[24px]">hourglass_bottom</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between shadow-sm">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Anonymity Rate
            </span>
            <span className="font-headline-lg text-headline-lg text-primary mt-1 tabular-nums">
              75%
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
              <span className="material-symbols-outlined text-[14px]">lock</span> Zero-Knowledge IDs
            </span>
          </div>
          <div className="w-12 h-12 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[24px]">vpn_key</span>
          </div>
        </div>

        <div className="bg-[#110d22] text-white rounded-xl p-space-md flex items-center justify-between shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col">
            <span className="font-label-sm text-label-sm text-[#cac2e0] uppercase tracking-wider">
              Emergency Hotline
            </span>
            <span className="font-headline-sm text-headline-sm text-white mt-1">
              24/7 HSE Beacon
            </span>
            <span className="font-label-sm text-label-sm text-[#cac2e0] flex items-center gap-1 mt-1">
              <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span> Live dispatch active
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBeaconModalOpen(true)}
            className="relative z-10 p-space-sm rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white cursor-pointer"
            title="Trigger Instant Safety Alert"
          >
            <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
          </button>
          <div className="absolute -right-4 -bottom-6 w-24 h-24 rounded-full bg-secondary-container/30 blur-2xl pointer-events-none"></div>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md mb-space-xl">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-headline-lg text-headline-lg text-primary">
              Grievances &amp; Workplace Safety
            </h1>
            <span className="bg-surface-container-high px-2.5 py-0.5 rounded-full font-label-sm text-label-sm text-on-surface-variant font-semibold">
              ILO C155 &amp; C190 Compliant
            </span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Confidential reporting, hazard tracking, and worker protection compliant with SDG 8
            (Decent Work &amp; Economic Growth).
          </p>
        </div>
        <div className="flex items-center gap-space-sm shrink-0">
          <button
            type="button"
            onClick={handleOpenReportDrawer}
            className="flex items-center gap-space-xs bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg px-space-md py-2.5 rounded-lg shadow-sm transition-all group cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">
              add
            </span>
            <span>+ Report a New Issue</span>
          </button>
        </div>
      </div>

      {/* Filter & Controls Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-lg flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md border border-outline-variant/20">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('all')}
            className={
              selectedCategoryTab === 'all'
                ? 'px-space-md py-2 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary transition-all whitespace-nowrap shadow-sm cursor-pointer'
                : 'px-space-md py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all whitespace-nowrap cursor-pointer'
            }
          >
            All Issues ({org.grievances.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('safety')}
            className={
              selectedCategoryTab === 'safety'
                ? 'px-space-md py-2 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary transition-all whitespace-nowrap shadow-sm cursor-pointer'
                : 'px-space-md py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all whitespace-nowrap cursor-pointer'
            }
          >
            Workplace Safety ({safetyCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('pay')}
            className={
              selectedCategoryTab === 'pay'
                ? 'px-space-md py-2 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary transition-all whitespace-nowrap shadow-sm cursor-pointer'
                : 'px-space-md py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all whitespace-nowrap cursor-pointer'
            }
          >
            Pay &amp; Overtime ({payCount})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategoryTab('fairness')}
            className={
              selectedCategoryTab === 'fairness'
                ? 'px-space-md py-2 rounded-lg font-label-lg text-label-lg bg-primary text-on-primary transition-all whitespace-nowrap shadow-sm cursor-pointer'
                : 'px-space-md py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-all whitespace-nowrap cursor-pointer'
            }
          >
            Fair Treatment ({fairnessCount})
          </button>
        </div>

        {/* Right Controls: Status Dropdown & Search */}
        <div className="flex items-center gap-space-sm flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-56">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tracking ID or keyword..."
              className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:bg-surface-container-lowest transition-all"
            />
          </div>
          <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg shrink-0">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
              tune
            </span>
            <label className="sr-only" htmlFor="statusFilter">
              Filter by Status
            </label>
            <select
              id="statusFilter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-label-md text-label-md text-on-surface focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="review">Under Review</option>
              <option value="progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Two-Column Master / Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Active Issue Cards Stream (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {filteredIssues.map((issue) => {
            const isSelected = selectedIssue && issue.id === selectedIssue.id;
            return (
              <article
                key={issue.id}
                onClick={() => setSelectedIssueId(issue.id)}
                className={`cursor-pointer bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all relative overflow-hidden border ${
                  isSelected
                    ? 'border-secondary-container/40 bg-gradient-to-r from-secondary-container/5 to-transparent'
                    : 'border-outline-variant/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-space-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-headline-sm text-headline-sm text-primary tracking-tight tabular-nums">
                      #{issue.id}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface-variant font-semibold">
                      {issue.categoryBadge}
                    </span>
                  </div>

                  {issue.status === 'In Progress' && (
                    <span className="px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-secondary-fixed text-on-secondary-fixed-variant font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> In Progress
                    </span>
                  )}
                  {issue.status === 'Under Review' && (
                    <span className="px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-surface-container-high text-on-surface-variant font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Under Review
                    </span>
                  )}
                  {issue.status === 'Resolved' && (
                    <span className="px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-tertiary-fixed text-on-tertiary-fixed font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>{' '}
                      Resolved
                    </span>
                  )}
                  {issue.status === 'Submitted' && (
                    <span className="px-2.5 py-0.5 rounded-full font-label-md text-label-md bg-surface-container-high text-on-surface-variant font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> Submitted
                    </span>
                  )}
                </div>

                <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-1 mb-1">
                  {issue.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 mb-space-md">
                  {issue.summary}
                </p>

                <div className="pt-space-sm bg-surface-container-low/50 rounded-lg p-space-sm flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      {issue.assignedIcon}
                    </span>
                    <span>
                      {issue.assignedOfficer}
                      {issue.assignedOfficer === 'Marcus Vance' ? ' (HSE Lead)' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {issue.isAnonymous ? (
                      <span className="inline-flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded text-on-surface font-semibold">
                        <span className="material-symbols-outlined text-[13px] text-on-surface-variant">
                          lock
                        </span>{' '}
                        Anonymous
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-tertiary-fixed text-on-tertiary-fixed px-2 py-0.5 rounded font-semibold">
                        <span className="material-symbols-outlined text-[13px]">verified_user</span>{' '}
                        Verified Worker
                      </span>
                    )}
                    <span>{issue.dateLabel}</span>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Fair Practice Pledge Banner */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-center gap-space-md">
            <div className="p-2.5 rounded-lg bg-surface-container-lowest text-primary shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary">
                Anti-Retaliation Guarantee
              </span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Under SDG 8 protections, report submissions carry absolute legal immunity from
                disciplinary or scheduling discrimination.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Detail View & Interactive Report Drawer (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-space-lg">
          {/* Collapsible Report Drawer / Inline Tab */}
          <div
            ref={reportDrawerRef}
            className="bg-surface-container-lowest rounded-xl p-space-xl shadow-md transition-all border border-outline-variant/20"
          >
            <div
              className={`flex items-center justify-between bg-surface-container-low -mx-space-xl -mt-space-xl p-space-lg ${
                isDrawerOpen ? 'mb-space-md pb-space-sm rounded-t-xl' : '-mb-space-xl rounded-xl'
              }`}
            >
              <div className="flex items-center gap-space-sm">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">add_moderator</span>
                </div>
                <div className="flex flex-col">
                  <h2 className="font-headline-md text-headline-md text-primary">
                    Submit a Confidential Report
                  </h2>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Encrypted directly to HSE Compliance Board
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isDrawerOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {isDrawerOpen && (
              <form className="flex flex-col gap-space-md" onSubmit={handleFormSubmit}>
                {/* Live Tracking ID Preview Banner */}
                <div className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-secondary">
                      fingerprint
                    </span>
                    <span className="font-label-md text-label-md text-on-surface-variant">
                      Auto-Assigned Zero-Knowledge Token:
                    </span>
                  </div>
                  <span className="font-headline-sm text-headline-sm text-primary font-mono tracking-wider tabular-nums">
                    {nextToken}
                  </span>
                </div>

                {/* Category Selector & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-lg text-label-lg text-on-surface" htmlFor="issueCategory">
                      Issue Category *
                    </label>
                    <select
                      id="issueCategory"
                      required
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                    >
                      <option value="safety">Safety Hazard (Fall, PPE, Structural)</option>
                      <option value="machinery">Unsafe Machinery / Tooling</option>
                      <option value="treatment">Unfair Treatment / Harassment</option>
                      <option value="overtime">Unrecorded Overtime / Pay Dispute</option>
                      <option value="facilities">Sanitation &amp; Rest Facilities</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-lg text-label-lg text-on-surface" htmlFor="reportLang">
                      Preferred Response Language
                    </label>
                    <select
                      id="reportLang"
                      value={reportLang}
                      onChange={(e) => setReportLang(e.target.value)}
                      className="w-full h-11 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
                    >
                      <option value="en">English (Official ILO)</option>
                      <option value="es">Español (Spanish)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="ar">العربية (Arabic)</option>
                      <option value="tl">Tagalog (Filipino)</option>
                    </select>
                  </div>
                </div>

                {/* Description Textarea */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <label className="font-label-lg text-label-lg text-on-surface" htmlFor="issueDescription">
                      Detailed Incident Description *
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleVoiceDictation}
                        className="inline-flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[15px]">mic</span>
                        <span>{isDictating ? 'Listening...' : 'Voice Dictation'}</span>
                      </button>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Be specific with dates &amp; floor locations
                      </span>
                    </div>
                  </div>
                  <textarea
                    id="issueDescription"
                    required
                    rows={4}
                    value={issueDescription}
                    onChange={(e) => setIssueDescription(e.target.value)}
                    placeholder="Describe what occurred, who was affected, and exact location or machinery tag numbers..."
                    className="w-full p-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all resize-none"
                  />
                </div>

                {/* File Upload Zone */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-label-lg text-label-lg text-on-surface">
                    Photo or Documentation Attachment
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadedPhotoName(file.name);
                        onTriggerToast(`Attached ${file.name} (GPS EXIF metadata stripped)`);
                      }
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-space-lg rounded-xl bg-surface-container-low/70 hover:bg-surface-container-low transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                  >
                    <span className="material-symbols-outlined text-[32px] text-on-surface-variant group-hover:text-secondary transition-colors mb-1">
                      cloud_upload
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface">
                      {uploadedPhotoName
                        ? `Attached: ${uploadedPhotoName} (Click to change)`
                        : 'Click to upload photo evidence or drag & drop'}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      PNG, JPG, PDF up to 25MB • Strips GPS EXIF Metadata automatically
                    </span>
                  </div>
                </div>

                {/* Anonymity Toggle Switch */}
                <div className="bg-surface-container-low p-space-md rounded-xl flex items-center justify-between gap-space-md">
                  <div className="flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-[24px] text-primary shrink-0 mt-0.5">
                      visibility_off
                    </span>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-headline-sm text-primary">
                        Submit Anonymously
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Your name, payroll ID, and digital signature will be encrypted into a
                        blinded zero-knowledge hash. Site managers and dispatchers will never see
                        your identity.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-surface-container-lowest after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface-container-lowest after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-container"></div>
                  </label>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between pt-space-xs flex-wrap gap-2">
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                      verified_user
                    </span>
                    SDG 8 Independent Audit Guard Active
                  </span>
                  <button
                    type="submit"
                    className="bg-secondary-container hover:bg-secondary text-on-secondary-container font-label-lg text-label-lg px-space-xl py-3 rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Submit Confidential Report</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Selected Issue Detail View Card */}
          {selectedIssue && (
            <section className="bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col gap-space-lg border border-outline-variant/20">
              {/* Header Detail */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-headline-md text-headline-md text-primary tracking-tight tabular-nums">
                      #{selectedIssue.id}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full font-label-sm text-label-sm bg-secondary-fixed text-on-secondary-fixed-variant font-semibold">
                      {selectedIssue.status}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-on-surface-variant font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">lock</span>{' '}
                      {selectedIssue.isAnonymous ? 'Encrypted Identity' : 'Verified Reporter'}
                    </span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    {selectedIssue.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadDossier}
                    className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                    title="Export Incident Report"
                  >
                    <span className="material-symbols-outlined text-[20px]">download</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="p-2 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
                    title="Print Dossier"
                  >
                    <span className="material-symbols-outlined text-[20px]">print</span>
                  </button>
                </div>
              </div>

              {/* Safety Lead & Assignment Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md p-space-md bg-surface-container-low rounded-xl">
                <div className="flex items-center gap-space-sm">
                  <img
                    src={selectedIssue.assignedAvatar}
                    alt={selectedIssue.assignedOfficer}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Assigned Officer
                    </span>
                    <span className="font-label-lg text-label-lg text-on-surface truncate">
                      {selectedIssue.assignedOfficer}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                      {selectedIssue.assignedRole}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Location Reference
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface">
                    {selectedIssue.locationRef}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {selectedIssue.gridRef}
                  </span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Urgency Classification
                  </span>
                  <span className="font-label-lg text-label-lg text-error flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">priority_high</span>{' '}
                    {selectedIssue.urgencyLevel}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {selectedIssue.urgencySub}
                  </span>
                </div>
              </div>

              {/* Issue Description & Evidence Graphic */}
              <div className="flex flex-col gap-space-sm">
                <h3 className="font-label-lg text-label-lg text-on-surface">
                  Investigative Overview
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {selectedIssue.fullDescription}
                </p>

                {/* Evidence Photo Gallery */}
                {selectedIssue.photos.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md mt-2">
                    {selectedIssue.photos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => setZoomedPhoto(photo)}
                        className="relative rounded-xl overflow-hidden shadow-sm group cursor-pointer"
                      >
                        <img
                          src={photo.url}
                          alt={photo.alt}
                          referrerPolicy="no-referrer"
                          className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-space-sm flex items-center justify-between text-white">
                          <span className="font-label-sm text-label-sm">{photo.caption}</span>
                          <span className="material-symbols-outlined text-[16px]">zoom_in</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timeline of Updates */}
              <div className="flex flex-col gap-space-md pt-space-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-label-lg text-label-lg text-on-surface">
                    Resolution Audit Timeline
                  </h3>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Live updates signed via HSE Ledger
                  </span>
                </div>
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-surface-container-high">
                  {selectedIssue.timeline.map((item, idx) => (
                    <div key={item.id} className="relative">
                      <span
                        className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full ring-4 ring-surface-container-lowest ${
                          idx === 0 ? 'bg-secondary-container' : 'bg-surface-container-highest'
                        }`}
                      ></span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-label-lg text-label-lg text-on-surface">
                            {item.title}
                          </span>
                          <span className="font-label-sm text-label-sm text-on-surface-variant tabular-nums">
                            {item.timestamp}
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                          {item.description}
                        </p>
                        {item.token && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface">
                              {item.token}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Worker Communication & Add Note Inline */}
              <div className="bg-surface-container-low rounded-xl p-space-md flex flex-col gap-space-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-lg text-label-lg text-on-surface">
                    Encrypted Worker Clarification Channel
                  </span>
                  <span className="font-label-sm text-label-sm text-on-tertiary-container flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">
                      enhanced_encryption
                    </span>{' '}
                    End-to-End Encrypted
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSendClarificationNote();
                      }
                    }}
                    placeholder={`Add additional observation or question for ${selectedIssue.assignedOfficer}...`}
                    className="flex-1 h-10 px-3 rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-2 focus:ring-secondary-container"
                  />
                  <button
                    type="button"
                    onClick={handleSendClarificationNote}
                    className="bg-primary text-on-primary px-space-md rounded-lg font-label-md text-label-md hover:bg-surface-container-highest hover:text-on-surface transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>Send Note</span>
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>

      {/* 24/7 HSE Beacon Emergency Dispatch Modal */}
      {beaconModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[26px]">crisis_alert</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              24/7 HSE Emergency Safety Beacon
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Triggering the HSE Beacon dispatches an immediate stop-work safety alert to{' '}
              <span className="font-semibold text-on-surface">{org.managerName}</span> and on-site
              first responders at <span className="font-semibold text-on-surface">{org.siteBadge}</span>.
            </p>
            <div className="bg-surface-container-low rounded-lg p-space-sm mb-space-md font-label-sm text-label-sm text-on-surface space-y-1">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Active Geofence Zone:</span>
                <span>{org.geofenceLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">ILO C155 Protection:</span>
                <span className="text-on-tertiary-container">Right to Refuse Unsafe Work</span>
              </div>
            </div>
            <div className="flex justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setBeaconModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setBeaconModalOpen(false);
                  onTriggerToast(
                    `24/7 HSE Emergency Beacon dispatched for ${org.geofenceLabel}. Safety officer alerted.`
                  );
                }}
                className="px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md cursor-pointer"
              >
                Dispatch Emergency Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal */}
      {zoomedPhoto && (
        <div
          onClick={() => setZoomedPhoto(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-container-lowest rounded-xl max-w-2xl w-full overflow-hidden shadow-2xl"
          >
            <img
              src={zoomedPhoto.url}
              alt={zoomedPhoto.caption}
              referrerPolicy="no-referrer"
              className="w-full max-h-[70vh] object-cover"
            />
            <div className="p-space-md flex items-center justify-between">
              <span className="font-label-lg text-label-lg text-on-surface">
                {zoomedPhoto.caption}
              </span>
              <button
                type="button"
                onClick={() => setZoomedPhoto(null)}
                className="px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
