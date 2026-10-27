import React, { useState } from 'react';
import type { LanguageCode, UserRole } from '../types';
import { UI_TRANSLATIONS } from '../data/seedData';

interface LoginViewProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  onSignIn: (role: UserRole, displayName: string, identifier: string) => void;
}

export function resolveDisplayNameFromIdentifier(raw: string, fallbackRole: UserRole): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return fallbackRole === 'manager' ? 'Marcus Vance' : 'Amina Patel';
  }
  if (trimmed.includes('@')) {
    const localPart = trimmed.split('@')[0].replace(/\d+$/, '');
    const parts = localPart
      .split(/[._-]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length > 0) {
      return parts
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
        .join(' ');
    }
  }
  return trimmed
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const LoginView: React.FC<LoginViewProps> = ({
  language,
  onLanguageChange,
  onSignIn,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('worker');
  const [identifier, setIdentifier] = useState('amina.patel@apexbuild.com');
  const [password, setPassword] = useState('DemoSecureShift8#');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [forgotNotice, setForgotNotice] = useState(false);

  const t = UI_TRANSLATIONS[language];
  const resolvedName = resolveDisplayNameFromIdentifier(identifier, selectedRole);

  const handleSelectWorker = () => {
    setSelectedRole('worker');
    setIdentifier('amina.patel@apexbuild.com');
    setPassword('DemoSecureShift8#');
  };

  const handleSelectManager = () => {
    setSelectedRole('manager');
    setIdentifier('marcus.vance@apexbuild.com');
    setPassword('HRDirectorShift9$');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSignIn(selectedRole, resolvedName, identifier);
  };

  return (
    <div className="bg-surface-container-lowest font-body-md text-on-surface min-h-screen flex items-center justify-center p-gutter">
      <main className="w-full max-w-4xl bg-surface-container-lowest rounded-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] p-space-sm sm:p-space-md">
        <div className="flex flex-col w-full">
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden border border-outline-variant/20">
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[640px]">
              {/* Left Column: Form & Interaction */}
              <div className="md:col-span-7 p-space-lg md:p-space-xl flex flex-col justify-between bg-surface-container-lowest">
                <div>
                  {/* Header Bar: Brand Identity & Language */}
                  <div className="flex items-start justify-between gap-space-sm mb-space-lg">
                    <div className="flex items-center gap-space-sm">
                      <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0">
                        <span
                          className="material-symbols-outlined text-[20px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          shield_with_heart
                        </span>
                      </div>
                      <div>
                        <span className="font-headline-sm text-headline-sm text-primary tracking-tight block">
                          FairShift
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block">
                          Fair Work. Transparent Pay. Safer Workplaces.
                        </span>
                      </div>
                    </div>

                    {/* Language Dropdown */}
                    <div className="relative shrink-0">
                      <select
                        value={language}
                        onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
                        className="appearance-none bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md py-1.5 pl-3 pr-7 rounded-lg cursor-pointer transition-colors focus:outline-none"
                        id="langSelect"
                      >
                        <option value="en">EN • English</option>
                        <option value="es">ES • Español</option>
                        <option value="hi">HI • हिन्दी</option>
                        <option value="fr">FR • Français</option>
                        <option value="ar">AR • العربية</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-1.5 top-2 text-[16px] text-on-surface-variant pointer-events-none">
                        expand_more
                      </span>
                    </div>
                  </div>

                  {/* Title & Prompt */}
                  <div className="mb-space-lg">
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                      {t.welcomeBack}
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                      {t.signInPrompt}
                    </p>
                  </div>

                  {/* Demo Role Switcher */}
                  <div className="mb-space-lg bg-surface-container-low p-1.5 rounded-lg flex items-center justify-between gap-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant px-2 flex items-center gap-1 whitespace-nowrap">
                      <span className="material-symbols-outlined text-[15px]">tune</span>
                      Demo Preset
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={handleSelectWorker}
                        className={
                          selectedRole === 'worker'
                            ? 'font-label-md text-label-md px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary shadow-sm font-semibold transition-all whitespace-nowrap cursor-pointer'
                            : 'font-label-md text-label-md px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap cursor-pointer'
                        }
                      >
                        Worker (Amina)
                      </button>
                      <button
                        type="button"
                        onClick={handleSelectManager}
                        className={
                          selectedRole === 'manager'
                            ? 'font-label-md text-label-md px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary shadow-sm font-semibold transition-all whitespace-nowrap cursor-pointer'
                            : 'font-label-md text-label-md px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap cursor-pointer'
                        }
                      >
                        HR Manager
                      </button>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form className="space-y-space-md" onSubmit={handleSubmit}>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          className="block font-label-md text-label-md text-on-surface"
                          htmlFor="identifierInput"
                        >
                          User Name, Email address, or Employee ID
                        </label>
                        <span className="font-label-sm text-label-sm text-secondary">
                          Profile: {resolvedName}
                        </span>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-on-surface-variant">
                          badge
                        </span>
                        <input
                          id="identifierInput"
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="Enter your name, work email, or ID"
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg pl-10 pr-3 py-2.5 shadow-sm border border-outline-variant/30 transition-all focus:outline-none focus:bg-surface-container-low"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          className="block font-label-md text-label-md text-on-surface"
                          htmlFor="passwordInput"
                        >
                          Security Password / PIN
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotNotice(!forgotNotice)}
                          className="font-label-md text-label-md text-secondary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-on-surface-variant">
                          lock
                        </span>
                        <input
                          id="passwordInput"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg pl-10 pr-10 py-2.5 shadow-sm border border-outline-variant/30 transition-all focus:outline-none focus:bg-surface-container-low"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                          className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface transition-colors p-0.5"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {showPassword ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {forgotNotice && (
                        <p className="mt-1.5 font-body-sm text-body-sm text-secondary bg-surface-container-low p-2 rounded-lg">
                          PIN reset token dispatched to your registered worksite supervisor terminal, or click &ldquo;Sign In&rdquo; with any user name or preset above.
                        </p>
                      )}
                    </div>

                    {/* Controls row */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={staySignedIn}
                          onChange={(e) => setStaySignedIn(e.target.checked)}
                          className="w-4 h-4 rounded text-secondary focus:ring-0 cursor-pointer accent-secondary"
                        />
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Stay signed in for shift
                        </span>
                      </label>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-on-tertiary-container bg-surface-container-high px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-container"></span>
                        Worksites active
                      </span>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full bg-primary-container text-on-primary hover:bg-primary font-headline-sm text-headline-sm py-3 px-space-md rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                    >
                      <span>{t.signInBtn} as {resolvedName}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </form>

                  {/* First Time Notice */}
                  <div className="mt-space-md p-space-sm rounded-lg bg-surface-container-low text-on-surface-variant flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                      info
                    </span>
                    <p className="font-body-sm text-body-sm">
                      First time signing in? Contact your site supervisor or HR administrator for access credentials.
                    </p>
                  </div>
                </div>

                {/* Trust & Compliance Footer */}
                <div className="pt-space-md mt-space-md flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface">
                    <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                      verified_user
                    </span>
                    <span className="font-label-sm text-label-sm">
                      Secure SSL Auth • SDG 8 Decent Work Compliant
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/fairshift-project.zip"
                      download="fairshift-project.zip"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[14px]">folder_zip</span>
                      <span>Download ZIP</span>
                    </a>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">v2.4.1</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Brand Value & Dignified Work Metrics */}
              <div className="md:col-span-5 bg-[#262238] text-white p-space-lg md:p-space-xl flex flex-col justify-between relative overflow-hidden">
                {/* Subtle Background Glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#4a3ee6]/15 rounded-full blur-3xl pointer-events-none"></div>
                <div>
                  {/* Right Header */}
                  <div className="flex items-center justify-between mb-space-lg">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#110d22] font-label-sm text-label-sm text-[#e2dfff]">
                      <span className="material-symbols-outlined text-[14px]">
                        assured_workload
                      </span>
                      SDG 8 Standard
                    </span>
                    <div className="flex gap-1 text-[#8f88a4]">
                      <span className="material-symbols-outlined text-[18px]">work</span>
                      <span className="material-symbols-outlined text-[18px]">
                        health_and_safety
                      </span>
                      <span className="material-symbols-outlined text-[18px]">payments</span>
                    </div>
                  </div>

                  <h2 className="font-headline-lg text-headline-lg text-white tracking-tight mb-2">
                    Your work.
                    <br />
                    Your rights.
                    <br />
                    Your future.
                  </h2>
                  <p className="font-body-sm text-body-sm text-[#8f88a4] mb-space-lg">
                    A standardized operating model upholding transparent remuneration, physical safeguarding, and professional dignity.
                  </p>

                  {/* 3 Distinct Benefit Statement Cards */}
                  <div className="space-y-space-sm">
                    {/* 1. Transparent Pay */}
                    <div className="p-3.5 rounded-lg bg-[#110d22]/70 backdrop-blur-sm transition-all hover:bg-[#110d22]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-[#6ffbbe] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">
                            account_balance_wallet
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-white leading-tight">
                            Transparent Pay &amp; Overtime
                          </h3>
                          <p className="font-body-sm text-body-sm text-[#8f88a4] mt-1">
                            Real-time tracking of hours, automated overtime verification, and zero unexplained deductions.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. Safer Workplaces */}
                    <div className="p-3.5 rounded-lg bg-[#110d22]/70 backdrop-blur-sm transition-all hover:bg-[#110d22]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-[#e2dfff] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">shield</span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-white leading-tight">
                            Safer Workplaces
                          </h3>
                          <p className="font-body-sm text-body-sm text-[#8f88a4] mt-1">
                            Direct, confidential grievance logging &amp; rapid safety hazard reporting with whistleblower protections.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Skills & Growth Tracking */}
                    <div className="p-3.5 rounded-lg bg-[#110d22]/70 backdrop-blur-sm transition-all hover:bg-[#110d22]">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-[#e6defc] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">
                            workspace_premium
                          </span>
                        </div>
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-white leading-tight">
                            Skills &amp; Growth Tracking
                          </h3>
                          <p className="font-body-sm text-body-sm text-[#8f88a4] mt-1">
                            Verifiable credentials, workplace certifications, and structured career advancement pathways.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="pt-space-lg mt-space-md">
                  <div className="p-3 rounded-lg bg-[#110d22]/40 text-[#8f88a4] flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-[#6ffbbe] shrink-0">
                      domain_verification
                    </span>
                    <p className="font-label-sm text-label-sm leading-tight text-[#8f88a4]">
                      Trusted across Construction Worksites, Educational Campuses, and Healthcare Facilities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
