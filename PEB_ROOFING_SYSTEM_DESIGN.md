# 🏗️ PEB ROOFING COMPANY — ENTERPRISE MANAGEMENT SYSTEM
## Complete Production-Level System Design Blueprint

> **Version:** 1.0.0  
> **Classification:** Full-Stack Web Application  
> **Industry:** Pre-Engineered Building (PEB) / Roofing Construction  
> **Deployment Target:** Cloud (Production)

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Tech Stack Decision](#3-tech-stack-decision)
4. [Role & Permission Matrix](#4-role--permission-matrix)
5. [Module 1 — Store Management](#5-module-1--store-management)
6. [Module 2 — Workforce Management](#6-module-2--workforce-management)
7. [Module 3 — Expense Management](#7-module-3--expense-management)
8. [Module 4 — Advance Management](#8-module-4--advance-management)
9. [Module 5 — Purchase Request & Procurement](#9-module-5--purchase-request--procurement)
10. [Module 6 — Transport Request](#10-module-6--transport-request)
11. [Module 7 — Site Material Return & Scrap](#11-module-7--site-material-return--scrap)
12. [Module 8 — Material Request Workflow](#12-module-8--material-request-workflow)
13. [Database Schema (ERD Summary)](#13-database-schema-erd-summary)
14. [API Structure](#14-api-structure)
15. [UI/UX Design System](#15-uiux-design-system)
16. [Notification & Approval Engine](#16-notification--approval-engine)
17. [Reports & Dashboard](#17-reports--dashboard)
18. [Security Architecture](#18-security-architecture)
19. [Deployment Guide](#19-deployment-guide)
20. [Development Roadmap & Sprint Plan](#20-development-roadmap--sprint-plan)

---

## 1. EXECUTIVE SUMMARY

### Problem Statement
A PEB Roofing Company operates across multiple sites, managing raw materials, contract and permanent employees, vendor procurement, inter-site transport, and complex financial flows (advances, expenses). Without a unified system, these operations result in:
- Inventory discrepancies and untracked scrap losses
- Manual attendance fraud and payroll errors
- Uncontrolled advance disbursements
- No audit trail on purchase decisions
- Zero visibility on site-level material consumption

### Solution
A **single, unified Progressive Web Application (PWA)** called **"ROOF ERP"** — a role-based enterprise management system with:
- Real-time inventory intelligence
- Multi-tier approval workflows
- Smart attendance with contract billing automation
- Fully auditable financial request system
- Material consumption tracking per site

---

## 2. SYSTEM ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ROOF ERP — SYSTEM ARCHITECTURE              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   [Browser / Mobile PWA]  ──►  [CDN / Vercel Edge]                 │
│          ↓                                                           │
│   [Next.js 14 App Router] ──►  [REST API / tRPC]                   │
│          ↓                                                           │
│   [Auth Layer: NextAuth + JWT]                                       │
│          ↓                                                           │
│   ┌──────────────────────────────────────────┐                      │
│   │           Business Logic Layer            │                      │
│   │  Approval Engine | Notification Engine    │                      │
│   │  Inventory Engine | Payroll Calculator    │                      │
│   └──────────────────────────────────────────┘                      │
│          ↓                                                           │
│   [PostgreSQL (Primary DB)] ──► [Redis (Cache + Queue)]             │
│          ↓                                                           │
│   [File Storage: S3 / Cloudflare R2]                                │
│   [Email/SMS: Resend + Twilio]                                       │
│   [Real-time: Pusher / Ably]                                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles
| Principle | Implementation |
|-----------|---------------|
| **Single Source of Truth** | Every stock, attendance, and payment record has one canonical entry point |
| **Immutable Audit Log** | All mutations are append-only with user, timestamp, and IP |
| **Approval-Gate Model** | No financial or inventory action proceeds without proper approval chain |
| **Offline-First PWA** | Site managers can enter data offline; syncs when connected |
| **Event-Driven Notifications** | All state changes trigger notification events automatically |

---

## 3. TECH STACK DECISION

### Frontend
```
Framework     : Next.js 14 (App Router + Server Components)
Language      : TypeScript (strict mode)
Styling       : Tailwind CSS + shadcn/ui component library
State         : Zustand (client) + React Query (server state)
Forms         : React Hook Form + Zod validation
Tables        : TanStack Table v8
Charts        : Recharts
PWA           : next-pwa
Icons         : Lucide React
Date/Time     : date-fns
```

### Backend
```
API           : Next.js API Routes + tRPC for type-safety
ORM           : Prisma (PostgreSQL)
Auth          : NextAuth.js v5 (credentials + OTP)
Queue         : BullMQ (Redis-backed for approval workflows)
Validation    : Zod schemas (shared frontend/backend)
PDF Reports   : React-PDF / Puppeteer
Excel Exports : ExcelJS
```

### Infrastructure
```
Hosting       : Vercel (frontend) + Railway/Render (DB + Redis)
Database      : PostgreSQL 16 (Neon serverless or Supabase)
Cache         : Redis (Upstash serverless)
Storage       : Cloudflare R2 (invoices, images, documents)
Email         : Resend
SMS           : Twilio (for OTP and critical alerts)
Monitoring    : Sentry + Vercel Analytics
```

---

## 4. ROLE & PERMISSION MATRIX

### User Roles
| Role | Code | Description |
|------|------|-------------|
| Managing Director | `MD` | Highest authority — approves all financial decisions |
| General Manager | `GM` | Approves procurement and moderate advances |
| Site Manager | `SM` | Manages site operations, requests materials/transport |
| Store Manager | `STORE_MGR` | Sole authority to enter/edit stock data |
| HR/Admin | `HR` | Manages employee records, attendance, payroll |
| Accounts | `ACCOUNTS` | Views financial data, processes approved payments |
| Employee | `EMP` | Self-service: attendance, advance requests, view payslip |
| Contract Supervisor | `CONT_SUP` | Submits contract labour records |

### Permission Matrix

```
MODULE                  | MD | GM | SM | STORE | HR | ACCT | EMP | CSUP
------------------------|----|----|----| ------|----| -----|-----|------
Store — View            | ✅ | ✅ | ✅ |  ✅   | ❌ |  ✅  | ❌  |  ❌
Store — Create/Edit     | ✅ | ❌ | ❌ |  ✅   | ❌ |  ❌  | ❌  |  ❌
Attendance — Mark       | ✅ | ❌ | ✅ |  ❌   | ✅ |  ❌  | ✅  |  ✅
Attendance — Approve    | ✅ | ✅ | ❌ |  ❌   | ✅ |  ❌  | ❌  |  ❌
Expense — Create        | ✅ | ✅ | ✅ |  ❌   | ❌ |  ✅  | ❌  |  ❌
Expense — Approve       | ✅ | ✅ | ❌ |  ❌   | ❌ |  ❌  | ❌  |  ❌
Advance — Request       | ✅ | ✅ | ✅ |  ✅   | ✅ | ✅   | ✅  |  ✅
Advance — Approve       | ✅ | ❌ | ❌ |  ❌   | ❌ |  ❌  | ❌  |  ❌
Purchase — Initiate     | ✅ | ✅ | ✅ |  ✅   | ❌ |  ❌  | ❌  |  ❌
Purchase — Approve      | ✅ | ✅ | ❌ |  ❌   | ❌ |  ❌  | ❌  |  ❌
Transport — Request     | ✅ | ✅ | ✅ |  ❌   | ❌ |  ❌  | ❌  |  ❌
Transport — Approve     | ✅ | ✅ | ❌ |  ❌   | ❌ |  ❌  | ❌  |  ❌
Material Req — Create   | ✅ | ✅ | ✅ |  ❌   | ❌ |  ❌  | ❌  |  ❌
Material Req — Dispatch | ✅ | ❌ | ❌ |  ✅   | ❌ |  ❌  | ❌  |  ❌
Reports — View All      | ✅ | ✅ | ❌ |  ❌   | ✅ |  ✅  | ❌  |  ❌
Reports — View Own Site | ✅ | ✅ | ✅ |  ✅   | ❌ |  ❌  | ❌  |  ❌
```

---

## 5. MODULE 1 — STORE MANAGEMENT

> **Core Principle:** The store is the single source of truth for all physical inventory. Only the Store Manager or MD can create or modify records.

### 5.1 Stock Item Master

Each stock item contains:
```typescript
interface StockItem {
  id: string;
  itemCode: string;           // Auto-generated: PEB-ITEM-0001
  itemName: string;
  category: StockCategory;    // RAW_MATERIAL | CONSUMABLE | TOOL | HARDWARE | SAFETY
  subCategory: string;
  unit: UnitType;             // KG | METER | PIECE | BUNDLE | LITER | SET
  hsnCode?: string;           // For GST compliance
  minStockLevel: number;      // Reorder point trigger
  maxStockLevel: number;
  currentStock: number;       // Auto-calculated
  location: string;           // Rack / Bin location
  lastUpdatedBy: string;
  lastUpdatedAt: Date;
}
```

### 5.2 Stock Transactions

All inventory movement uses a **double-entry ledger model** — every transaction has a source and destination.

#### Transaction Types
| Type | Code | Description | Who Creates |
|------|------|-------------|-------------|
| Purchase Receipt | `GRN` | Goods received against PO | Store Manager |
| Material Issue | `MIS` | Issued to site/department | Store Manager |
| Material Return | `MRT` | Returned from site | Store Manager |
| Stock Adjustment | `ADJ` | Correction / audit | MD only |
| Scrap Declaration | `SCP` | Non-usable marked as scrap | Store Manager + MD approval |
| Inter-Site Transfer | `IST` | Site A → Site B | Store Manager |
| Opening Balance | `OPB` | Initial stock entry | MD only |

#### GRN (Goods Receipt Note) Schema
```typescript
interface GRN {
  grnNumber: string;          // GRN-2024-0001
  purchaseOrderId: string;    // Linked PO
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: Date;
  receivedDate: Date;
  items: GRNItem[];
  qualityCheck: {
    status: 'PASSED' | 'PARTIAL' | 'REJECTED';
    remarks: string;
    checkedBy: string;
  };
  attachments: string[];      // Invoice photos / delivery note
  createdBy: string;          // Must be STORE_MGR or MD
}
```

### 5.3 Low Stock Alerts

The system runs a **daily cron job** that:
1. Checks all items where `currentStock <= minStockLevel`
2. Groups them by category
3. Sends alert to Store Manager, GM, and MD
4. Auto-creates a **Purchase Indent** draft for review

### 5.4 Stock Ledger View

The store dashboard shows:
- **Real-time stock card** per item (current qty, value, movement graph)
- **Inward/Outward register** — daily log of all transactions
- **Pending dispatch list** — approved material requests awaiting dispatch
- **Discrepancy alerts** — requested qty vs actual dispatched mismatches

### 5.5 Stock Valuation
- Uses **FIFO (First In, First Out)** cost method
- Each GRN records unit cost
- Reports show stock value at cost and at current market (if entered)

---

## 6. MODULE 2 — WORKFORCE MANAGEMENT

> **Two employee types handled completely differently**: Regular (Permanent/Contract-Monthly) and Daily-Rate Contract Labour.

### 6.1 Employee Master

```typescript
interface Employee {
  id: string;
  employeeCode: string;       // EMP-001
  name: string;
  type: 'REGULAR' | 'CONTRACT_DAILY' | 'CONTRACT_MONTHLY';
  phone: string;
  aadhaarNumber: string;      // Encrypted at rest
  bankAccount: BankDetails;
  designation: string;
  department: string;
  assignedSite: string;
  dateOfJoining: Date;
  
  // For REGULAR employees
  salary?: number;            // Monthly CTC
  salaryComponents?: SalaryBreakdown;
  
  // For CONTRACT_DAILY employees
  dailyWageRate?: number;     // Per day rate
  contractorName?: string;    // Labour contractor name
  contractorId?: string;
  
  // For CONTRACT_MONTHLY
  contractAmount?: number;    // Monthly contract value
  contractStartDate?: Date;
  contractEndDate?: Date;
  scopeOfWork?: string;
  
  isActive: boolean;
  documents: EmployeeDocument[];
}
```

### 6.2 Regular Employee Attendance

#### Daily Attendance (HR / Site Manager marks)
```typescript
interface AttendanceRecord {
  employeeId: string;
  date: Date;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'HOLIDAY' | 'LEAVE' | 'PAID_LEAVE';
  checkIn?: string;           // "09:00"
  checkOut?: string;          // "18:00"
  overtimeHours?: number;
  site: string;
  markedBy: string;
  remarks?: string;
}
```

#### Monthly Attendance Summary
- Auto-calculates: Working days, Present days, Absent days, OT hours
- Generates payroll input automatically
- **Conflict detection**: If a day is marked Present AND Leave, system flags for HR review

#### Leave Management
```typescript
interface LeaveRequest {
  employeeId: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID' | 'MATERNITY' | 'EMERGENCY';
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  leaveBalance: {
    casual: number;
    sick: number;
    earned: number;
  };
}
```

### 6.3 Contract Daily Labour Attendance

This is the most critical and unique part of the system.

#### Daily Labour Muster Roll
```typescript
interface DailyMusterRoll {
  rollId: string;             // MUSTER-2024-MM-DD-SITE
  date: Date;
  site: string;
  submittedBy: string;        // Contract Supervisor
  approvedBy?: string;        // Site Manager
  workers: DailyWorkerEntry[];
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'LOCKED';
  lockedAt?: Date;
}

interface DailyWorkerEntry {
  workerName: string;
  aadhaarLast4: string;       // Partial ID for privacy
  contractorId: string;
  morningShift: boolean;
  afternoonShift: boolean;    // Full day = both true = 1.0
  overtime: number;           // Hours (0.5, 1.0, 2.0...)
  workType: string;           // 'WELDING' | 'FABRICATION' | 'ERECTION' | 'HELPER'
  dailyRate: number;
  totalAmount: number;        // Auto-calculated
}
```

#### Weekly Contractor Bill Generation
- System auto-aggregates daily muster rolls per contractor per week
- Generates **Contractor Bill Summary** with itemized worker-wise breakdown
- GM approves → MD approves → Accounts processes payment
- **Smart duplicate detection**: Same worker name + same date = alert

### 6.4 Contract Monthly Employee Tracking

```typescript
interface ContractMilestone {
  contractId: string;
  milestone: string;          // "Structural Steel Erection — Block A"
  targetDate: Date;
  completionDate?: Date;
  progressPercent: number;
  billingTrigger: boolean;    // Does this trigger payment?
  paymentAmount?: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
}
```

- Monthly contract employees tracked against milestones
- Payment released upon milestone completion + MD approval
- Extension request workflow if deadline missed

### 6.5 Payroll Processing (Regular Employees)

```typescript
interface PayrollRun {
  month: string;              // "2024-11"
  employees: PayslipRecord[];
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID';
}

interface PayslipRecord {
  employeeId: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  specialAllowance: number;
  overtimePay: number;
  grossSalary: number;
  
  // Deductions
  pf: number;
  esi: number;
  advanceDeduction: number;   // Auto-pulled from advance module
  loanDeduction: number;
  absentDeduction: number;    // Auto-calculated from attendance
  
  netSalary: number;
  paymentStatus: 'PENDING' | 'PAID';
  paymentDate?: Date;
  transactionRef?: string;
}
```

---

## 7. MODULE 3 — EXPENSE MANAGEMENT

> **Design principle**: Every rupee spent is traceable to a project, site, and approver.

### 7.1 Expense Categories (4 Divisions)

```
EXPENSES
├── RAW_MATERIAL_PURCHASE    → Linked to Purchase Module (auto-sync)
├── FUEL_EXPENSE             → Vehicle/Machinery fuel
├── MAINTENANCE_EXPENSE      → Equipment/vehicle/site maintenance  
└── GENERAL_EXPENSE          → Water, Gas, Electricity, Office supplies
```

### 7.2 Expense Entry Schema

```typescript
interface ExpenseEntry {
  id: string;
  expenseCode: string;        // EXP-2024-0001
  category: ExpenseCategory;
  subCategory: string;
  
  // Who, What, Where
  submittedBy: string;
  site: string;
  description: string;
  
  // Financial
  amount: number;
  gstAmount?: number;
  totalAmount: number;
  paymentMode: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'UPI';
  
  // Supporting Documents
  billAttachment: string;     // Required for amounts > ₹500
  vendorName?: string;
  billNumber?: string;
  billDate: Date;
  
  // Workflow
  status: ExpenseStatus;
  approvalChain: ApprovalStep[];
  
  // For Fuel Expenses (additional fields)
  fuelDetails?: {
    vehicleNumber: string;
    vehicleType: string;
    kmReading: number;
    litresFilled: number;
    ratePerLitre: number;
    fuelStation: string;
  };
  
  // For Maintenance (additional fields)
  maintenanceDetails?: {
    assetId: string;
    assetName: string;
    serviceType: 'PREVENTIVE' | 'BREAKDOWN' | 'PERIODIC';
    serviceProvider: string;
    warrantyApplicable: boolean;
  };
}
```

### 7.3 Expense Approval Rules

| Amount Range | Approval Required |
|-------------|------------------|
| Up to ₹5,000 | GM |
| ₹5,001 – ₹25,000 | GM → MD |
| Above ₹25,000 | GM → MD (with mandatory bill attachment) |

### 7.4 Expense Dashboard Features
- Monthly expense burn rate per category (bar chart)
- Budget vs Actual comparison (if budget is set per category)
- Site-wise expense breakdown
- Top 10 expense entries this month
- GST input credit summary (for raw material purchases)
- **Fuel efficiency tracker**: km/litre ratio per vehicle over time

---

## 8. MODULE 4 — ADVANCE MANAGEMENT

> **Two types of advances, two different workflows.** All advances reduce from payroll automatically.

### 8.1 Advance Types

#### Type A — General Advance (Work Purpose)
For purchasing materials, travel, petty cash float, emergency site expenses.

```typescript
interface GeneralAdvanceRequest {
  id: string;
  requestCode: string;        // ADV-G-2024-001
  requestedBy: string;
  type: 'GENERAL';
  purpose: string;
  amount: number;
  requiredByDate: Date;
  projectOrSite: string;
  
  // Settlement Terms
  settlementDays: number;     // Expected settlement in X days
  settlementMethod: 'BILL_SUBMISSION' | 'RETURN_CASH' | 'SALARY_DEDUCTION';
  
  // Approval
  status: AdvanceStatus;
  approvalChain: ApprovalStep[];
  
  // Settlement
  settledAmount?: number;
  settledDate?: Date;
  billsAttached?: string[];
  balanceToRecover?: number;
}
```

#### Type B — Salary Advance
Personal financial emergency — repaid through salary deduction over defined months.

```typescript
interface SalaryAdvanceRequest {
  id: string;
  requestCode: string;        // ADV-S-2024-001
  requestedBy: string;
  type: 'SALARY';
  reason: string;
  amount: number;
  
  // Repayment Plan (auto-calculated)
  repaymentMonths: number;    // 1 to 6 months
  monthlyDeduction: number;   // amount / repaymentMonths
  repaymentStartMonth: string; // "2024-12"
  repaymentSchedule: RepaymentEntry[];
  
  outstandingBalance: number; // Tracks remaining
  
  // Eligibility Check (auto-run on submission)
  eligibilityCheck: {
    isEligible: boolean;
    reason?: string;
    existingAdvanceBalance: number;
    maxEligibleAmount: number; // e.g., 2 months gross salary
  };
  
  status: AdvanceStatus;
  approvedBy?: string;        // Only MD can approve
  approvedAt?: Date;
}
```

### 8.2 Advance Rules Engine

```
RULES (configurable by MD):
┌─────────────────────────────────────────────────┐
│  Salary Advance Rules                           │
│  ─────────────────────────────────────────────  │
│  • Max amount: 2 × Monthly Gross Salary         │
│  • Cooldown: Cannot request if existing         │
│    balance > 0                                  │
│  • Min tenure: 6 months employment              │
│  • Max repayment: 6 months                      │
│  • Approver: MD ONLY                            │
│                                                 │
│  General Advance Rules                          │
│  ─────────────────────────────────────────────  │
│  • Up to ₹10,000: GM approval                  │
│  • Above ₹10,000: MD approval                  │
│  • Settlement: 15 days from advance date        │
│  • Overdue alert: Auto-notify after 15 days     │
└─────────────────────────────────────────────────┘
```

### 8.3 Advance Ledger
- Per-employee ledger showing all advances, repayments, outstanding balance
- Auto-integration with payroll: outstanding amounts automatically reflected as deductions
- MD dashboard shows total advance exposure company-wide

---

## 9. MODULE 5 — PURCHASE REQUEST & PROCUREMENT

> **Full P2P (Procure-to-Pay) workflow** with vendor intelligence and comparison.

### 9.1 Purchase Workflow Overview

```
Step 1: PURCHASE INDENT (Initiator)
         ↓
Step 2: GM REVIEW & APPROVAL
         ↓
Step 3: VENDOR QUOTATION COLLECTION (Min 3 vendors)
         ↓
Step 4: COMPARISON MATRIX (Auto-generated)
         ↓
Step 5: RECOMMENDATION & NOTES
         ↓
Step 6: MD FINAL APPROVAL
         ↓
Step 7: PURCHASE ORDER GENERATION (PDF)
         ↓
Step 8: GRN (Goods Receipt — Store Manager)
         ↓
Step 9: INVOICE MATCHING & PAYMENT
         ↓
Step 10: CLOSED
```

### 9.2 Vendor Master

```typescript
interface Vendor {
  id: string;
  vendorCode: string;         // VND-001
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstNumber: string;
  panNumber: string;
  
  categories: VendorCategory[];   // What they supply
  
  // Performance Metrics (auto-updated)
  rating: number;             // 1-5 stars
  totalOrders: number;
  onTimeDeliveryRate: number; // %
  qualityPassRate: number;    // % of GRNs passed quality
  avgLeadTimeDays: number;
  
  bankDetails: BankDetails;
  isBlacklisted: boolean;
  blacklistReason?: string;
  paymentTerms: string;       // "Net 30", "Advance", etc.
  documents: VendorDocument[]; // GST cert, PAN, etc.
}
```

### 9.3 Purchase Indent

```typescript
interface PurchaseIndent {
  id: string;
  indentCode: string;         // PI-2024-0001
  requestedBy: string;
  requestedFor: string;       // Site / Department
  urgency: 'ROUTINE' | 'URGENT' | 'CRITICAL';
  requiredByDate: Date;
  
  items: IndentItem[];
  
  reason: string;             // Why is this needed?
  projectReference?: string;
  budgetAvailable: boolean;
  
  status: IndentStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectionReason?: string;
}

interface IndentItem {
  itemId: string;
  itemName: string;
  specification: string;      // Detailed spec / grade / size
  quantity: number;
  unit: string;
  estimatedUnitCost?: number;
  currentStockQty: number;    // Auto-pulled from store
  lastPurchasePrice?: number; // Auto-pulled from history
}
```

### 9.4 Vendor Quotation & Comparison

```typescript
interface VendorQuotation {
  quotationId: string;
  indentId: string;
  vendorId: string;
  quotationDate: Date;
  validUntil: Date;
  
  items: QuotationItem[];
  
  deliveryLeadDays: number;
  paymentTerms: string;
  transportIncluded: boolean;
  gstApplicable: boolean;
  
  totalValue: number;
  document: string;           // Uploaded quotation PDF/image
  
  notes?: string;
}
```

#### Auto-Generated Comparison Matrix
The system generates a side-by-side comparison:

```
┌──────────────────┬──────────┬──────────┬──────────┬─────────────────┐
│ Item             │ Vendor A │ Vendor B │ Vendor C │ Recommendation  │
├──────────────────┼──────────┼──────────┼──────────┼─────────────────┤
│ GI Sheet 0.5mm   │ ₹4,200/T │ ₹3,980/T │ ₹4,100/T │ ✅ Vendor B     │
│ Lead Time        │ 5 days   │ 7 days   │ 4 days   │                 │
│ Transport        │ Included │ Extra    │ Included │                 │
│ GST              │ 18%      │ 18%      │ 18%      │                 │
│ Total Landed     │ ₹4,200   │ ₹4,280   │ ₹4,100   │ ✅ Vendor C     │
│ Vendor Rating    │ ⭐4.2    │ ⭐4.8    │ ⭐3.9    │                 │
├──────────────────┼──────────┼──────────┼──────────┼─────────────────┤
│ SCORE            │ 78/100   │ 82/100   │ 80/100   │ ✅ VENDOR B     │
└──────────────────┴──────────┴──────────┴──────────┴─────────────────┘
```

**Scoring Algorithm:**
- Price: 40% weight (lowest = 100 points)
- Lead Time: 20% weight
- Vendor Rating: 25% weight  
- Payment Terms: 15% weight
- System recommends but **human always decides**

### 9.5 Purchase Order (PO)

```typescript
interface PurchaseOrder {
  id: string;
  poNumber: string;           // PO-2024-0001
  indentId: string;
  vendorId: string;
  quotationId: string;
  
  items: POItem[];
  totalAmount: number;
  
  deliveryAddress: string;
  deliveryDeadline: Date;
  paymentTerms: string;
  
  specialInstructions?: string;
  
  status: 'DRAFT' | 'SENT' | 'ACKNOWLEDGED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  sentAt?: Date;
  acknowledgedAt?: Date;
  
  approvedByMD: boolean;
  approvalDate?: Date;
  
  // Payment tracking
  payments: POPayment[];
  totalPaid: number;
  balanceDue: number;
}
```

---

## 10. MODULE 6 — TRANSPORT REQUEST

> **Tracks every movement of material** between site and company (and site to site).

### 10.1 Transport Request Schema

```typescript
interface TransportRequest {
  id: string;
  requestCode: string;        // TRQ-2024-001
  requestedBy: string;        // Site Manager
  requestType: TransportType;
  
  origin: Location;
  destination: Location;
  
  materials: TransportMaterial[];
  
  requiresVehicle: boolean;
  vehicleType?: 'PICKUP' | 'MINI_TRUCK' | 'LORRY' | 'TRAILER' | 'CRANE';
  ownVehicle?: boolean;       // Company vehicle or hired
  estimatedWeight?: number;   // KG / MT
  
  scheduledDate: Date;
  urgency: 'NORMAL' | 'URGENT';
  
  reason: string;
  siteRefNumber?: string;     // Site work order reference
  
  status: TransportStatus;
  approvedBy?: string;
  
  // Execution Details (filled after completion)
  actualVehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  departureTime?: Date;
  arrivalTime?: Date;
  actualKm?: number;
  transportCost?: number;
  
  // Delivery Confirmation
  receivedBy?: string;
  receivedAt?: Date;
  deliveryCondition?: 'GOOD' | 'DAMAGED' | 'PARTIAL';
  damageNotes?: string;
  receiverSignature?: string; // Base64 image or eSign
}
```

### 10.2 Transport Types
| Type Code | Description |
|-----------|-------------|
| `SITE_TO_COMPANY` | Return of materials, equipment, tools |
| `COMPANY_TO_SITE` | Dispatch of purchased/stored materials |
| `SITE_TO_SITE` | Inter-site material movement |
| `VENDOR_TO_SITE` | Direct delivery from vendor to site |
| `SITE_TO_SCRAP` | Transport of scrap from site |

### 10.3 Material Dispatch Note (MDN)
- Auto-generated when transport is approved
- Includes item list, quantities, vehicle details
- **QR Code on MDN** for receiver to confirm delivery via mobile

### 10.4 Transport Cost Tracking
- Each transport request logs actual cost
- Monthly transport cost report per site
- Comparison of own vehicle vs hired transport costs

---

## 11. MODULE 7 — SITE MATERIAL RETURN & SCRAP

> **Closes the material loop**: tracks what was sent to site, what came back, and what's lost/scrapped.

### 11.1 Material Return Note (MRN)

Triggered when Site Manager initiates a return from site.

```typescript
interface MaterialReturnNote {
  id: string;
  mrnCode: string;            // MRN-2024-001
  siteId: string;
  returnedBy: string;         // Site Manager
  returnDate: Date;
  
  transportRequestId?: string; // Linked transport request
  
  items: ReturnItem[];
  
  // Financial Summary (auto-calculated)
  usableReturnValue: number;
  scrapValue: number;
  totalLossValue: number;
  
  status: 'DRAFT' | 'IN_TRANSIT' | 'RECEIVED_BY_STORE' | 'VERIFIED' | 'CLOSED';
  receivedByStoreAt?: Date;
  verifiedByStoreManager?: boolean;
}
```

### 11.2 Return Item Classification

```typescript
interface ReturnItem {
  itemId: string;
  itemName: string;
  originalIssuedQty: number;   // What was sent from store
  returnedQty: number;
  
  // Classification (KEY FEATURE)
  usableQty: number;           // Can go back to store
  nonUsableQty: number;        // Damaged / unusable
  scrapQty: number;            // Send to scrap dealer
  
  condition: 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED' | 'SCRAP';
  conditionNotes: string;
  photos?: string[];           // Photo evidence of condition
  
  // Auto-calculated usage tracking
  consumedQty: number;         // issued - (usable + nonUsable + scrap)
  usagePercent: number;        // consumedQty / originalIssuedQty × 100
}
```

### 11.3 Material Usage Tracker (Per Site/Project)

This is a **powerful analysis feature**:

```
SITE: Industrial Shed — Kamarajar Port (2024)
════════════════════════════════════════════════════════════
Item              │ Issued │ Used  │ Returned │ Scrap │ Loss%
──────────────────┼────────┼───────┼──────────┼───────┼──────
GI Sheets 0.5mm  │ 2,400  │ 2,150 │ 180 Good │ 70    │  0%
MS Angle 50x50   │  850m  │  780m │  40m Good│ 30m   │  0%
Bolts M16 (nos)  │  5000  │  4620 │  300 Good│  80   │  0%
Fasteners Pack   │   120  │  115  │    0     │   5   │  0%
Welding Rod Box  │   200  │  198  │    0     │   2   │ 1%
──────────────────┴────────┴───────┴──────────┴───────┴──────
SUMMARY: Total Material Value Sent: ₹8,45,200
         Recovered (Usable):        ₹1,22,400
         Scrap Recovery Est:        ₹  8,500
         Net Consumption:           ₹7,14,300
```

### 11.4 Scrap Management Workflow

```
Non-usable materials identified in MRN
           ↓
Store Manager verifies physical condition
           ↓
Scrap batch created (SCR-2024-001)
           ↓
Scrap dealer quotation (min 2 quotes)
           ↓
MD approves best quote
           ↓
Scrap sold → receipt recorded
           ↓
Revenue posted to "Scrap Income" account
           ↓
Items removed from inventory permanently
```

```typescript
interface ScrapBatch {
  id: string;
  batchCode: string;          // SCR-2024-001
  items: ScrapItem[];
  totalEstimatedWeight: number; // KG
  
  quotations: ScrapQuotation[];
  selectedDealerId?: string;
  
  saleDate?: Date;
  saleAmount?: number;
  paymentReceived?: boolean;
  receiptNumber?: string;
  
  status: 'PENDING' | 'QUOTED' | 'APPROVED' | 'SOLD' | 'CLOSED';
}
```

---

## 12. MODULE 8 — MATERIAL REQUEST WORKFLOW

> **The most operationally critical workflow.** Site managers request material from store in a structured, auditable way.

### 12.1 Complete Material Request Flow

```
STAGE 1: REQUEST INITIATION
┌─────────────────────────────────────────┐
│  Site Manager creates Material Request   │
│  • Selects items with specifications     │
│  • States purpose / project reference    │
│  • Sets required date                    │
│  • System auto-shows current stock level │
│  • System checks: Is item available?     │
└────────────────────┬────────────────────┘
                     ↓
STAGE 2: AUTO-VALIDATION
┌─────────────────────────────────────────┐
│  SYSTEM CHECKS:                         │
│  ✅ Stock available → Proceed           │
│  ⚠️  Low stock → Flag + proceed         │
│  ❌ Out of stock → Auto-create          │
│     Purchase Indent + Notify            │
└────────────────────┬────────────────────┘
                     ↓
STAGE 3: GM REVIEW (if amount > threshold)
┌─────────────────────────────────────────┐
│  GM sees pending request                 │
│  • Reviews justification                 │
│  • Can modify quantities                 │
│  • Approve / Reject with reason          │
└────────────────────┬────────────────────┘
                     ↓
STAGE 4: STORE MANAGER ACTION
┌─────────────────────────────────────────┐
│  Store Manager receives approved request │
│  • Verifies physical availability        │
│  • Picks and prepares items              │
│  • Records actual dispatch quantities    │
│    (may differ from requested — noted)   │
│  • Prints Material Issue Slip (MIS)      │
│  • Updates stock automatically           │
└────────────────────┬────────────────────┘
                     ↓
STAGE 5: DISPATCH & ACKNOWLEDGMENT
┌─────────────────────────────────────────┐
│  Driver/Transport assigned               │
│  MDN (Material Dispatch Note) generated  │
│  Site Manager receives & acknowledges    │
│  System records: Issued vs Received qty  │
└─────────────────────────────────────────┘
```

### 12.2 Material Request Schema

```typescript
interface MaterialRequest {
  id: string;
  requestCode: string;        // MRQ-2024-0001
  
  requestedBy: string;        // Site Manager
  siteId: string;
  projectName: string;
  workReference: string;      // Work order / drawing number
  
  requiredByDate: Date;
  urgency: 'NORMAL' | 'URGENT';
  purpose: string;
  
  items: MaterialRequestItem[];
  
  // Workflow
  stage: RequestStage;
  history: WorkflowEvent[];   // Full audit trail
  
  // Store Manager notes
  partialFulfillment?: boolean;
  partialReason?: string;
  storeRemarks?: string;
  
  // Dispatch Info
  dispatchedItems?: DispatchItem[];
  dispatchDate?: Date;
  transportRequestId?: string;
  
  // Acknowledgment
  acknowledgedBySite?: boolean;
  acknowledgedAt?: Date;
  acknowledgmentDiscrepancy?: string;
}

interface MaterialRequestItem {
  itemId: string;
  itemName: string;
  specification: string;
  requestedQty: number;
  unit: string;
  
  // Auto-filled from store
  currentStockQty: number;
  
  // Store Manager fills
  approvedQty?: number;
  issuedQty?: number;
  issuedBatchNo?: string;     // Traceability
}
```

### 12.3 Material Request Intelligence Features

1. **Repetitive Request Alert**: If same items are requested from same site repeatedly within 7 days → warn the requester
2. **Historical Consumption Analysis**: "Last 3 times this item was requested from this site, average quantity was X"
3. **Auto-suggest**: Based on project type and stage, system suggests commonly needed items
4. **Budget Impact**: If project has budget assigned, show remaining budget impact of this request

---

## 13. DATABASE SCHEMA (ERD SUMMARY)

### Core Tables

```sql
-- Users & Auth
users (id, name, role, email, phone, password_hash, is_active, site_id)
user_sessions (id, user_id, token, expires_at, ip_address)
audit_logs (id, user_id, action, entity, entity_id, old_value, new_value, ip, timestamp)

-- Organization
sites (id, name, address, gps_lat, gps_lng, is_active)
departments (id, name, site_id)

-- Employees
employees (id, code, name, type, phone, aadhaar_enc, site_id, department_id, is_active, joining_date, salary_data jsonb)
contractors (id, name, contact, gst, payment_terms, rating, is_active)
contract_workers (id, name, aadhaar_last4, contractor_id, daily_rate, skill_type)

-- Attendance
attendance_records (id, employee_id, date, status, check_in, check_out, ot_hours, site_id, marked_by)
muster_rolls (id, roll_code, date, site_id, submitted_by, approved_by, status, locked_at)
muster_entries (id, roll_id, worker_id, morning_shift, afternoon_shift, overtime, total_amount)
leave_requests (id, employee_id, leave_type, from_date, to_date, reason, status, approved_by)

-- Inventory / Store
stock_items (id, code, name, category, unit, min_qty, max_qty, current_qty, location, hsn_code)
stock_transactions (id, type, item_id, quantity, reference_id, reference_type, unit_cost, site_id, created_by, created_at, notes)
grns (id, grn_number, po_id, vendor_id, received_date, invoice_number, quality_status, created_by)
grn_items (id, grn_id, item_id, po_qty, received_qty, unit_cost, quality_status)

-- Vendors & Procurement
vendors (id, code, name, gst, pan, rating, categories jsonb, bank_details jsonb, is_blacklisted)
purchase_indents (id, code, requested_by, site_id, urgency, required_by, status, approved_by)
indent_items (id, indent_id, item_id, qty, spec, estimated_cost)
vendor_quotations (id, indent_id, vendor_id, total_value, lead_days, payment_terms, document_url, valid_until)
quotation_items (id, quotation_id, item_id, unit_price, qty, gst_percent)
purchase_orders (id, po_number, indent_id, vendor_id, quotation_id, total_amount, status, approved_by_md, payment_terms)
po_items (id, po_id, item_id, qty, unit_price, total_price, received_qty)
po_payments (id, po_id, amount, payment_date, mode, reference, recorded_by)

-- Transport
transport_requests (id, code, requested_by, type, origin jsonb, destination jsonb, scheduled_date, status, vehicle_no, driver_name, actual_cost)
transport_items (id, request_id, item_id, qty, unit, notes)

-- Material Requests
material_requests (id, code, requested_by, site_id, project_name, work_ref, required_by, urgency, purpose, stage, partial_fulfilled)
material_request_items (id, request_id, item_id, requested_qty, approved_qty, issued_qty, batch_no)

-- Material Returns
material_return_notes (id, code, site_id, returned_by, return_date, status, transport_id, verified_by_store)
return_items (id, mrn_id, item_id, issued_qty, returned_qty, usable_qty, non_usable_qty, scrap_qty, condition, notes)

-- Scrap
scrap_batches (id, code, created_from_mrn_id, total_weight, status, sale_amount, sale_date, dealer_id)
scrap_items (id, batch_id, item_id, qty, weight, estimated_value)
scrap_quotations (id, batch_id, dealer_name, phone, offered_rate, total_amount, is_selected)

-- Expenses
expense_entries (id, code, category, sub_category, submitted_by, site_id, amount, gst_amount, payment_mode, bill_number, bill_date, status, approved_by, fuel_details jsonb, maintenance_details jsonb)

-- Advances
advance_requests (id, code, employee_id, type, amount, purpose, site_id, status, approved_by, repayment_months, monthly_deduction, outstanding_balance)
advance_repayments (id, advance_id, month, due_amount, paid_amount, payroll_ref, status)

-- Payroll
payroll_runs (id, month, status, approved_by, total_gross, total_deductions, total_net)
payslips (id, run_id, employee_id, basic, hra, allowances, ot_pay, gross, pf, esi, advance_deduction, absent_deduction, net, payment_status, transaction_ref)

-- Notifications
notifications (id, user_id, type, title, body, entity_type, entity_id, is_read, created_at)
approval_queue (id, entity_type, entity_id, step_number, approver_role, approver_id, status, actioned_at, remarks)
```

---

## 14. API STRUCTURE

### API Route Organization

```
/api/
├── auth/
│   ├── login
│   ├── logout
│   └── refresh
│
├── store/
│   ├── items/          [GET, POST]
│   ├── items/:id       [GET, PUT]
│   ├── transactions/   [GET, POST]
│   ├── grn/            [GET, POST]
│   └── alerts/         [GET]
│
├── employees/
│   ├── /               [GET, POST]
│   ├── /:id            [GET, PUT]
│   └── /:id/payslips   [GET]
│
├── attendance/
│   ├── daily/          [GET, POST, PUT]
│   ├── muster/         [GET, POST]
│   ├── muster/:id/approve
│   └── leaves/         [GET, POST]
│
├── expenses/
│   ├── /               [GET, POST]
│   ├── /:id            [GET]
│   └── /:id/approve    [POST]
│
├── advances/
│   ├── /               [GET, POST]
│   ├── /:id            [GET]
│   └── /:id/approve    [POST]
│
├── procurement/
│   ├── vendors/        [GET, POST, PUT]
│   ├── indents/        [GET, POST]
│   ├── quotations/     [GET, POST]
│   ├── comparison/:id  [GET]
│   ├── purchase-orders/ [GET, POST]
│   └── grn/            [GET, POST]
│
├── transport/
│   ├── /               [GET, POST]
│   ├── /:id            [GET, PUT]
│   └── /:id/complete   [POST]
│
├── material-requests/
│   ├── /               [GET, POST]
│   ├── /:id            [GET]
│   ├── /:id/approve    [POST]
│   └── /:id/dispatch   [POST]
│
├── returns/
│   ├── /               [GET, POST]
│   ├── /:id            [GET]
│   └── /:id/verify     [POST]
│
├── scrap/
│   ├── batches/        [GET, POST]
│   └── batches/:id/sell [POST]
│
├── payroll/
│   ├── runs/           [GET, POST]
│   ├── runs/:id/approve [POST]
│   └── payslips/:empId [GET]
│
└── reports/
    ├── dashboard
    ├── stock-summary
    ├── expense-summary
    ├── attendance-summary
    └── site-material-usage
```

---

## 15. UI/UX DESIGN SYSTEM

### Design Language: "Industrial Precision"
- **Theme**: Dark navy + amber/orange accent (industrial + trust)
- **Font**: `Syne` (headings) + `IBM Plex Sans` (body)
- **Design Principle**: Data-dense but never overwhelming

### Color Palette
```css
:root {
  /* Base */
  --bg-primary:    #0D1117;   /* Deep navy */
  --bg-secondary:  #161B22;   /* Elevated surface */
  --bg-card:       #1C2128;   /* Card background */
  --border:        #30363D;   /* Borders */
  
  /* Brand */
  --accent:        #F0883E;   /* Amber orange */
  --accent-light:  #FFA657;
  --accent-glow:   rgba(240,136,62,0.15);
  
  /* Status */
  --success:       #3FB950;
  --warning:       #D29922;
  --error:         #F85149;
  --info:          #58A6FF;
  
  /* Text */
  --text-primary:  #E6EDF3;
  --text-secondary:#8B949E;
  --text-muted:    #484F58;
}
```

### Component Library (Built on shadcn/ui)
- **StatusBadge**: Color-coded status chips for all workflows
- **ApprovalTimeline**: Visual multi-step approval progress
- **StockGauge**: Circular progress showing stock level vs min/max
- **DataTable**: Sortable, filterable, exportable table
- **RequestCard**: Kanban-style card for pending requests
- **NotificationDrawer**: Slide-in notifications panel
- **MobileBottomNav**: 5-tab bottom navigation for mobile/site use

### Page Layout

```
┌─────────────────────────────────────────────────┐
│  🏗️ ROOF ERP    [Site: Chennai]   🔔3  👤 Menu  │
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  NAV     │   MAIN CONTENT AREA                  │
│  SIDEBAR │                                      │
│          │   Breadcrumb > Page Title             │
│  ─────   │   ─────────────────────────          │
│  📊 Dash │   [Action Buttons]                   │
│  🏪 Store│                                      │
│  👷 Staff│   [Content / Tables / Forms]         │
│  💰 Fin  │                                      │
│  🛒 Proc │                                      │
│  📦 Req  │                                      │
│  🚛 Trans│                                      │
│  📈 Rep  │                                      │
│          │                                      │
└──────────┴──────────────────────────────────────┘
```

### Mobile-First Considerations
- All forms work on mobile (critical for site managers)
- Offline data entry with sync indicator
- QR code scanner for delivery confirmation
- Photo upload from camera for bills/damage photos
- Biometric attendance (if device supports)

---

## 16. NOTIFICATION & APPROVAL ENGINE

### Notification Events
```typescript
enum NotificationEvent {
  // Store
  STOCK_LOW                 = 'stock.low',
  GRN_CREATED               = 'grn.created',
  
  // Requests
  MATERIAL_REQUEST_CREATED  = 'material_request.created',
  MATERIAL_REQUEST_APPROVED = 'material_request.approved',
  MATERIAL_REQUEST_REJECTED = 'material_request.rejected',
  MATERIAL_DISPATCHED       = 'material.dispatched',
  
  // Finance
  ADVANCE_REQUESTED         = 'advance.requested',
  ADVANCE_APPROVED          = 'advance.approved',
  ADVANCE_OVERDUE           = 'advance.overdue',
  EXPENSE_SUBMITTED         = 'expense.submitted',
  EXPENSE_APPROVED          = 'expense.approved',
  
  // Procurement
  INDENT_RAISED             = 'indent.raised',
  PO_APPROVED               = 'po.approved',
  PO_DELIVERY_OVERDUE       = 'po.delivery_overdue',
  
  // Transport
  TRANSPORT_REQUESTED       = 'transport.requested',
  TRANSPORT_DISPATCHED      = 'transport.dispatched',
  TRANSPORT_DELIVERED       = 'transport.delivered',
  
  // Payroll
  PAYROLL_PROCESSED         = 'payroll.processed',
  ADVANCE_DEDUCTED          = 'advance.deducted',
}
```

### Delivery Channels
| Channel | Use Case |
|---------|----------|
| In-App (real-time) | All notifications |
| Push Notification (PWA) | Urgent approvals, alerts |
| Email | Financial approvals, monthly payslips |
| WhatsApp/SMS | Critical alerts to MD only |

### Approval Engine Rules
```typescript
// Configurable by MD — stored in DB
const approvalRules = {
  material_request: {
    conditions: [
      { threshold: 'value > 50000', chain: ['GM', 'MD'] },
      { threshold: 'urgency == CRITICAL', chain: ['GM'] },
      { threshold: 'default', chain: ['GM'] },
    ]
  },
  expense: {
    conditions: [
      { threshold: 'amount > 25000', chain: ['GM', 'MD'] },
      { threshold: 'amount > 5000',  chain: ['GM'] },
      { threshold: 'default',        chain: ['GM'] },
    ]
  },
  advance_salary: {
    conditions: [
      { threshold: 'always', chain: ['MD'] }
    ]
  }
}
```

### Escalation Rules
- If approver hasn't acted in 24 hours → reminder notification
- If approver hasn't acted in 48 hours → escalate to next role
- If MD hasn't acted in 72 hours → alert on dashboard (no auto-approval)

---

## 17. REPORTS & DASHBOARD

### MD Dashboard (Command Center)
```
┌─────────────────────────────────────────────────────────────┐
│  TODAY AT A GLANCE                                          │
│  ─────────────────────────────────────────────────────────  │
│  Pending Approvals: 7    Low Stock Alerts: 3               │
│  Advance Exposure: ₹2.4L  Active Sites: 4                  │
│  ─────────────────────────────────────────────────────────  │
│  [MTD Expense Burn]  [Site-wise Headcount]                  │
│  [Top Material Usage] [Pending POs]                         │
└─────────────────────────────────────────────────────────────┘
```

### Standard Reports

| Report | Frequency | Export |
|--------|-----------|--------|
| Daily Stock Statement | Daily | PDF, Excel |
| Monthly Expense Summary | Monthly | PDF |
| Site-wise Material Consumption | Monthly | Excel |
| Contract Labour Bill Register | Weekly | PDF |
| Advance Outstanding Register | On-demand | PDF |
| Purchase Register | Monthly | Excel |
| Vendor Performance Report | Monthly | PDF |
| Attendance Register | Monthly | PDF, Excel |
| Payroll Summary | Monthly | PDF |
| Scrap Recovery Report | Quarterly | PDF |
| Material Usage Efficiency | Per Project | PDF |

---

## 18. SECURITY ARCHITECTURE

### Authentication
- JWT tokens (15 min access, 7 day refresh)
- OTP-based login (SMS/Email) as alternative
- Session management with Redis
- Force logout on password change

### Authorization
- Role-Based Access Control (RBAC) — server-side enforced
- Every API endpoint validates both authentication AND role
- Resource-level checks (a site manager can only see their site's data)

### Data Protection
- Aadhaar numbers AES-256 encrypted at rest
- Bank details encrypted at rest
- All financial amounts stored as integers (paise, not rupees) to avoid floating point errors
- HTTPS enforced, HSTS enabled

### Audit Trail
Every action that creates or modifies data logs:
```typescript
{
  userId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT',
  entity: string,    // "material_request"
  entityId: string,
  oldValue: object,  // JSON snapshot before
  newValue: object,  // JSON snapshot after
  ip: string,
  userAgent: string,
  timestamp: Date
}
```
Audit logs are **read-only** — no user can delete them, including MD.

### Data Backup
- Automated daily PostgreSQL backup to S3
- 30-day retention
- Point-in-time recovery enabled

---

## 19. DEPLOYMENT GUIDE

### Environment Variables
```env
# App
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<random-32-char>

# Database
DATABASE_URL=postgresql://user:pass@host/dbname
DIRECT_URL=postgresql://user:pass@host/dbname

# Redis
REDIS_URL=redis://default:pass@host:port

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET_NAME=roof-erp-files

# Email
RESEND_API_KEY=

# SMS (Twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE=

# App Config
COMPANY_NAME="Your PEB Company Name"
DEFAULT_TIMEZONE=Asia/Kolkata
CURRENCY=INR
MAX_SALARY_ADVANCE_MONTHS=6
ADVANCE_SETTLEMENT_DAYS=15
```

### Production Checklist
```
□ Environment variables configured
□ Database migrations run (prisma migrate deploy)
□ Initial admin/MD account created via seed script
□ Site master data entered
□ Employee master data imported (CSV import tool)
□ Stock opening balance entered by Store Manager
□ Vendor master data entered
□ Approval rules configured by MD
□ Leave balance initialized for employees
□ SSL certificate active
□ Monitoring/alerting configured (Sentry)
□ Backup strategy verified
□ PWA manifest configured with company branding
□ Test run completed with all roles
```

### Local Development
```bash
# Clone and install
git clone https://github.com/your-org/roof-erp.git
cd roof-erp
npm install

# Setup database
npx prisma migrate dev
npx prisma db seed

# Run dev server
npm run dev

# Build for production
npm run build
npm start
```

---

## 20. DEVELOPMENT ROADMAP & SPRINT PLAN

### Phase 1 — Foundation (Weeks 1–4)
```
Week 1: Project setup, authentication, role management, 
        user/employee master, site master

Week 2: Store module — item master, stock transactions, GRN, 
        real-time stock dashboard

Week 3: Attendance module — regular employee attendance,
        leave management, muster roll for contract labour

Week 4: Material Request workflow (full cycle), 
        notification engine setup
```

### Phase 2 — Financial Core (Weeks 5–8)
```
Week 5: Expense module — all 4 categories,
        approval workflow, bill upload

Week 6: Advance module — both types, 
        eligibility engine, repayment schedule

Week 7: Procurement — indent, vendor master, 
        quotation, comparison matrix

Week 8: Purchase Order, PO tracking, 
        PO payment tracking, GRN linkage
```

### Phase 3 — Logistics & Completion (Weeks 9–12)
```
Week 9:  Transport request module, 
         MDN generation, QR-based delivery confirmation

Week 10: Site material return, 
         classification workflow (usable/scrap), 
         scrap batch management

Week 11: Payroll engine — calculation, deductions, 
         payslip generation, export

Week 12: Reports module, MD dashboard, 
         PWA configuration, mobile optimization
```

### Phase 4 — Testing & Launch (Weeks 13–16)
```
Week 13: End-to-end testing, role-based testing,
         data import tools (employees, vendors, stock)

Week 14: User acceptance testing (UAT) with client,
         bug fixes, performance optimization

Week 15: Production deployment, initial data setup,
         training for each role group

Week 16: Live monitoring, hypercare support,
         feedback collection
```

---

## APPENDIX A — GLOSSARY

| Term | Definition |
|------|------------|
| **GRN** | Goods Receipt Note — document confirming receipt of purchased goods |
| **MDN** | Material Dispatch Note — document accompanying material movement |
| **MRN** | Material Return Note — document for site-to-store returns |
| **MRQ** | Material Request — request from site to store for materials |
| **PO** | Purchase Order — official order sent to vendor |
| **PI** | Purchase Indent — internal request to raise a PO |
| **Muster Roll** | Daily attendance sheet for contract day-labour |
| **FIFO** | First In First Out — inventory valuation method |
| **P2P** | Procure-to-Pay — end-to-end procurement process |
| **Scrap** | Non-recoverable or damaged material sold to scrap dealer |

---

## APPENDIX B — FUTURE ENHANCEMENTS (Post V1)

| Feature | Priority | Notes |
|---------|----------|-------|
| GPS-based attendance (geofenced) | High | Site attendance verification |
| Biometric device integration | Medium | Fingerprint scanners at sites |
| WhatsApp bot for approvals | High | MD can approve via WhatsApp |
| Project cost tracking (P&L) | High | Per-project profitability |
| Preventive maintenance scheduler | Medium | Equipment service schedules |
| Client portal (read-only) | Low | Share project progress with clients |
| AI-based material forecasting | Low | Predict material needs per project type |
| Multi-currency support | Low | For import purchases |
| Mobile app (React Native) | Medium | Native app after PWA is stable |

---

*Document prepared for production development.*  
*All schemas, workflows, and architecture decisions are designed for the Indian construction industry context including GST compliance, PF/ESI, contract labour regulations.*

**Build with care. Build to last. 🏗️**
