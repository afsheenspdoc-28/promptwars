import React, { useState } from 'react';
import type { LanguageCode, NavRoute, OrgDataset } from '../types';
import { UI_TRANSLATIONS } from '../data/seedData';

interface OverviewViewProps {
  org: OrgDataset;
  language: LanguageCode;
  onNavigate: (route: NavRoute) => void;
  onPunchAction: (action: 'clock_out' | 'clock_in' | 'break_toggle') => Promise<void>;
  onTriggerToast: (msg: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  org,
  language,
  onNavigate,
  onPunchAction,
  onTriggerToast,
}) => {
  const [isClockingOut, setIsClockingOut] = useState(false);
  const [charterModal, setCharterModal] = useState<'charter' | 'union' | null>(null);
  const t = UI_TRANSLATIONS[language];
  const firstName = org.workerName.split(' ')[0];

  const handleClockAction = async () => {
    setIsClockingOut(true);
    const nextAction = org.dutyState === 'Clocked Out' ? 'clock_in' : 'clock_out';
    setTimeout(async () => {
      await onPunchAction(nextAction);
      setIsClockingOut(false);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      onTriggerToast(
        nextAction === 'clock_out'
          ? `Clock-out registered for ${org.workerName} at ${timeStr}. Shift logs synced with ${org.name}.`
          : `Clock-in registered for ${org.workerName} at ${timeStr}. Active shift started.`
      );
    }, 650);
  };

  return (
    <div className="max-w-[1440px] w-full mx-auto space-y-space-xl">
      {/* Top Header Area */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pt-2">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-md text-label-md mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-secondary-container"></span>
            <span>{org.siteBadge}</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
            {t.goodMorning}, {firstName}
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            {t.workSummaryToday}
          </p>
        </div>
        <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-xl shadow-sm text-on-surface-variant font-label-md text-label-md self-start md:self-auto">
          <span className="material-symbols-outlined text-[18px] text-secondary">
            calendar_today
          </span>
          <span className="font-medium text-on-surface">{org.dateBanner}</span>
          <span className="opacity-40">•</span>
          <span>{org.shiftBanner}</span>
        </div>
      </header>

      {/* Section A: Today's Work */}
      <section aria-label="Today's Work Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
          {/* Card 1: Attendance */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[170px] border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Attendance
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-tertiary-container/10 text-on-tertiary-container font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                {org.dutyState === 'Clocked Out' ? 'Shift Completed' : 'Present'}
              </span>
            </div>
            <div className="space-y-1 my-2">
              <div className="font-headline-md text-headline-md text-on-surface tabular-nums">
                {org.dutyState === 'Clocked Out'
                  ? `Completed Shift (In: ${org.clockInTime})`
                  : `Clocked in at ${org.clockInTime}`}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Shift allocation: 8.0h total duration
              </p>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[15px] text-on-tertiary-container">
                verified
              </span>
              <span>{org.gateVerification}</span>
            </div>
          </div>

          {/* Card 2: Hours Worked */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[170px] border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Hours Worked
              </span>
              <span className="font-label-sm text-label-sm text-secondary font-medium tabular-nums">
                {org.completionPercent}% Complete
              </span>
            </div>
            <div className="my-2">
              <div className="flex items-baseline gap-2">
                <span className="font-display-lg text-[2.25rem] leading-none text-on-surface font-bold tabular-nums">
                  {org.hoursWorkedLabel}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {org.scheduledHoursLabel}
                </span>
              </div>
              <div className="w-full bg-surface-container h-2 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-secondary-container h-full rounded-full transition-all duration-500"
                  style={{ width: `${org.completionPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
              <span>{org.remainingTodayLabel}</span>
              <span className="text-on-surface font-medium">{org.breakTakenLabel}</span>
            </div>
          </div>

          {/* Card 3: Overtime */}
          <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between h-full min-h-[170px] border border-outline-variant/20">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Overtime
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium">
                {org.overtimeCapLabel}
              </span>
            </div>
            <div className="space-y-1 my-2">
              <div className="font-display-lg text-[2.25rem] leading-none text-on-surface font-bold tabular-nums">
                {org.overtimeRecordedLabel}
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Recorded this pay cycle
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">
                check_circle
              </span>
              <span className="text-on-surface font-medium">Approved by Site Lead</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Quick Actions */}
      <section aria-label="Quick Actions">
        <div className="flex items-center justify-between mb-space-sm">
          <h2 className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-on-surface-variant">
            {t.quickActions}
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            Direct worker workflows
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
          {/* Action 1: Clock Out / In */}
          <button
            type="button"
            onClick={handleClockAction}
            disabled={isClockingOut}
            className="group text-left bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-lg rounded-xl shadow-sm hover:shadow-md flex flex-col justify-between gap-space-md focus:outline-none border border-outline-variant/20 cursor-pointer"
          >
            {isClockingOut ? (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center animate-spin">
                    <span className="material-symbols-outlined text-[20px]">sync</span>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                    Confirming
                  </span>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Logging Timestamp...
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    Recording biometric timestamp
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px]">
                      {org.dutyState === 'Clocked Out' ? 'timer' : 'timer_off'}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                    Primary
                  </span>
                </div>
                <div>
                  <div className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1">
                    <span>
                      {org.dutyState === 'Clocked Out' ? 'Clock Back In' : t.clockOut}
                    </span>
                    <span className="material-symbols-outlined text-[18px] opacity-0 group-hover:opacity-100 transition-opacity text-secondary">
                      arrow_forward
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {org.dutyState === 'Clocked Out'
                      ? 'Resume morning roster shift'
                      : 'End morning roster shift'}
                  </p>
                </div>
              </>
            )}
          </button>

          {/* Action 2: View Payslip */}
          <button
            type="button"
            onClick={() => onNavigate('my-payslips')}
            className="group text-left bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-lg rounded-xl shadow-sm hover:shadow-md flex flex-col justify-between gap-space-md border border-outline-variant/20 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">payments</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant opacity-40 group-hover:opacity-100 transition-opacity">
                open_in_new
              </span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1">
                <span>{t.viewPayslip}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                October period available
              </p>
            </div>
          </button>

          {/* Action 3: Report an Issue */}
          <button
            type="button"
            onClick={() => onNavigate('grievances-and-safety')}
            className="group text-left bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-lg rounded-xl shadow-sm hover:shadow-md flex flex-col justify-between gap-space-md border border-outline-variant/20 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">shield</span>
              </div>
              <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                Confidential
              </span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1">
                <span>{t.reportAnIssue}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Log safety hazard or concern
              </p>
            </div>
          </button>

          {/* Action 4: Submit Feedback */}
          <button
            type="button"
            onClick={() => onNavigate('feedback')}
            className="group text-left bg-surface-container-lowest hover:bg-surface-container-low transition-all p-space-lg rounded-xl shadow-sm hover:shadow-md flex flex-col justify-between gap-space-md border border-outline-variant/20 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="w-10 h-10 rounded-lg bg-surface-container text-on-surface flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant opacity-40 group-hover:opacity-100 transition-opacity">
                arrow_forward
              </span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-1">
                <span>{t.submitFeedback}</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Work conditions &amp; amenities
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Section C: Important Updates */}
      <section aria-label="Important Updates">
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg md:p-space-xl border border-outline-variant/20">
          <div className="flex items-center justify-between pb-space-md mb-space-md">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                {t.importantUpdates}
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Real-time status on your logs, payroll, and tickets
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="font-label-lg text-label-lg text-secondary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>

          <div className="space-y-space-sm">
            {org.importantUpdates.map((item) => (
              <div
                key={item.id}
                onClick={() => onNavigate(item.targetRoute)}
                className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-start gap-space-md min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg bg-surface-container-lowest ${item.iconColorClass} flex items-center justify-center shrink-0 shadow-sm mt-0.5 sm:mt-0`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        {item.title}
                      </span>
                      <span
                        className={
                          item.badgeTone === 'success'
                            ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-tertiary-container/10 text-on-tertiary-container font-label-sm text-label-sm font-medium'
                            : item.badgeTone === 'neutral'
                              ? 'inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm font-medium'
                              : 'inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-medium'
                        }
                      >
                        {item.badgeText}
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 text-on-surface-variant font-label-sm text-label-sm pl-12 sm:pl-0">
                  <span>{item.timeLabel}</span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant opacity-60">
                    arrow_forward_ios
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Support & SDG 8 Transparency Banner */}
      <footer className="bg-surface-container-low rounded-xl p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md text-on-surface-variant font-label-sm text-label-sm">
        <div className="flex items-center gap-space-md">
          <div className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-tertiary-container flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
          </div>
          <div>
            <p className="font-medium text-on-surface">
              Independent Worker Advocacy &amp; Labor Standards Compliance
            </p>
            <p className="text-on-surface-variant mt-0.5">
              Protected under UN SDG 8 • Confidential worker support hotline:{' '}
              <span className="font-semibold text-on-surface">1-800-FAIR-WORK</span> (Ext 4)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-space-md shrink-0">
          <button
            type="button"
            onClick={() => setCharterModal('charter')}
            className="text-on-surface-variant hover:text-on-surface transition-colors underline cursor-pointer"
          >
            Fair Rostering Charter
          </button>
          <span className="opacity-40">•</span>
          <button
            type="button"
            onClick={() => setCharterModal('union')}
            className="text-on-surface-variant hover:text-on-surface transition-colors underline cursor-pointer"
          >
            Union Representative Direct Contact
          </button>
        </div>
      </footer>

      {/* Charter / Union Info Modal */}
      {charterModal && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                {charterModal === 'charter'
                  ? 'UN SDG 8 Fair Rostering Charter'
                  : 'Union Representative Direct Channel'}
              </h3>
              <button
                type="button"
                onClick={() => setCharterModal(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              {charterModal === 'charter'
                ? 'All shifts on FairShift enforce a minimum 11-hour mandatory rest interval between turns, 1.5x certified overtime calculation, and cryptographically signed timesheet logs that cannot be altered without dual worker-supervisor audit entries.'
                : `Your designated ILO C155 Worker Advocacy Liaison for ${org.name} is available 24/7 via hotline 1-800-FAIR-WORK (Ext 4) or through the Encrypted Worker Clarification Channel in Grievances & Safety.`}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCharterModal(null)}
                className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md"
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
