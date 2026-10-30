# Feature Roadmap & Task Tracker
## MV GREENTECH CRM & ERP

**Current Release:** v1.1.0  
**Status Date:** October 2026  
**Health Check:** All Services Active (Vercel CDN + Render API + Neon PostgreSQL)

---

## 1. Feature Status Matrix

| Module / Feature | Status | Notes |
|---|:---:|---|
| **Authentication & RBAC** | ✅ Done | Director, Sales Head, Salesperson, Administrator roles with JWT protection. |
| **Clean Green & White ERP Theme** | ✅ Done | Emerald `#059669` palette, frosted glass cards, light tables. |
| **Item Master (Catalog)** | ✅ Done | 568 Inductive sensors live in DB across 10 series with full specs, series categorization, and pagination. |
| **Our Products Category Filter** | ✅ Done | Modal dialog covering all 17 MV GREENTECH sensor & meter product lines. |
| **Flexible CSV / Excel Import** | ✅ Done | Auto-detects delimiters (`,`, `;`, `\t`), validates headers, prevents duplicate keys. |
| **Safe Item Deletion** | ✅ Done | `DELETE /v1/items/:id` endpoint with safe relation unlinking. |
| **Safe User & Account Deletion** | ✅ Done | Reassigns linked Quotations & Leads to Admin, unlinks customers, cleanly cascades user deletion. |
| **Printer-Style Pagination** | ✅ Done | Custom Page jump (`Page [ ] of 12 [Go]`), Custom Row finder (`Find Row #: [ ]`), Solid Green buttons (`#059669`). |
| **Auto-Scroll to Column 1** | ✅ Done | Automatically scrolls to leftmost column on page transitions. |
| **Max Page Size Ceiling (500)** | ✅ Done | Updated across all 10 backend route controllers. |
| **Multi-Table Uniformity** | ✅ Done | Implemented across Leads, Customers, Quotations, Orders, Visits, Users. |
| **PDF Export Workflow** | ✅ Done | A4/A3/Letter layouts, portrait/landscape orientation with branded headers. |
| **Quotation Builder & PDF** | ✅ Done | Dynamic pricing, GST taxes, multi-currency conversion, PDF generation. |
| **Sales Order Conversion** | ✅ Done | One-click transition from Quotation to Order with status tracking. |
| **Customer Visit Logs** | ✅ Done | Date filtering, action item logging, customer association. |
| **Company Settings Sync** | ✅ Done | Director updates company address, GSTIN, CIN, bank details live across documents. |
| **Mobile PWA & App Installation** | ✅ Done | Chrome & Safari "Install App / Add to Home screen" with official MV GREENTECH logo icons. |

---

## 2. Active Roadmap & Future Milestones

### Milestone 2.0: Communication & Mobile Integrations
- [ ] **WhatsApp Business API Integration:** Direct one-click quotation sharing and dispatch alerts to customer phone numbers.
- [ ] **Email Dispatcher (SMTP/Resend):** Automated email delivery of approved PDF quotations with read tracking.
- [ ] **Android Native Field App:** Dedicated Kotlin/Flutter app connecting to the existing `/v1/*` backend API for field engineers with offline draft support.
- [ ] **Barcode & QR Code Scanner:** Mobile scanner support for scanning physical sensor boxes during warehouse dispatch.

### Milestone 2.1: Advanced Analytics & Automation
- [ ] **Forex Live Feed:** Automated synchronization with RBI / Open Exchange Rates API for daily USD/EUR conversion.
- [ ] **Inventory Stock Alerts:** Automated email notifications to Administrators when sensor stock levels drop below reorder thresholds.
