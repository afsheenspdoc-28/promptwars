import React, { useEffect, useState } from 'react';
import type { OrgDataset } from '../types';
import { QrCodeScannerModal } from './QrCodeScannerModal';

interface AttendanceViewProps {
  org: OrgDataset;
  onPunchAction: (action: 'clock_in' | 'break_toggle' | 'clock_out' | 'qr_checkin') => Promise<void>;
  onSubmitDispute: (payload: {
    shiftTarget: string;
    proposedClockIn: string;
    proposedClockOut: string;
    reason: string;
  }) => Promise<string>;
  onTriggerToast: (msg: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  org,
  onPunchAction,
  onSubmitDispute,
  onTriggerToast,
}) => {
  const [secondsElapsed, setSecondsElapsed] = useState(org.elapsedSeconds);
  const [monthFilter, setMonthFilter] = useState<string>('oct-2024');
  const [shiftTypeFilter, setShiftTypeFilter] = useState<string>('all');

  const [endShiftModalOpen, setEndShiftModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState('Morning Shift (Oct 28, 2024)');
  const [proposedIn, setProposedIn] = useState('07:00');
  const [proposedOut, setProposedOut] = useState('15:30');
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    setSecondsElapsed(org.elapsedSeconds);
  }, [org.id, org.elapsedSeconds]);

  useEffect(() => {
    if (org.dutyState !== 'Active on Shift') return;
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [org.dutyState]);

  const formatTimer = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600)
      .toString()
      .padStart(2, '0');
    const mins = Math.floor((totalSecs % 3600) / 60)
      .toString()
      .padStart(2, '0');
    const secs = (totalSecs % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const filteredShifts = org.shifts.filter((shift) => {
    const matchesMonth = monthFilter === 'all' || shift.monthKey === monthFilter;
    const matchesType = shiftTypeFilter === 'all' || shift.shiftType === shiftTypeFilter;
    return matchesMonth && matchesType;
  });

  const handleOpenDispute = (shiftName: string, dateText: string) => {
    setDisputeTarget(`${shiftName} (${dateText})`);
    setDisputeReason('');
    setDisputeModalOpen(true);
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = await onSubmitDispute({
      shiftTarget: disputeTarget,
      proposedClockIn: proposedIn,
      proposedClockOut: proposedOut,
      reason: disputeReason,
    });
    setDisputeModalOpen(false);
    onTriggerToast(`Dispute ticket registered under Reference #${ticketId}`);
  };

  const handleConfirmEndShift = async () => {
    setEndShiftModalOpen(false);
    await onPunchAction('clock_out');
    onTriggerToast(
      'Shift ended successfully. Punch recorded at ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
  };

  const handleBreakToggle = async () => {
    await onPunchAction('break_toggle');
    onTriggerToast(
      org.dutyState === 'On Break'
        ? 'Break ended. Active shift timer resumed at ' + new Date().toLocaleTimeString()
        : 'Break mode initiated at ' + new Date().toLocaleTimeString()
    );
  };

  const handleQrScanConfirm = async () => {
    setQrModalOpen(false);
    await onPunchAction('qr_checkin');
    onTriggerToast(`QR Worksite Check-In verified for ${org.geofenceLabel}`);
  };

  const exportTimesheetCSV = () => {
    const rows = [
      ['Date', 'Shift Profile', 'Site', 'Scheduled Window', 'Clock In', 'Clock Out', 'Paid Hours', 'Overtime', 'Audit Status'],
      ...filteredShifts.map((s) => [
        s.dateLabel.replace(',', ''),
        s.shiftProfile,
        s.siteDetail,
        s.scheduledWindow,
        s.clockIn,
        s.clockOut,
        s.paidHours,
        s.overtime,
        s.auditStatus,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FairShift_Timesheet_${org.id}_2024.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onTriggerToast(`Downloaded FairShift_Timesheet_${org.id}_2024.csv`);
  };

  return (
    <div className="flex flex-col w-full">
      {/* Status & Header Meta Strip */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">Attendance &amp; Shifts</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Active Roster &amp; Shift Ledger
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Verified continuous recording aligned with Fair Work Standards (SDG 8.8 compliance).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm self-start md:self-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface font-label-md text-label-md">
            <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
            <span>{org.geofenceLabel}</span>
          </div>
          <button
            type="button"
            onClick={() => setQrModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              qr_code_scanner
            </span>
            <span>QR Check-In</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenDispute('General Query', 'Recent period')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
            <span>Audit Log</span>
          </button>
        </div>
      </div>

      {/* Hero Shift Control & Context Banner (Bento 12-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md mb-space-xl">
        {/* Left: Live Clock Status Card (Primary Action Hub) */}
        <div className="lg:col-span-7 bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col justify-between relative overflow-hidden border border-outline-variant/20">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-secondary/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between pb-space-md mb-space-md">
              <div className="flex items-center gap-space-sm">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-tertiary-container text-tertiary-fixed">
                  <span className="material-symbols-outlined text-[20px]">timelapse</span>
                </span>
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Duty State
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        org.dutyState === 'Active on Shift'
                          ? 'bg-on-tertiary-container'
                          : org.dutyState === 'On Break'
                            ? 'bg-amber-500'
                            : 'bg-outline'
                      }`}
                    ></span>
                    <span className="font-headline-sm text-headline-sm text-primary">
                      {org.dutyState}
                    </span>
                  </div>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md">
                {org.punchEarlyNote}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-lg items-center my-space-md bg-surface-container-low/60 rounded-xl p-space-md">
              <div>
                <div className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
                  Elapsed Work Time
                </div>
                <div
                  className="font-display-lg text-display-lg text-primary tracking-tight font-mono leading-none tabular-nums"
                  id="liveClockTimer"
                >
                  {formatTimer(secondsElapsed)}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
                    check_circle
                  </span>
                  <span>Complies with mandatory rest interval rules</span>
                </div>
              </div>

              {/* Micro Visual Meter: Shift Target Completion */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-on-surface-variant font-label-sm text-label-sm">
                  <span>Shift Progress (8.0h cap)</span>
                  <span className="font-semibold text-primary tabular-nums">70.1%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: '70.1%' }}
                  ></div>
                </div>
                <div className="flex justify-between text-on-surface-variant font-label-sm text-label-sm pt-0.5 tabular-nums">
                  <span>07:00 AM</span>
                  <span className="font-medium text-secondary">03:30 PM Target</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-space-md mt-space-sm flex flex-wrap sm:flex-nowrap items-center gap-space-sm">
            <button
              type="button"
              onClick={handleBreakToggle}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-primary-container text-on-primary hover:bg-primary font-label-lg text-label-lg transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">coffee</span>
              <span>
                {org.dutyState === 'On Break' ? 'Resume Shift from Break' : 'Clock Out for Break'}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                org.dutyState === 'Clocked Out'
                  ? onPunchAction('clock_in')
                  : setEndShiftModalOpen(true)
              }
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px] text-error">logout</span>
              <span>
                {org.dutyState === 'Clocked Out' ? 'Start New Shift' : 'End Shift Clock Out'}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Assignment & Fatigue Guardrails Card */}
        <div className="lg:col-span-5 flex flex-col gap-space-md">
          {/* Today's Assignment Overview */}
          <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex-1 flex flex-col justify-between border border-outline-variant/20">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                  Today&apos;s Assignment
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {org.rosterId}
                </span>
              </div>
              <h2 className="font-headline-md text-headline-md text-primary mb-1">
                {org.assignmentTitle}
              </h2>
              <div className="flex items-start gap-2 mt-2 text-on-surface-variant font-body-md text-body-md">
                <span className="material-symbols-outlined text-[20px] text-secondary shrink-0 mt-0.5">
                  location_on
                </span>
                <div>
                  <p className="text-on-surface font-medium">{org.assignmentLocation}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {org.assignmentDistrict}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-space-md pt-space-sm grid grid-cols-2 gap-space-sm bg-surface-container-low rounded-lg p-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  hourglass_bottom
                </span>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">
                    Billable Hours
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    {org.billableHoursLabel}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  restaurant
                </span>
                <div>
                  <span className="block font-label-sm text-label-sm text-on-surface-variant">
                    Meal Interval
                  </span>
                  <span className="font-label-lg text-label-lg text-on-surface font-semibold">
                    {org.mealIntervalLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Fatigue & Safety Compliance Pill */}
          <div className="bg-surface-container-low rounded-xl p-space-md flex items-center justify-between gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
              </div>
              <div>
                <div className="font-label-lg text-label-lg text-on-surface font-semibold">
                  Fatigue Protection Active
                </div>
                <div className="font-body-sm text-body-sm text-on-surface-variant">
                  Min. 11h mandatory rest buffer prior to next turn.
                </div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface font-label-sm text-label-sm whitespace-nowrap shadow-sm tabular-nums">
              {org.restBankLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Compact 4-Column Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
        {/* Card 1 */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-md text-label-md uppercase tracking-wider">
              Total Hours Month
            </span>
            <span className="material-symbols-outlined text-[20px] text-secondary">pace</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary tracking-tight tabular-nums">
              {org.monthlyStats.totalHours}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">hrs</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-on-tertiary-container">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            <span>{org.monthlyStats.quotaNote}</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-md text-label-md uppercase tracking-wider">
              Punctuality Rate
            </span>
            <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">
              schedule_send
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary tracking-tight tabular-nums">
              {org.monthlyStats.punctualityRate}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">on-time</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-on-surface-variant">
            <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
            <span>Top Tier transparent attendance rating</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-md text-label-md uppercase tracking-wider">
              Overtime Hours
            </span>
            <span className="material-symbols-outlined text-[20px] text-secondary-container">
              alarm_on
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary tracking-tight tabular-nums">
              {org.monthlyStats.overtimeHours}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">hrs logged</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-secondary">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            <span>1.5x Premium rate certified</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-md flex flex-col justify-between border border-outline-variant/20">
          <div className="flex items-center justify-between text-on-surface-variant mb-2">
            <span className="font-label-md text-label-md uppercase tracking-wider">
              Approved Leave
            </span>
            <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
              event_available
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline-lg text-headline-lg text-primary tracking-tight tabular-nums">
              {org.monthlyStats.approvedLeave}
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">days bal</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2 font-label-sm text-label-sm text-on-surface-variant">
            <span>{org.monthlyStats.leaveSub}</span>
          </div>
        </div>
      </div>

      {/* Attendance History Table Section */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col border border-outline-variant/20">
        {/* Table Toolbar & Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg">
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative inline-flex items-center">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 pointer-events-none">
                calendar_month
              </span>
              <select
                value={monthFilter}
                onChange={(e) => {
                  setMonthFilter(e.target.value);
                  onTriggerToast('Table view updated for period selection');
                }}
                className="h-10 pl-9 pr-8 rounded-lg bg-surface-container-low font-label-lg text-label-lg text-on-surface focus:outline-none cursor-pointer appearance-none"
              >
                <option value="oct-2024">October 2024 (Current)</option>
                <option value="sep-2024">September 2024</option>
                <option value="aug-2024">August 2024</option>
                <option value="all">All Logged Months</option>
              </select>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2.5 pointer-events-none">
                expand_more
              </span>
            </div>

            <div className="relative inline-flex items-center">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 pointer-events-none">
                tune
              </span>
              <select
                value={shiftTypeFilter}
                onChange={(e) => {
                  setShiftTypeFilter(e.target.value);
                  onTriggerToast('Filtered by shift profile');
                }}
                className="h-10 pl-9 pr-8 rounded-lg bg-surface-container-low font-label-lg text-label-lg text-on-surface focus:outline-none cursor-pointer appearance-none"
              >
                <option value="all">All Shift Types</option>
                <option value="morning">Morning Shifts</option>
                <option value="afternoon">Afternoon Shifts</option>
                <option value="overtime">Overtime Runs</option>
                <option value="statutory">Statutory / Holidays</option>
              </select>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2.5 pointer-events-none">
                expand_more
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm self-end md:self-auto">
            <button
              type="button"
              onClick={exportTimesheetCSV}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              <span>Print Timesheet</span>
            </button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left font-body-md text-body-md">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="py-3 px-4 rounded-l-lg">Date</th>
                <th className="py-3 px-4">Shift Profile</th>
                <th className="py-3 px-4">Scheduled Window</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4 text-center">Paid Hours</th>
                <th className="py-3 px-4 text-center">Overtime</th>
                <th className="py-3 px-4">Audit Status</th>
                <th className="py-3 px-4 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="text-on-surface divide-y divide-outline-variant/15">
              {filteredShifts.map((shift) => (
                <tr key={shift.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="py-4 px-4 font-semibold text-primary">
                    {shift.dateLabel}
                    <span className="block font-label-sm text-label-sm text-on-surface-variant font-normal">
                      {shift.dayName}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-medium text-primary">{shift.shiftProfile}</span>
                    <span className="block font-body-sm text-body-sm text-on-surface-variant">
                      {shift.siteDetail}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-on-surface-variant font-mono text-body-sm tabular-nums">
                    {shift.scheduledWindow}
                  </td>
                  <td className="py-4 px-4">
                    {shift.isLive ? (
                      <div className="flex items-center gap-1.5 font-mono text-body-sm font-medium text-primary tabular-nums">
                        <span className="w-2 h-2 rounded-full bg-on-tertiary-container"></span>
                        {shift.clockIn}
                      </div>
                    ) : (
                      <span className="font-mono text-body-sm tabular-nums">{shift.clockIn}</span>
                    )}
                  </td>
                  <td
                    className={`py-4 px-4 font-mono text-body-sm tabular-nums ${
                      shift.clockOut === 'In progress...'
                        ? 'text-on-surface-variant italic'
                        : ''
                    }`}
                  >
                    {shift.clockOut}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-medium text-primary tabular-nums">
                    {shift.paidHours}
                  </td>
                  <td
                    className={`py-4 px-4 text-center font-mono tabular-nums ${
                      shift.overtime.startsWith('+')
                        ? 'font-semibold text-secondary'
                        : 'text-on-surface-variant'
                    }`}
                  >
                    {shift.overtime}
                  </td>
                  <td className="py-4 px-4">
                    {shift.auditStatus === 'Live Active' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-medium">
                        Live Active
                      </span>
                    )}
                    {shift.auditStatus === 'Approved Overtime' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                        Approved Overtime
                      </span>
                    )}
                    {shift.auditStatus === 'Present' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                        Present
                      </span>
                    )}
                    {shift.auditStatus === 'Holiday' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-medium">
                        Holiday
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {shift.isMandatoryPaid ? (
                      <span className="font-label-sm text-label-sm text-on-surface-variant pr-2">
                        Mandatory Paid
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenDispute(shift.shiftProfile, shift.dateLabel)}
                        title="Request punch adjustment"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-on-surface-variant hover:text-primary hover:bg-surface-container font-label-sm text-label-sm transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                        <span>Adjust</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table Pagination / Summary Note */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-sm pt-space-lg mt-space-md text-on-surface-variant font-label-sm text-label-sm">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-on-tertiary-container">
              encrypted
            </span>
            <span>
              Cryptographically signed timesheet logs submitted for end-of-month payroll clearance.
            </span>
          </div>
          <div className="flex items-center gap-1 font-label-md text-label-md">
            <span>Showing {filteredShifts.length} of 21 logged shifts</span>
          </div>
        </div>
      </div>

      {/* End Shift Confirmation Modal */}
      {endShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl relative border border-outline-variant/20">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
              <span className="material-symbols-outlined text-[26px]">door_front</span>
            </div>
            <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
              Confirm Shift Conclusion
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
              You are clocking out of{' '}
              <span className="font-semibold text-primary">{org.siteBadge}</span>. Total calculated
              logged time will be recorded as{' '}
              <span className="font-mono font-medium text-primary tabular-nums">
                {formatTimer(secondsElapsed)}
              </span>
              .
            </p>
            <div className="bg-surface-container-low rounded-lg p-space-sm mb-space-lg text-on-surface font-body-sm text-body-sm space-y-1">
              <div className="flex justify-between text-on-surface-variant">
                <span>Clock In Timestamp</span>
                <span className="font-mono text-on-surface tabular-nums">{org.clockInTime}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Current Timestamp</span>
                <span className="font-mono text-on-surface tabular-nums">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Meal break claimed</span>
                <span className="font-medium text-on-tertiary-container">0 min (continuous)</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-space-sm">
              <button
                type="button"
                onClick={() => setEndShiftModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEndShift}
                className="px-5 py-2.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-colors cursor-pointer"
              >
                Confirm Punch Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Dispute & Correction Modal */}
      {disputeModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-lg w-full p-space-lg shadow-xl relative border border-outline-variant/20">
            <div className="flex items-center justify-between pb-space-sm mb-space-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-secondary">
                  pending_actions
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Request Time Correction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDisputeModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              In accordance with FairShift fair wage policy, all punch discrepancy claims are
              audited within 24 hours with supervisor log correlation.
            </p>
            <form className="space-y-space-md" onSubmit={handleDisputeSubmit}>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">
                  Target Shift Record
                </label>
                <input
                  type="text"
                  readOnly
                  value={disputeTarget}
                  className="w-full h-10 px-3 bg-surface-container-low rounded-lg font-body-md text-body-md text-on-surface focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-space-sm">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Proposed Clock In
                  </label>
                  <input
                    type="time"
                    required
                    value={proposedIn}
                    onChange={(e) => setProposedIn(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-mono text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                    Proposed Clock Out
                  </label>
                  <input
                    type="time"
                    required
                    value={proposedOut}
                    onChange={(e) => setProposedOut(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-mono text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Reason for Dispute
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="e.g., Scanner malfunction at Gate 3; verified by Supervisor Marco..."
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm resize-none"
                />
              </div>
              <div className="flex items-center justify-end gap-space-sm pt-space-xs">
                <button
                  type="button"
                  onClick={() => setDisputeModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-secondary-container hover:bg-secondary text-on-secondary-container hover:text-on-secondary font-label-lg text-label-lg transition-colors shadow-sm cursor-pointer"
                >
                  Submit Dispute Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera-Enabled QR Worksite Check-In Modal */}
      <QrCodeScannerModal
        org={org}
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        onScanSuccess={handleQrScanConfirm}
      />
    </div>
  );
};
