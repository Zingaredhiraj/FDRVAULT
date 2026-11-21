# AICTE FDR Vault
**Streamline of Security Deposit / FDR Portal: Transparent. Tracked. Timely.**
*SIH 2026 | Problem ID SIH26265 | AICTE IT Division*

---

## 🏛️ Executive Summary

The **AICTE FDR Vault** is an enterprise fixed-deposit and security-deposit lifecycle command center built for the All India Council for Technical Education (AICTE). It centralizes the lifecycle of institution security deposits from initial intake and document scrutiny to compound maturity calculation, proactive de-duplicated renewal alerts, automated risk surveillance, four-tier release gates, and tamper-evident cryptographic public verification.

Every screen in the portal is architected to answer four vital operational questions:
1. **What** needs action?
2. By **whom**?
3. By **when**?
4. What is the **risk**?

---

## 🚀 Key Highlights & Architecture

- **Maker-Checker-Approver Separation of Duties**: Strict API-enforced HTTP 403 barriers guarantee an FDR creator cannot verify documents, a release verifier cannot approve, and a requester cannot self-certify.
- **Strict Multi-Tenant Privacy Isolation**: Institution users accessing any record outside their authorized institution receive **HTTP 404** (not 403), completely preventing institutional enumeration.
- **Pure Integer Currency Math**: All monetary amounts are stored as integer **paise** (`1 INR = 100 paise`) utilizing `BigInt` to eliminate IEEE 754 floating-point inaccuracies.
- **Tamper-Evident Hash-Chained Audit Trail**: Sensitive operations write append-only logs linked by `SHA-256(prevHash + canonicalData)`. An integrated verification endpoint verifies entire chain integrity.
- **7-Rule Automated Surveillance Engine**: Live surveillance flags duplicate deposit candidates, interest rate outliers against state medians, missing lien markings, IFSC mismatches, and overdue dormancy.
- **Dual-Language & Accessible Interface**: Full English and Hindi (हिन्दी) dynamic localization via `i18next`, keyboard command bar (`Ctrl+K`), and high-contrast dark mode.
- **Lightweight 3D Experiences**: 6 Three.js scenes featuring login vault physics, geo-spatial deposit distribution, and digital release order stamping with instant 2D CSS fallbacks.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| **Backend Core** | Node.js 20 LTS, Express, TypeScript (strict mode), Prisma ORM, Zod validation |
| **Database** | SQLite with Write-Ahead Logging (WAL) & synchronous=NORMAL; PostgreSQL portable |
| **Security & Auth** | Dual-token JWT (15-min access / 7-day hashed refresh rotation), bcrypt (10 rounds), helmet, strict CORS |
| **Frontend SPA** | Next.js 14 / React 18, Tailwind CSS, TanStack Query, Recharts, Lucide-react, Framer Motion |
| **3D Graphics** | Three.js with power-preference optimization and 2D canvas fallbacks |
| **Background Jobs** | Node-cron with database locks and deduplicated AlertLog schedules |
| **Reports & Docs** | PDFKit with embedded QR codes, ExcelJS streaming, CSV streaming |

---

## ⚡ Quick Start & Development Setup

### 1. Prerequisites
- Node.js $\ge$ 20.0.0
- pnpm $\ge$ 9.0.0

### 2. Automated Clean Boot (Setup & Dev)
```bash
# Clone repository
cd FDR

# Run full setup (dependencies, Prisma generate, database push, seed)
npm run setup

# Launch concurrent development servers (API: 4000, UI: 5173)
npm run dev
```

### 3. Verify Entire System
```bash
# Runs TypeScript compiler, 9 Vitest integration suites (39 tests), and Next.js production build
npm run verify
```

---

## 🔑 Demo Role Credentials

All demo accounts use the standard password: **`Demo@1234`**

| Role | Email | Purpose / Landing View |
|---|---|---|
| **SUPER_ADMIN** | `admin@aicte.demo` | Master system operations, bank configuration, user roles, cron triggers |
| **FINANCE_OFFICER** | `finance@aicte.demo` | Maker role: creates FDRs, initiates renewals, drafts releases, executes UTR |
| **VERIFIER** | `verifier@aicte.demo` | Checker role: inspects documents with keyboard shortcuts (`V`/`R`), verifies releases |
| **APPROVING_AUTHORITY** | `authority@aicte.demo` | Senior AICTE authority: reviews premature release warnings and grants digital approvals |
| **INSTITUTION_USER** | `institution@aicte.demo` | College accounts: strictly scoped self-service portal, uploads scans, tracks releases |
| **AUDITOR** | `auditor@aicte.demo` | Read-only reviewer: verifies hash-chain integrity and exports reports |

---

## 📖 Key Documentation Index

- [Implementation Documentation](file:///home/dhiraj/Downloads/FDR/docs/SPEC.md)
- [Architecture & Implementation Plan](file:///home/dhiraj/Downloads/FDR/docs/PLAN.md)
- [Comprehensive Verification Checklist](file:///home/dhiraj/Downloads/FDR/docs/FINAL_CHECKLIST.md)
- [Security Architecture & Audit Findings](file:///home/dhiraj/Downloads/FDR/docs/SECURITY.md)
- [Performance Engineering & Benchmark Report](file:///home/dhiraj/Downloads/FDR/docs/PERF_REPORT.md)
- [3D Scene Architecture & Fallback Policy](file:///home/dhiraj/Downloads/FDR/docs/PERF_3D.md)
- [End-to-End Workflow & UI Verification Log](file:///home/dhiraj/Downloads/FDR/docs/E2E_UI_LOG.md)
- [5-Minute Judge Demo Walkthrough Script](file:///home/dhiraj/Downloads/FDR/docs/DEMO_SCRIPT.md)
