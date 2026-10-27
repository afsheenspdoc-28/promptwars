/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import type {
  AppDatabase,
  GrievanceItem,
  LanguageCode,
  NavRoute,
  OrgId,
  UserRole,
} from './types';
import { HOTLINKED_ASSETS, INITIAL_DATABASE, UI_TRANSLATIONS } from './data/seedData';
import { LoginView } from './components/LoginView';
import { OverviewView } from './components/OverviewView';
import { AttendanceView } from './components/AttendanceView';
import { GrievancesView } from './components/GrievancesView';
import { PayslipsView } from './components/PayslipsView';
import { SkillsView } from './components/SkillsView';
import { FeedbackView } from './components/FeedbackView';
import { EmployerPortalView } from './components/EmployerPortalView';
import { AccountViews } from './components/AccountViews';

export default function App() {
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const cached = localStorage.getItem('fairshift_db_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.organizations && parsed.organizations.apex) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_DATABASE;
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeOrgId, setActiveOrgId] = useState<OrgId>('apex');
  const [role, setRole] = useState<UserRole>('worker');
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [activeRoute, setActiveRoute] = useState<NavRoute>('overview');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fetch initial state from Express backend if no local customizations exist yet
  useEffect(() => {
    fetch('/api/state')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.organizations && !localStorage.getItem('fairshift_db_v1')) {
          setDb(data);
        }
      })
      .catch(() => {
        // Fallback to localStorage / seed data if offline
      });
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('fairshift_db_v1', JSON.stringify(db));
    } catch {
      // ignore storage quota errors
    }
  }, [db]);

  useEffect(() => {
    const rootEl = document.documentElement;
    if (isDark) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
  }, [isDark]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  const org = db.organizations[activeOrgId] || db.organizations.apex;
  const t = UI_TRANSLATIONS[language];

  // API Helpers
  const handlePunchAction = async (
    action: 'clock_in' | 'break_toggle' | 'clock_out' | 'qr_checkin'
  ) => {
    const timestampLabel = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    try {
      const res = await fetch('/api/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, action, timestampLabel }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDb(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitDispute = async (payload: {
    shiftTarget: string;
    proposedClockIn: string;
    proposedClockOut: string;
    reason: string;
  }): Promise<string> => {
    try {
      const res = await fetch('/api/attendance/dispute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setDb(data.db);
        return data.dispute.id;
      }
    } catch (e) {
      console.error(e);
    }
    return 'FS-DSP-9042';
  };

  const handleResolveDispute = async (
    disputeId: string,
    status: 'Approved' | 'Rejected'
  ) => {
    try {
      const res = await fetch(`/api/attendance/dispute/${disputeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, status }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitGrievance = async (payload: {
    token: string;
    category: string;
    description: string;
    isAnonymous: boolean;
    photoName?: string;
  }): Promise<GrievanceItem> => {
    try {
      const res = await fetch('/api/grievances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, ...payload }),
      });
      if (res.ok) {
        const data = await res.json();
        setDb(data.db);
        return data.grievance;
      }
    } catch (e) {
      console.error(e);
    }
    return org.grievances[0];
  };

  const handleAddGrievanceNote = async (grievanceId: string, noteText: string) => {
    try {
      const res = await fetch(`/api/grievances/${grievanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, noteText, actorRole: role }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGrievanceStatus = async (
    grievanceId: string,
    status: GrievanceItem['status'],
    noteText?: string
  ) => {
    try {
      const res = await fetch(`/api/grievances/${grievanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: activeOrgId,
          status,
          noteText,
          actorRole: 'manager',
        }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFlagPayslipDiscrepancy = async (payslipId: string, note: string) => {
    try {
      const res = await fetch(`/api/payslips/${payslipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: activeOrgId,
          status: 'Discrepancy Flagged',
          discrepancyNote: note,
        }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolvePayslipDiscrepancy = async (payslipId: string) => {
    try {
      const res = await fetch(`/api/payslips/${payslipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId: activeOrgId,
          status: 'Approved',
          discrepancyNote: '',
        }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddSkill = async (payload: {
    skillName: string;
    category: string;
    issuer: string;
    expiryDate: string;
  }) => {
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, ...payload }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleShareSkill = async (skillId: string, shared: boolean) => {
    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, sharedWithEmployers: shared }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifySkill = async (skillId: string, status: 'Verified') => {
    try {
      const res = await fetch(`/api/skills/${skillId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, status }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitFeedback = async (payload: {
    category: string;
    sentiment: string;
    message: string;
    departmentScope: string;
  }) => {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, ...payload }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpvoteFeedback = async (id: string) => {
    try {
      const res = await fetch(`/api/feedback/${id}/upvote`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveFatigue = async (alertId: string, correctiveAction: string) => {
    try {
      const res = await fetch(`/api/fatigue/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: activeOrgId, correctiveAction }),
      });
      if (res.ok) {
        setDb(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDemo = async () => {
    try {
      localStorage.removeItem('fairshift_db_v1');
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        setDb(await res.json());
      } else {
        setDb(JSON.parse(JSON.stringify(INITIAL_DATABASE)));
      }
    } catch (e) {
      setDb(JSON.parse(JSON.stringify(INITIAL_DATABASE)));
      console.error(e);
    }
  };

  // If on Login screen, render LoginView
  if (!isAuthenticated) {
    return (
      <LoginView
        language={language}
        onLanguageChange={setLanguage}
        onSignIn={async (selectedRole, displayName, identifier) => {
          setRole(selectedRole);
          // Optimistically update user name across all organizations in local state
          setDb((prev) => {
            const next: AppDatabase = JSON.parse(JSON.stringify(prev));
            Object.values(next.organizations).forEach((o) => {
              if (selectedRole === 'manager') {
                o.managerName = displayName;
                if (identifier.includes('@')) o.managerEmail = identifier;
              } else {
                o.workerName = displayName;
                if (identifier.includes('@')) o.workerEmail = identifier;
              }
            });
            return next;
          });
          setIsAuthenticated(true);
          if (selectedRole === 'manager') {
            setActiveRoute('employer-portal');
            triggerToast(`Signed in as ${displayName} (${org.managerRole})`);
          } else {
            setActiveRoute('overview');
            triggerToast(`Signed in as ${displayName} (${org.workerRole})`);
          }
          try {
            const res = await fetch('/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ role: selectedRole, displayName, identifier }),
            });
            if (res.ok) {
              setDb(await res.json());
            }
          } catch (e) {
            console.error(e);
          }
        }}
      />
    );
  }

  const navItems: { route: NavRoute; icon: string; label: string }[] = [
    { route: 'overview', icon: 'grid_view', label: t.overview },
    { route: 'attendance-and-shifts', icon: 'schedule', label: t.attendanceAndShifts },
    { route: 'my-payslips', icon: 'payments', label: t.myPayslips },
    { route: 'grievances-and-safety', icon: 'shield', label: t.grievancesAndSafety },
    { route: 'my-skills', icon: 'verified', label: t.mySkills },
    { route: 'feedback', icon: 'chat_bubble', label: t.feedback },
  ];

  const activePersonName = role === 'manager' ? org.managerName : org.workerName;
  const activePersonRole = role === 'manager' ? org.managerRole : org.workerRole;
  const activePersonAvatar = role === 'manager' ? org.managerAvatar : org.workerAvatar;

  return (
    <div className="bg-surface-container-lowest font-body-md text-on-surface antialiased min-h-screen">
      {/* Left Sidebar (Desktop fixed w-72, Mobile drawer) */}
      <aside
        className={`fixed left-0 top-0 h-screen w-72 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-r border-outline-variant/15 z-50 flex flex-col justify-between select-none transition-transform duration-200 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Brand Lockup */}
          <div className="h-16 px-gutter flex items-center justify-between bg-surface-container-lowest">
            <div className="flex items-center gap-space-sm">
              <img
                alt="FairShift Logo"
                className="h-8 w-auto object-contain"
                referrerPolicy="no-referrer"
                src={HOTLINKED_ASSETS.fairShiftLogo}
              />
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary leading-none tracking-tight">
                  FairShift
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  Workforce Transparency
                </span>
              </div>
            </div>
            <span className="inline-flex items-center px-space-xs py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
              SDG 8
            </span>
          </div>

          {/* Navigation Links */}
          <div className="overflow-y-auto flex-1 px-space-md py-space-sm space-y-space-lg">
            <div className="space-y-space-xs">
              <div className="px-space-sm text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase font-semibold">
                Workspace
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeRoute === item.route;
                  return (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => {
                        setActiveRoute(item.route);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-space-sm px-space-sm py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-secondary-container text-on-secondary-container font-semibold'
                          : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* Employer / HR Manager Console Link */}
                <button
                  type="button"
                  onClick={() => {
                    setRole('manager');
                    setActiveRoute('employer-portal');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-space-sm py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                    activeRoute === 'employer-portal'
                      ? 'bg-secondary-container text-on-secondary-container font-semibold'
                      : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px]">
                      admin_panel_settings
                    </span>
                    <span>{t.employerPortal}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-[10px]">
                    HR
                  </span>
                </button>
              </nav>
            </div>

            <div className="space-y-space-xs">
              <div className="px-space-sm text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase font-semibold">
                Account
              </div>
              <nav className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRoute('notifications');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-space-sm py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                    activeRoute === 'notifications'
                      ? 'bg-secondary-container text-on-secondary-container font-semibold'
                      : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                    <span>{t.notifications}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-label-sm tabular-nums">
                    {org.importantUpdates.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRoute('settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-space-sm px-space-sm py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                    activeRoute === 'settings'
                      ? 'bg-secondary-container text-on-secondary-container font-semibold'
                      : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">settings</span>
                  <span>{t.settings}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveRoute('help-and-support');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-space-sm px-space-sm py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                    activeRoute === 'help-and-support'
                      ? 'bg-secondary-container text-on-secondary-container font-semibold'
                      : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">help</span>
                  <span>{t.helpAndSupport}</span>
                </button>
              </nav>
            </div>
          </div>
        </div>

        {/* Bottom Profile Card with Sign Out */}
        <div className="p-space-md bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-t border-outline-variant/15">
          <div className="p-space-sm rounded-xl bg-surface-container-low flex items-center justify-between gap-space-sm">
            <div className="flex items-center gap-space-sm min-w-0">
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
                src={activePersonAvatar}
              />
              <div className="flex flex-col min-w-0">
                <span className="font-label-lg text-label-lg text-on-surface truncate">
                  {activePersonName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
                  {activePersonRole}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              className="p-space-xs rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-error transition-colors shrink-0 cursor-pointer"
              title="Sign Out to Login Screen"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="lg:pl-72">
        {/* Top Header */}
        <header className="fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/15 z-40 flex items-center justify-between px-gutter">
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>

            {/* Organization Switcher */}
            <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-1.5 rounded-lg">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                domain
              </span>
              <select
                value={activeOrgId}
                onChange={(e) => {
                  const nextOrg = e.target.value as OrgId;
                  setActiveOrgId(nextOrg);
                  triggerToast(`Switched workspace to ${db.organizations[nextOrg].name}`);
                }}
                className="bg-transparent font-label-lg text-label-lg text-on-surface focus:outline-none cursor-pointer pr-space-sm"
              >
                <option value="apex">Apex Construction &amp; Contracting</option>
                <option value="stjude">St. Jude College of Technology</option>
                <option value="metro">Metro Logistics &amp; Warehousing</option>
              </select>
            </div>

            <div className="hidden xl:flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
              <span className="text-on-surface-variant">Workspace</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              <span className="text-on-surface font-medium">
                {role === 'manager' ? 'HR & HSE Compliance' : 'Active Roster'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-space-sm sm:gap-space-md">
            {/* Role Mode Switcher (Worker vs HR Manager) */}
            <div className="hidden sm:flex items-center bg-surface-container-low p-1 rounded-lg gap-1">
              <button
                type="button"
                onClick={() => {
                  setRole('worker');
                  if (activeRoute === 'employer-portal') {
                    setActiveRoute('overview');
                  }
                  triggerToast(`Viewing as Worker (${org.workerName})`);
                }}
                className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all cursor-pointer ${
                  role === 'worker'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Worker
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('manager');
                  setActiveRoute('employer-portal');
                  triggerToast(`Viewing as HR Manager (${org.managerName})`);
                }}
                className={`px-2.5 py-1 rounded-md font-label-sm text-label-sm transition-all cursor-pointer ${
                  role === 'manager'
                    ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                HR Manager
              </button>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              aria-label="Interface Language"
              className="hidden md:block bg-surface-container-low text-on-surface font-label-sm text-label-sm px-2.5 py-1.5 rounded-lg cursor-pointer focus:outline-none"
            >
              <option value="en">EN</option>
              <option value="es">ES</option>
              <option value="hi">HI</option>
              <option value="fr">FR</option>
              <option value="ar">AR</option>
            </select>

            {/* Light / Dark Mode Toggle */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-full gap-1">
              <button
                type="button"
                onClick={() => setIsDark(false)}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-surface-container-lowest text-secondary shadow-[0_1px_3px_rgba(18,18,20,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Light Mode"
              >
                <span className="material-symbols-outlined text-[16px]">light_mode</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDark(true)}
                className={`flex items-center justify-center w-7 h-7 rounded-full transition-all cursor-pointer ${
                  isDark
                    ? 'bg-surface-container-lowest text-secondary shadow-[0_1px_3px_rgba(18,18,20,0.04)]'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Dark Mode"
              >
                <span className="material-symbols-outlined text-[16px]">dark_mode</span>
              </button>
            </div>

            {/* Notifications Bell */}
            <button
              type="button"
              onClick={() => setActiveRoute('notifications')}
              className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors cursor-pointer"
              title="Notifications"
            >
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary-container ring-2 ring-surface-container-lowest"></span>
            </button>

            <div className="h-5 w-[1px] bg-surface-container-high hidden sm:block"></div>

            {/* Profile & Login Screen Switcher */}
            <button
              type="button"
              onClick={() => setIsAuthenticated(false)}
              title="Switch Account / View Sign-In Screen"
              className="flex items-center gap-space-sm pl-space-xs hover:bg-surface-container-low p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <img
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover shrink-0"
                referrerPolicy="no-referrer"
                src={activePersonAvatar}
              />
              <div className="hidden lg:flex flex-col text-left">
                <span className="font-label-lg text-label-lg text-on-surface leading-tight">
                  {activePersonName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  {activePersonRole}
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant hidden lg:inline">
                expand_more
              </span>
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="w-full pt-16 bg-surface-container-lowest min-h-screen">
          <div className="w-full px-gutter py-space-md">
            {/* Breadcrumb Bar */}
            <div className="flex items-center justify-between mb-space-md flex-wrap gap-2">
              <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Portal</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                <span className="text-on-surface font-semibold capitalize">Portal Surface</span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/fairshift-project.zip"
                  download="fairshift-project.zip"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors"
                >
                  <span className="material-symbols-outlined text-[15px] text-secondary">
                    folder_zip
                  </span>
                  <span>Download Project ZIP</span>
                </a>
                <button
                  type="button"
                  onClick={() => setIsAuthenticated(false)}
                  className="inline-flex items-center gap-1 text-on-surface-variant hover:text-secondary font-label-sm text-label-sm transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">login</span>
                  <span>Sign-In Screen</span>
                </button>
              </div>
            </div>

            {activeRoute === 'overview' && (
              <OverviewView
                org={org}
                language={language}
                onNavigate={setActiveRoute}
                onPunchAction={handlePunchAction}
                onTriggerToast={triggerToast}
              />
            )}

            {activeRoute === 'attendance-and-shifts' && (
              <AttendanceView
                org={org}
                onPunchAction={handlePunchAction}
                onSubmitDispute={handleSubmitDispute}
                onTriggerToast={triggerToast}
              />
            )}

            {activeRoute === 'grievances-and-safety' && (
              <GrievancesView
                org={org}
                onSubmitGrievance={handleSubmitGrievance}
                onAddNote={handleAddGrievanceNote}
                onTriggerToast={triggerToast}
              />
            )}

            {activeRoute === 'my-payslips' && (
              <PayslipsView
                org={org}
                onFlagDiscrepancy={handleFlagPayslipDiscrepancy}
                onTriggerToast={triggerToast}
              />
            )}

            {activeRoute === 'my-skills' && (
              <SkillsView
                org={org}
                onAddSkill={handleAddSkill}
                onToggleShare={handleToggleShareSkill}
                onTriggerToast={triggerToast}
              />
            )}

            {activeRoute === 'feedback' && (
              <FeedbackView
                org={org}
                onSubmitFeedback={handleSubmitFeedback}
                onUpvoteFeedback={handleUpvoteFeedback}
                onTriggerToast={triggerToast}
              />
            )}

            {activeRoute === 'employer-portal' && (
              <EmployerPortalView
                org={org}
                onResolveDispute={handleResolveDispute}
                onUpdateGrievanceStatus={handleUpdateGrievanceStatus}
                onVerifySkill={handleVerifySkill}
                onResolveFatigue={handleResolveFatigue}
                onResolvePayslipDiscrepancy={handleResolvePayslipDiscrepancy}
                onResetDemo={handleResetDemo}
                onTriggerToast={triggerToast}
              />
            )}

            {(activeRoute === 'notifications' ||
              activeRoute === 'settings' ||
              activeRoute === 'help-and-support') && (
              <AccountViews
                subView={activeRoute}
                org={org}
                language={language}
                isDark={isDark}
                onLanguageChange={setLanguage}
                onToggleTheme={setIsDark}
                onNavigate={setActiveRoute}
                onTriggerToast={triggerToast}
              />
            )}
          </div>
        </main>
      </div>

      {/* Micro Toast Notification Element */}
      <div
        className={`fixed bottom-6 right-6 z-50 bg-primary-container text-on-primary px-4 py-3 rounded-lg shadow-xl font-label-lg text-label-lg flex items-center gap-2 transform transition-all duration-300 pointer-events-none ${
          toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
      >
        <span className="material-symbols-outlined text-[20px] text-tertiary-fixed">
          check_circle
        </span>
        <span>{toastMessage}</span>
      </div>
    </div>
  );
}
