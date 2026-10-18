# NexGuard Dashboard

> **Cloud Deployment Security & Reliability Validator**

A production-grade web dashboard for continuous assessment of cloud edge ingress, TLS certificates, DNS CNAME alignment, HTTP security headers, and AWS WAF protection rules.

---

## Architecture & Tech Stack

- **Framework**: React 18+ with TypeScript
- **Bundler & Dev Server**: Vite 5
- **Styling**: Tailwind CSS v3 with customized NexGuard design tokens
- **Component Pattern**: shadcn/ui principles, Radix-compatible, fully accessible (WCAG AA compliant)
- **Charts & Telemetry**: Recharts for trend analysis, with accessible raw tabular views always available
- **Icons**: Lucide React
- **API Communication**: Axios with interceptors, bearer auth, and intelligent fallback for local development
- **Date Handling**: `date-fns`
- **Testing**: Vitest + React Testing Library

---

## Design System Tokens

| Token | Hex Value | Application |
|---|---|---|
| `brand-900` | `#102A43` | Headings, dark navigation sidebar, primary contrast |
| `brand-700` | `#176B87` | Primary actions, buttons, links |
| `accent-500` | `#20B8A6` | Teal accents, active states, key status highlights |
| `canvas` | `#F6F8FB` | App background |
| `surface` | `#FFFFFF` | Cards, tables, modal dialogs |
| `nx-text` | `#172B4D` | Primary text |
| `muted` | `#526579` | Secondary text, subtle borders |
| `nx-border` | `#D9E2EC` | Dividers and card borders |
| `status-pass` | `#18794E` | Passing check badge / compliant score |
| `status-warning` | `#9A6700` | Warning check badge / deviation score |
| `status-fail` | `#B42318` | Failing check badge / critical action score |
| `status-info` | `#175CD3` | Running & info badge |

---

## Routes

- `/`: **DashboardPage** — Overview telemetry, quick stats, score trend chart, monitored targets, recent validation runs.
- `/targets`: **TargetsPage** — Deployment targets list, environment filters (`prod`, `staging`, `dev`), live search.
- `/targets/new`: **NewTargetPage** — Target registration form with client-side HTTPS validation and host detection.
- `/targets/:targetId`: **TargetDetailPage** — Detailed target profile, compliance score, validation triggers, and run history.
- `/runs/:runId`: **RunDetailPage** — Comprehensive check breakdown grouped by category, expandable monospace evidence, JSON & HTML report export, and live polling every 2s for active runs.
- `/settings`: **SettingsPage** — Governance thresholds, active ruleset configuration, CI/CD API key management, and webhook alerts.

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Start the development server
```bash
npm run dev
```
Dashboard will be available at: `http://localhost:3000`

### 3. Build for production
```bash
npm run build
```

### 4. Run tests
```bash
npm test
```
