# AICTE FDR Vault — End-to-End UI & Workflow Execution Log
**SIH 2026 | Problem ID SIH26265 | AICTE**

---

## 1. Role-Based Flow Verifications

| ID | User Role | Flow Tested | Expected Outcome | Actual Result | Status |
|---|---|---|---|---|---|
| **E2E-01** | `SUPER_ADMIN` | Full System Boot & Master Overview | Access to user management, bank masters, job triggers, and global KPI dashboard. | Complete access granted; health checks OK. | **PASS** |
| **E2E-02** | `FINANCE_OFFICER` | FDR Registration Wizard (`/fdrs/new`) | Live compound interest calculation preview via `POST /fdrs/calculate` matches server. | Exact match down to the paisa; record created. | **PASS** |
| **E2E-03** | `INSTITUTION_USER` | Document Upload & Multi-Tenant Isolation | Uploads FDR scan. Cannot view or access other colleges' records (returns 404). | Strict 404 isolation confirmed; documents versioned. | **PASS** |
| **E2E-04** | `VERIFIER` | Checker Verification Queue (`/documents`) | Inspects attached PDF and verifies using keyboard shortcut `V` or rejects using `R`. | Status updated; maker-checker blocks self-verification. | **PASS** |
| **E2E-05** | `FINANCE_OFFICER` | Release Request Initiation (`/releases`) | Evaluates 4 release gates (Doc complete, Matured, No open requests, No dues). | Blocked if gates fail; passes once verified. | **PASS** |
| **E2E-06** | `APPROVING_AUTHORITY` | Final Release Sign-Off | Reviews release request; red warning banner shown if premature release. | Approval recorded; release step audit written. | **PASS** |
| **E2E-07** | `FINANCE_OFFICER` | Mark Released & Order PDF Generation | Enters UTR number, release date, and deductions. System generates PDF with QR. | Release order generated with reference AICTE/FDR/REL/2026/000001. | **PASS** |
| **E2E-08** | Public Visitor | Cryptographic Verification (`/verify-release/:ref`) | Scans QR code or opens verification URL without login credentials. | Public green seal with official verification details rendered. | **PASS** |
| **E2E-09** | `AUDITOR` | Immutable Audit Trail (`/audit`) | Reads hash-chained logs, verifies SHA-256 chain integrity, inspects JSON diffs. | All non-GET routes return 403; chain recomputed 100% valid. | **PASS** |
| **E2E-10** | All Roles | English / Hindi Language Toggle | User clicks language toggle in TopBar. All nav items and headers switch to Hindi. | Clean translation toggle without layout distortion. | **PASS** |
| **E2E-11** | All Roles | Command Bar (`Ctrl+K`) | User presses Ctrl+K. Modal opens with fuzzy search across FDRs, colleges, and pages. | Instant search results with keyboard navigation. | **PASS** |
| **E2E-12** | All Roles | My Work Command Center (`/my-work`) | Prioritized SLA-aware cards answer: What needs action, by whom, by when, what risk. | Role-customized action cards rendered with deep links. | **PASS** |
