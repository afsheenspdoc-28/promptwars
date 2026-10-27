export type OrgId = 'apex' | 'stjude' | 'metro';
export type UserRole = 'worker' | 'manager';
export type LanguageCode = 'en' | 'es' | 'hi' | 'fr' | 'ar';
export type NavRoute =
  | 'overview'
  | 'attendance-and-shifts'
  | 'my-payslips'
  | 'grievances-and-safety'
  | 'my-skills'
  | 'feedback'
  | 'notifications'
  | 'settings'
  | 'help-and-support'
  | 'employer-portal';

export interface ShiftLog {
  id: string;
  dateLabel: string;
  dayName: string;
  monthKey: 'oct-2024' | 'sep-2024' | 'aug-2024';
  shiftType: 'morning' | 'afternoon' | 'overtime' | 'statutory';
  shiftProfile: string;
  siteDetail: string;
  scheduledWindow: string;
  clockIn: string;
  clockOut: string;
  paidHours: string;
  overtime: string;
  auditStatus: 'Live Active' | 'Approved Overtime' | 'Present' | 'Holiday' | 'Under Dispute';
  isLive?: boolean;
  isMandatoryPaid?: boolean;
}

export interface TimeDispute {
  id: string;
  shiftTarget: string;
  proposedClockIn: string;
  proposedClockOut: string;
  reason: string;
  submittedBy: string;
  submittedAt: string;
  status: 'Pending Review' | 'Approved' | 'Rejected';
  resolutionNote?: string;
}

export interface GrievanceTimelineItem {
  id: string;
  title: string;
  timestamp: string;
  description: string;
  token?: string;
  isPrimary?: boolean;
}

export interface GrievancePhoto {
  url: string;
  caption: string;
  alt: string;
}

export interface GrievanceItem {
  id: string;
  categoryKey: 'safety' | 'pay' | 'fairness';
  categoryBadge: string;
  status: 'In Progress' | 'Under Review' | 'Resolved' | 'Submitted';
  title: string;
  summary: string;
  fullDescription: string;
  assignedOfficer: string;
  assignedRole: string;
  assignedAvatar: string;
  assignedIcon: string;
  isAnonymous: boolean;
  identityLabel: string;
  dateLabel: string;
  locationRef: string;
  gridRef: string;
  urgencyLevel: string;
  urgencySub: string;
  photos: GrievancePhoto[];
  timeline: GrievanceTimelineItem[];
}

export interface PayslipItem {
  id: string;
  periodLabel: string;
  payDate: string;
  status: 'Approved' | 'Pending Audit' | 'Discrepancy Flagged';
  currency: string;
  basePay: number;
  baseHours: number;
  hourlyRate: number;
  overtimePay: number;
  overtimeHours: number;
  overtimeMultiplier: number;
  allowances: number;
  allowanceLabel: string;
  deductions: number;
  deductionLabel: string;
  netPay: number;
  discrepancyNote?: string;
}

export interface SkillRecord {
  id: string;
  skillName: string;
  category: string;
  issuer: string;
  issuedDate: string;
  expiryDate: string;
  status: 'Verified' | 'Pending Review' | 'Expiring Soon';
  certificateRef: string;
  sharedWithEmployers: boolean;
}

export interface AnonymousFeedbackItem {
  id: string;
  category: 'Work Conditions' | 'Safety & PPE' | 'Shift Scheduling' | 'Management Respect' | 'Facilities & Hygiene';
  sentiment: 'Positive' | 'Constructive' | 'Urgent';
  message: string;
  departmentScope: string;
  createdAt: string;
  upvotes: number;
}

export interface FatigueAlertItem {
  id: string;
  workerName: string;
  workerId: string;
  worksite: string;
  ruleTriggered: string;
  metricValue: string;
  severity: 'High' | 'Moderate';
  status: 'Active Alert' | 'Action Logged';
  correctiveAction?: string;
  detectedAt: string;
}

export interface ImportantUpdate {
  id: string;
  icon: string;
  iconColorClass: string;
  title: string;
  badgeText: string;
  badgeTone: 'neutral' | 'success' | 'subtle';
  subtitle: string;
  timeLabel: string;
  targetRoute: NavRoute;
}

export interface OrgDataset {
  id: OrgId;
  name: string;
  industry: string;
  siteBadge: string;
  geofenceLabel: string;
  rosterId: string;
  workerName: string;
  workerRole: string;
  workerEmail: string;
  workerAvatar: string;
  managerName: string;
  managerRole: string;
  managerEmail: string;
  managerAvatar: string;
  dateBanner: string;
  shiftBanner: string;
  dutyState: 'Active on Shift' | 'On Break' | 'Clocked Out';
  clockInTime: string;
  punchEarlyNote: string;
  gateVerification: string;
  elapsedSeconds: number;
  hoursWorkedLabel: string;
  scheduledHoursLabel: string;
  completionPercent: number;
  remainingTodayLabel: string;
  breakTakenLabel: string;
  overtimeRecordedLabel: string;
  overtimeCapLabel: string;
  assignmentTitle: string;
  assignmentLocation: string;
  assignmentDistrict: string;
  billableHoursLabel: string;
  mealIntervalLabel: string;
  restBankLabel: string;
  monthlyStats: {
    totalHours: string;
    quotaNote: string;
    punctualityRate: string;
    overtimeHours: string;
    approvedLeave: string;
    leaveSub: string;
  };
  importantUpdates: ImportantUpdate[];
  shifts: ShiftLog[];
  disputes: TimeDispute[];
  grievances: GrievanceItem[];
  payslips: PayslipItem[];
  skills: SkillRecord[];
  feedback: AnonymousFeedbackItem[];
  fatigueAlerts: FatigueAlertItem[];
}

export interface AppDatabase {
  organizations: Record<OrgId, OrgDataset>;
}
