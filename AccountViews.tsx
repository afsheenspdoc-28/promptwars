import React from 'react';
import type { LanguageCode, NavRoute, OrgDataset } from '../types';

interface AccountViewProps {
  subView: 'notifications' | 'settings' | 'help-and-support';
  org: OrgDataset;
  language: LanguageCode;
  isDark: boolean;
  onLanguageChange: (lang: LanguageCode) => void;
  onToggleTheme: (dark: boolean) => void;
  onNavigate: (route: NavRoute) => void;
  onTriggerToast: (msg: string) => void;
}

export const AccountViews: React.FC<AccountViewProps> = ({
  subView,
  org,
  language,
  isDark,
  onLanguageChange,
  onToggleTheme,
  onNavigate,
  onTriggerToast,
}) => {
  if (subView === 'notifications') {
    return (
      <div className="flex flex-col w-full space-y-space-xl">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Notifications &amp; Audit Alerts
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Real-time updates on your shift logs, payslip clearances, and safety inquiries.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-sm">
          {org.importantUpdates.map((item) => (
            <div
              key={item.id}
              onClick={() => onNavigate(item.targetRoute)}
              className="bg-surface-container-low hover:bg-surface-container transition-colors rounded-xl p-space-md flex items-center justify-between gap-3 cursor-pointer"
            >
              <div className="flex items-start gap-space-md">
                <div className="w-9 h-9 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center shrink-0 shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-label-md text-label-md font-semibold text-on-surface">
                      {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant font-label-sm text-label-sm">
                      {item.badgeText}
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant shrink-0">
                {item.timeLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (subView === 'settings') {
    return (
      <div className="flex flex-col w-full space-y-space-xl">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Worker Account &amp; Privacy Settings
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
            Manage multilingual preferences, accessibility options, and zero-knowledge privacy controls.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-space-lg max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-headline-sm text-headline-sm text-primary">
                Interface Language (FR-09)
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Select your preferred regional language for navigation and payslip labels.
              </p>
            </div>
            <select
              value={language}
              onChange={(e) => {
                onLanguageChange(e.target.value as LanguageCode);
                onTriggerToast('Updated interface language preference');
              }}
              className="h-10 px-3 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface"
            >
              <option value="en">EN • English</option>
              <option value="es">ES • Español</option>
              <option value="hi">HI • हिन्दी</option>
              <option value="fr">FR • Français</option>
              <option value="ar">AR • العربية</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-space-md border-t border-outline-variant/20">
            <div>
              <div className="font-headline-sm text-headline-sm text-primary">
                Display Theme Mode
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Switch between high-legibility Light canvas and low-glare Dark shift mode.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleTheme(!isDark)}
              className="px-4 py-2 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md cursor-pointer"
            >
              {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full space-y-space-xl">
      <div>
        <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Help, Worker Rights &amp; UN SDG 8 Support
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
          Direct access to independent labor standards advocacy, union representatives, and technical support.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-2">
          <span className="material-symbols-outlined text-[28px] text-on-tertiary-container">
            gavel
          </span>
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Confidential Worker Support Hotline
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Protected under UN SDG 8 &amp; ILO Convention C155. Call{' '}
            <strong className="text-on-surface">1-800-FAIR-WORK (Ext 4)</strong> for 24/7
            multilingual legal and safety assistance.
          </p>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm border border-outline-variant/20 space-y-2">
          <span className="material-symbols-outlined text-[28px] text-secondary">
            verified_user
          </span>
          <h2 className="font-headline-sm text-headline-sm text-primary">
            Zero-Knowledge Whistleblower Guarantee
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Anonymous safety reports and workplace feedback use blinded cryptographic tokens so site
            supervisors can resolve hazards without seeing your identity.
          </p>
        </div>
      </div>
    </div>
  );
};
