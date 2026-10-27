import React, { useState } from 'react';
import type { OrgDataset } from '../types';

interface SkillsViewProps {
  org: OrgDataset;
  onAddSkill: (payload: {
    skillName: string;
    category: string;
    issuer: string;
    expiryDate: string;
  }) => Promise<void>;
  onToggleShare: (skillId: string, shared: boolean) => Promise<void>;
  onTriggerToast: (msg: string) => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({
  org,
  onAddSkill,
  onToggleShare,
  onTriggerToast,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [skillName, setSkillName] = useState('');
  const [category, setCategory] = useState('Workplace Safety');
  const [issuer, setIssuer] = useState('');
  const [expiryDate, setExpiryDate] = useState('Oct 28, 2027');

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillName.trim()) return;
    await onAddSkill({
      skillName: skillName.trim(),
      category,
      issuer: issuer.trim() || 'ILO & Industry Qualification Board',
      expiryDate,
    });
    setSkillName('');
    setIssuer('');
    setModalOpen(false);
    onTriggerToast('Credential added to your portable Digital Skill Passport');
  };

  const handleDownloadPassport = () => {
    const content = [
      `FAIRSHIFT PORTABLE DIGITAL SKILL PASSPORT (SDG 8 VERIFIED)`,
      `==========================================================`,
      `Worker Name: ${org.workerName}`,
      `Current Role: ${org.workerRole} (${org.name})`,
      `Passport ID: ${org.rosterId}`,
      ``,
      `VERIFIED CREDENTIALS & CERTIFICATIONS:`,
      ...org.skills
        .filter((s) => s.sharedWithEmployers)
        .map(
          (s, i) =>
            `${i + 1}. ${s.skillName} [${s.status}]\n   Category: ${s.category} | Issuer: ${s.issuer}\n   Issued: ${s.issuedDate} | Expires: ${s.expiryDate} | Ref: ${s.certificateRef}`
        ),
    ].join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FairShift_Skill_Passport_${org.workerName.replace(' ', '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onTriggerToast('Downloaded portable Digital Skill Passport summary');
  };

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-secondary font-semibold">My Skills</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Portable Digital Skill Passport
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Employee-owned record of verified trade qualifications, safety training, and portable certificates.
          </p>
        </div>

        <div className="flex items-center gap-space-sm">
          <button
            type="button"
            onClick={handleDownloadPassport}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            <span>Export Skill Passport</span>
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>+ Add Certificate</span>
          </button>
        </div>
      </div>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
        {org.skills.map((skill) => (
          <div
            key={skill.id}
            className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 flex flex-col justify-between gap-space-md"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-space-sm">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  {skill.category}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${
                    skill.status === 'Verified'
                      ? 'bg-tertiary-fixed text-on-tertiary-fixed'
                      : skill.status === 'Expiring Soon'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {skill.status}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
                {skill.skillName}
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Issued by: <strong className="text-on-surface">{skill.issuer}</strong>
              </p>
            </div>

            <div className="bg-surface-container-low rounded-lg p-space-sm font-label-sm text-label-sm text-on-surface-variant space-y-1">
              <div className="flex justify-between">
                <span>Certificate Ref:</span>
                <span className="font-mono text-on-surface">{skill.certificateRef}</span>
              </div>
              <div className="flex justify-between">
                <span>Valid Window:</span>
                <span className="tabular-nums text-on-surface">
                  {skill.issuedDate} – {skill.expiryDate}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <span>Share on Portable Passport</span>
                <button
                  type="button"
                  onClick={() => {
                    onToggleShare(skill.id, !skill.sharedWithEmployers);
                    onTriggerToast(
                      !skill.sharedWithEmployers
                        ? `Enabled sharing for ${skill.certificateRef}`
                        : `Restricted sharing for ${skill.certificateRef}`
                    );
                  }}
                  className={`px-2.5 py-1 rounded font-label-sm text-label-sm cursor-pointer transition-colors ${
                    skill.sharedWithEmployers
                      ? 'bg-secondary-container text-on-secondary-container'
                      : 'bg-surface-container-highest text-on-surface-variant'
                  }`}
                >
                  {skill.sharedWithEmployers ? 'Shared' : 'Private'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Skill Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl border border-outline-variant/20">
            <div className="flex items-center justify-between mb-space-md">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Add Qualification or Certificate
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateSkill} className="space-y-space-md">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Qualification / Certificate Name *
                </label>
                <input
                  type="text"
                  required
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., Confined Space Entry & Rescue (Level 2)"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                >
                  <option value="Workplace Safety">Workplace Safety</option>
                  <option value="Trade Qualification">Trade Qualification</option>
                  <option value="Equipment Operation">Equipment Operation</option>
                  <option value="Campus & Technical">Campus &amp; Technical</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Issuing Authority
                </label>
                <input
                  type="text"
                  value={issuer}
                  onChange={(e) => setIssuer(e.target.value)}
                  placeholder="e.g., National Safety Council"
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-1">
                  Expiry Date
                </label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-space-sm pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
