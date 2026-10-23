# Product Requirements Document (PRD)
## MV GREENTECH CRM & ERP Web Application

**Company:** MV GREENTECH PVT LTD  
**Product:** Enterprise Industrial CRM & ERP System  
**Version:** 1.0 Production  
**Primary URL:** https://mv-greentech-crm.vercel.app  
**Backend API:** https://mv-greentech-crm.onrender.com/v1  
**Target Users:** Executive Directors, Sales Heads, Sales Engineers, and System Administrators

---

## 1. Executive Summary & Purpose

MV GREENTECH PVT LTD specializes in industrial automation components, proximity sensors, flow meters, and IoT monitoring solutions. The **MV GREENTECH CRM & ERP** platform is an enterprise-grade web application built to streamline the entire sales cycle—from lead ingestion and customer visits to multi-currency quotation generation, landed cost calculations, sales order conversion, and catalog inventory tracking.

---

## 2. User Roles & Access Control Matrix (RBAC)

The application enforces strict role-based access control across four designated roles:

| Role | Description | Access & Capabilities |
|---|---|---|
| **DIRECTOR** | Executive Management | Full administrative access, global company settings, financial margin visibility, team sales target definitions, and audit reports. |
| **SALES_HEAD** | Sales Leadership | Lead assignment, quotation discount approvals, sales team performance tracking, and customer visit reviews. |
| **SALESPERSON** | Field Sales Engineers | Personal lead management, visit logs, customer directory access, quotation generation, and order dispatch tracking. |
| **ADMINISTRATOR** | System Operations | User creation, role management, catalog master updates (Item Master), system configuration, and bulk data imports. |

---

## 3. Core Functional Modules

### 3.1. Item Master & Catalog Management
- **Central Inventory Catalog:** Tracks SKUs, product descriptions, units of measure (UOM), supplier codes, standard cost, standard selling prices, and status.
- **Bulk CSV / Excel Import:** Flexible import parser supporting comma (`,`), semicolon (`;`), and tab (`\t`) delimiters with duplicate detection and error reports.
- **Visual Product Assets:** Image thumbnail support with full-screen zoom modal for sensor inspection.
- **Categorization & Quick Filter:** "Our Products" dedicated mega-filter containing all 17 MV GREENTECH sensor lines (Inductive, Capacitive, Photoelectric, Ultrasonic, Laser, Flow Meters, IoT Gateways).
- **Safe Item Deletion:** Safe cascading nullification ensuring historical quotations and orders are not corrupted when an obsolete catalog item is deleted.

### 3.2. Lead Pipeline & Enquiries
- **Lead Intake:** Records customer name, contact person, mobile, email, requirements, part types, and estimated enquiry values.
- **Status Progression:** `GENERAL` → `MARKET` → `QUOTE_SUBMITTED` → `WON` → `LOST`.
- **Assignment & Tracking:** Tracks assigned sales engineer, origin date, and first scheduled customer visit.

### 3.3. Customer Master & Contact Directory
- **Organization Database:** GST identification, billing/shipping addresses, industry sector, and annual procurement potential.
- **Contact Persons:** Multiple contacts per customer with direct phone and email hooks.

### 3.4. Multi-Currency Quotation Builder
- **Pricing Engine:** Automatically computes line-item totals, sub-totals, GST (CGST/SGST/IGST), and final quotation values.
- **Forex & Landed Cost:** Handles domestic INR and international USD/EUR currency exchanges with real-time conversion rates.
- **Document Generation:** Produces downloadable, branded, tax-compliant PDF quotations with company letterhead, terms & conditions, and authorized signature blocks.

### 3.5. Sales Order Execution
- **One-Click Conversion:** Seamlessly converts approved quotations into confirmed Sales Orders without data re-entry.
- **Status Lifecycle:** `DRAFT` → `CONFIRMED` → `IN_PRODUCTION` → `DISPATCHED` → `DELIVERED` → `CANCELLED`.
- **Delivery Tracking:** Tracks dispatch dates, carrier tracking numbers, and delivery confirmation notes.

### 3.6. Customer Visit & Follow-Up Logs
- **Field Reporting:** Logs on-site client visit dates, purpose of meeting, customer feedback, and action items.
- **Next Action Reminders:** Direct integration with notification badges and follow-up schedules.

### 3.7. User Management & Company Settings
- **User Onboarding:** Secure user creation with password hashing, role assignment, and active status toggles.
- **Company Profile:** Real-time synchronization of company address, GSTIN, CIN, bank details, and Director signatures across all generated PDF documents.

---

## 4. Non-Functional Requirements

- **Responsive Experience:** High visual fidelity across desktop workstations (1920x1080), laptops (1366x768), and field tablets/smartphones.
- **Security:** JWT authentication with HTTP Authorization headers, password encryption with bcryptjs (salt rounds 10), and SQL parameterization via Prisma ORM.
- **Performance:** Sub-second API response times; server-side paginated list queries allowing page sizes from 10 up to 500 records.
- **Printer & PDF Readiness:** Dedicated table export configurations supporting A4/A3/Letter layouts, portrait/landscape orientation, and repeated header pagination.
