# FairShift — Workforce Transparency & Safety Platform (SDG 8)

FairShift is a multilingual, SDG 8 compliant workforce management application built with **React 19**, **Tailwind CSS v4**, **Vite**, and **Express**, featuring:

- **Role-Aware Sign-In & Dynamic User Profiles**: Sign in with any user name or work email (or use the `Worker (Amina)` and `HR Manager` demo presets) to dynamically update your profile name across the entire platform.
- **Worker Overview & Shift Ledger**: Live elapsed shift timer, optical camera-enabled **QR Worksite Check-In** (`navigator.mediaDevices.getUserMedia`), break toggles, time correction disputes, and CSV/print timesheet exports.
- **Transparent Wage Ledger & Payslips**: Formulaic breakdowns of base pay, 1.5x certified overtime, stipends, and statutory deductions.
- **Confidential Grievances & Workplace Safety**: Zero-knowledge token generation, voice dictation, EXIF-stripped photo evidence, resolution audit timelines, and an encrypted worker clarification channel.
- **Digital Skill Passport & Zero-Knowledge Feedback**: Portable trade/safety credentials and k-anonymized workplace feedback.
- **Employer HR & HSE Console**: Dedicated management portal for approving time disputes, updating HSE case statuses, monitoring fatigue guardrails, and verifying worker certificates.

---

## Deploying to GitHub (`https://github.com/afsheenspdoc-28`) & Vercel

### Step 1: Push to Your GitHub Account (`afsheenspdoc-28`)

1. In Google AI Studio, click **Save to GitHub** (or export/download the project zip) and create a new repository under your account:
   - **Repository URL**: `https://github.com/afsheenspdoc-28/fairshift`
2. Or from a local terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: FairShift SDG 8 Workforce Platform"
   git branch -M main
   git remote add origin https://github.com/afsheenspdoc-28/fairshift.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

This project is pre-configured for **Vercel** with `vercel.json` and a serverless Express handler at `api/index.ts`:

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with your GitHub account (`afsheenspdoc-28`).
2. Select your **`afsheenspdoc-28/fairshift`** repository and click **Import**.
3. Verify the build settings (auto-detected via `vercel.json`):
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Click **Deploy**. Vercel will build the React frontend into `dist/` and automatically deploy `/api/*` as Serverless Functions.

### Local Development

```bash
npm install
npm run dev
```
The full-stack development server runs at `http://localhost:3000`.
