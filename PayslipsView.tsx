import React, { useState } from 'react';
import type { OrgDataset, PayslipItem } from '../types';

interface PayslipsViewProps {
  org: OrgDataset;
  onFlagDiscrepancy: (payslipId: string, note: string) => Promise<void>;
  onTriggerToast: (msg: string) => void;
}

export const PayslipsView: React.FC<PayslipsViewProps> = ({
  org,
  onFlagDiscrepancy,
  onTriggerToast,
}) => {
  const [selectedSlipId, setSelectedSlipId] = useState<string>(org.payslips[0]?.id || '');
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [discrepancyText, setDiscrepancyText] = useState('');

  const slip: PayslipItem =
    org.payslips.find((p) => p.id === selectedSlipId) || org.payslips[0];

  if (!slip) return null;

  const grossTotal = slip.basePay + slip.overtimePay + slip.allowances;
  const basePct = Math.round((slip.basePay / grossTotal) * 100);
  const otPct = Math.round((slip.overtimePay / grossTotal) * 100);
  const allowPct = Math.max(100 - basePct - otPct, 5);

  const handleDownloadPayslip = () => {
    const text = [
      `FAIRSHIFT VERIFIED TRANSPARENT PAYSLIP`,
      `======================================`,
      `Organization: ${org.name}`,
      `Employee: ${org.workerName} (${org.workerRole})`,
      `Roster ID: ${org.rosterId}`,
      `Pay Period: ${slip.periodLabel}`,
      `Status: ${slip.status}`,
      ``,
      `EARNINGS BREAKDOWN:`,
      `1. Base Pay (${slip.baseHours} hrs @ ${slip.currency}${slip.hourlyRate.toFixed(2)}/hr): ${slip.currency}${slip.basePay.toFixed(2)}`,
      `2. Certified Overtime (${slip.overtimeHours} hrs @ ${slip.overtimeMultiplier}x = ${slip.currency}${(slip.hourlyRate * slip.overtimeMultiplier).toFixed(2)}/hr): ${slip.currency}${slip.overtimePay.toFixed(2)}`,
      `3. ${slip.allowanceLabel}: ${slip.currency}${slip.allowances.toFixed(2)}`,
      `--------------------------------------`,
      `Gross Earnings: ${slip.currency}${grossTotal.toFixed(2)}`,
      `Statutory Deductions (${slip.deductionLabel}): -${slip.currency}${slip.deductions.toFixed(2)}`,
      `--------------------------------------`,
      `NET VERIFIED PAY: ${slip.currency}${slip.netPay.toFixed(2)}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FairShift_Payslip_${slip.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onTriggerToast(`Downloaded itemized payslip ${slip.id}`);
  };

  const handleSubmitFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discrepancyText.trim()) return;
    await onFlagDiscrepancy(slip.id, discrepancyText.trim());
    setDiscrepancyModalOpen(false);
    setDiscrepancyText('');
    onTriggerToast(`Salary discrepancy flagged on ${slip.id} for Payroll Auditor review`);
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">My Payslips</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Transparent Wage Ledger &amp; Payslips
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Complete formulaic wage breakdowns with zero unexplained deductions (SDG 8.5 Equal &amp; Transparent Remuneration).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <div className="relative inline-flex items-center">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 pointer-events-none">
              receipt_long
            </span>
            <select
              value={slip.id}
              onChange={(e) => setSelectedSlipId(e.target.value)}
              className="h-10 pl-9 pr-8 rounded-lg bg-surface-container-low font-label-lg text-label-lg text-on-surface focus:outline-none cursor-pointer appearance-none"
            >
              {org.payslips.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.periodLabel}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant absolute right-2.5 pointer-events-none">
              expand_more
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDiscrepancyModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">flag</span>
            <span>Flag Discrepancy</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPayslip}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Download Payslip</span>
          </button>
        </div>
      </div>

      {/* Specialized Domain Component: Transparent Wage Ledger */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg md:p-space-xl border border-outline-variant/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pb-space-lg border-b border-outline-variant/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant">
                Verified Net Take-Home Pay • {slip.periodLabel}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                  slip.status === 'Approved'
                    ? 'bg-tertiary-container/10 text-on-tertiary-container'
                    : 'bg-error-container text-on-error-container'
                }`}
              >
                {slip.status}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="font-display-lg text-display-lg text-primary font-mono tabular-nums">
                {slip.currency}
                {slip.netPay.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Disbursement Date: <strong className="text-on-surface">{slip.payDate}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-space-md bg-surface-container-low p-space-md rounded-xl">
            <div>
              <span className="block font-label-sm text-label-sm text-on-surface-variant">
                Base Hourly Rate
              </span>
              <span className="font-headline-sm text-headline-sm text-primary font-mono tabular-nums">
                {slip.currency}
                {slip.hourlyRate.toFixed(2)}/hr
              </span>
            </div>
            <div>
              <span className="block font-label-sm text-label-sm text-on-surface-variant">
                OT Rate ({slip.overtimeMultiplier}x)
              </span>
              <span className="font-headline-sm text-headline-sm text-secondary font-mono tabular-nums">
                {slip.currency}
                {(slip.hourlyRate * slip.overtimeMultiplier).toFixed(2)}/hr
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="block font-label-sm text-label-sm text-on-surface-variant">
                Total Verified Hours
              </span>
              <span className="font-headline-sm text-headline-sm text-on-tertiary-container font-mono tabular-nums">
                {(slip.baseHours + slip.overtimeHours).toFixed(1)} hrs
              </span>
            </div>
          </div>
        </div>

        {/* Segmented Metric Bar */}
        <div className="py-space-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-label-md text-label-md text-on-surface font-semibold">
              Transparent Wage Composition (Gross {slip.currency}
              {grossTotal.toFixed(2)})
            </span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              100% Formula-Audited
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-surface-container overflow-hidden flex gap-0.5 p-0.5">
            <div
              className="bg-primary-container h-full rounded-l-full transition-all"
              style={{ width: `${basePct}%` }}
              title={`Base Pay: ${basePct}%`}
            ></div>
            <div
              className="bg-secondary-container h-full transition-all"
              style={{ width: `${otPct}%` }}
              title={`Overtime: ${otPct}%`}
            ></div>
            <div
              className="bg-on-tertiary-container h-full rounded-r-full transition-all"
              style={{ width: `${allowPct}%` }}
              title={`Allowances: ${allowPct}%`}
            ></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-space-md mt-space-md">
            <div className="p-space-md rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-primary-container"></span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Standard Base Pay
                </span>
              </div>
              <div className="font-headline-md text-headline-md text-primary font-mono tabular-nums">
                {slip.currency}
                {slip.basePay.toFixed(2)}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-mono tabular-nums">
                {slip.baseHours}h × {slip.currency}
                {slip.hourlyRate.toFixed(2)}/hr
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Overtime Premium
                </span>
              </div>
              <div className="font-headline-md text-headline-md text-secondary font-mono tabular-nums">
                +{slip.currency}
                {slip.overtimePay.toFixed(2)}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 font-mono tabular-nums">
                {slip.overtimeHours}h × {slip.currency}
                {(slip.hourlyRate * slip.overtimeMultiplier).toFixed(2)}/hr ({slip.overtimeMultiplier}x)
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container"></span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Site &amp; Skill Stipends
                </span>
              </div>
              <div className="font-headline-md text-headline-md text-on-tertiary-container font-mono tabular-nums">
                +{slip.currency}
                {slip.allowances.toFixed(2)}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                {slip.allowanceLabel}
              </div>
            </div>

            <div className="p-space-md rounded-xl bg-surface-container-low">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Statutory Deductions
                </span>
              </div>
              <div className="font-headline-md text-headline-md text-on-surface font-mono tabular-nums">
                -{slip.currency}
                {slip.deductions.toFixed(2)}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 truncate">
                {slip.deductionLabel}
              </div>
            </div>
          </div>
        </div>

        {slip.discrepancyNote && (
          <div className="mt-space-sm p-space-md rounded-xl bg-error-container/40 text-on-surface flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-error mt-0.5">
              priority_high
            </span>
            <div>
              <div className="font-label-md text-label-md font-semibold text-error">
                Discrepancy Flagged for Payroll Audit
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {slip.discrepancyNote}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Flag Salary Discrepancy Modal */}
      {discrepancyModalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-sm">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Flag Wage or Overtime Discrepancy
              </h3>
              <button
                type="button"
                onClick={() => setDiscrepancyModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
              Describe any missing hours, allowance calculation questions, or deduction inquiries for{' '}
              <strong>{slip.periodLabel}</strong>.
            </p>
            <form onSubmit={handleSubmitFlag} className="space-y-space-md">
              <textarea
                rows={4}
                required
                value={discrepancyText}
                onChange={(e) => setDiscrepancyText(e.target.value)}
                placeholder="e.g., Sunday overtime shift on Oct 27 should include High-Elevation Rigging differential..."
                className="w-full p-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary-container"
              />
              <div className="flex justify-end gap-space-sm">
                <button
                  type="button"
                  onClick={() => setDiscrepancyModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-secondary-container text-on-secondary-container font-label-md text-label-md cursor-pointer"
                >
                  Submit Audit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
