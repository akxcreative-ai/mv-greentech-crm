# Project Memory & Knowledge Base
## MV GREENTECH CRM & ERP

**Purpose:** Persistent repository of critical architectural discoveries, historical bugs and their verified resolutions, dataset specifications, and production quirks.

---

## 1. Verified Bug Fixes & Technical Decisions

### 1.1. The SearchBar 300ms Debounce Revert Loop (CRITICAL)
- **Symptom:** User clicked `Next >` to navigate from Page 1 to Page 2. The table briefly showed records 11–20, but exactly 300ms later, it automatically bounced back to Page 1.
- **Root Cause:** In `SearchBar.tsx`, the `useEffect` hook included `onSearch` in its dependency array. In parent pages (`ItemMasterPage.tsx`, `CustomersPage.tsx`, etc.), `onSearch={(val) => { setSearch(val); setPage(1); }}` was passed as an anonymous inline function. When `page` changed, the parent re-rendered, creating a new function reference for `onSearch`, which triggered `SearchBar`'s `setTimeout(..., 300)`. When the timer expired, it invoked `setPage(1)`, reverting the table.
- **Permanent Solution:**
  1. Refactored `SearchBar.tsx` to store `onSearch` in `onSearchRef` and track `lastEmittedValueRef`.
  2. The debounce effect now triggers ONLY when `internalValue !== lastEmittedValueRef.current`.
  3. Parent pages guard search updates with `if (val !== search) { setSearch(val); setPage(1); }`.

### 1.2. White-on-White Text Masking in Table Buttons
- **Symptom:** Inactive pagination number buttons appeared as empty white boxes (`[ ] [ ] [ ]`) with invisible text.
- **Root Cause:** Global CSS rule in `frontend/src/index.css` had `main button[class*="bg-emerald"] { color: #FFFFFF !important; }`. Because inactive buttons used `hover:bg-emerald-50`, the substring match `[class*="bg-emerald"]` triggered even when unhovered, forcing white text onto a white background.
- **Permanent Solution:**
  1. Updated `index.css` to use exact token matching (`class~="bg-emerald-600"`).
  2. Adopted solid green buttons with inline `#FFFFFF` styles for all pagination controls.

### 1.3. Horizontal Scroll Masking Page Changes
- **Symptom:** In tables with 14 columns, users scrolled to the rightmost columns (`Currency: USD`, `Unit: PCS`, `Status: ACTIVE`, `Lead Time: 3 days`). Because all 117 inductive sensors share identical values in these rightmost columns, clicking `Next` appeared to do nothing because the scroll position remained on the right.
- **Permanent Solution:** Implemented `tableContainerRef.current.scrollTo({ left: 0, behavior: 'smooth' })` inside `handlePageChange` so navigation instantly snaps back to reveal the new `S.no` and `Product code`.

### 1.4. Safe Deletion Decoupling for Obsolete Items
- **Symptom:** Attempting to delete an item previously quoted in an inquiry caused foreign key violation errors.
- **Permanent Solution:** Backend route `DELETE /v1/items/:id` in `backend/src/routes/item.routes.ts` safely unlinks references in `QuotationItem` and `OrderItem` before deleting the item record.

### 1.5. User Deletion Foreign Key & False "User not found" Resolution
- **Symptom:** Deleting employee accounts (e.g., Arjun Kumar) from the `/users` table failed with an alert saying "User not found".
- **Root Cause:**
  1. The user had linked records in the `Quotation` table (`userId`), `Notification` table, and `Lead` table (`createdById`).
  2. In `backend/src/routes/user.routes.ts`, the deletion transaction did not reassign quotations or delete notifications, causing PostgreSQL to throw a foreign key constraint violation.
  3. The catch block swallowed the database error and fell back to `userStore.delete()`, which returned false for database-backed users and falsely returned `404 User not found`.
- **Permanent Solution:**
  1. Updated `DELETE /v1/users/:id` to find an administrator (`req.user.id` or system administrator) and automatically reassign non-nullable references (`Quotation.userId`, `Lead.createdById`) to the admin.
  2. Cascade-deletes all associated notifications, visits, follow-ups, targets, assignments, activities, and nullifies lead/customer owner fields.
  3. Returns clear 500 error messages if a DB error occurs rather than masquerading as a 404 "User not found".

### 1.6. Mobile Chrome PWA & Web App Install Icon
- **Requirement:** When users click "Add to Home screen" or "Install App" in Google Chrome on mobile devices, the official MV GREENTECH logo must appear as the home screen application icon.
- **Implementation:**
  1. Processed and cropped official MV GREENTECH logo to high-resolution square assets: `pwa-192x192.png`, `pwa-512x512.png`, `pwa-maskable-192x192.png`, `pwa-maskable-512x512.png`, `apple-touch-icon.png`, `favicon-32x32.png`, `favicon-16x16.png`, and `logo.png`.
  2. Added Web App Manifest `manifest.json` configured with `display: "standalone"`, `theme_color: "#059669"`, and proper maskable icon safe margins.
  3. Registered lightweight Service Worker `sw.js` in `main.tsx` to satisfy Google Chrome's PWA installability requirements.
  4. Updated `Sidebar.tsx` and `LoginPage.tsx` to display the official MV GREENTECH logo.

### 1.7. Real-Time Dynamic Login Timestamp Updates Across Sessions
- **Symptom / Request:** User wanted the "LAST LOGIN" timestamp to update every single time any employee logs in or opens the CRM, without freezing on the first login date.
- **Root Cause:**
  1. In `auth.routes.ts`, `POST /login` updated `lastLogin` only on initial password login, but subsequent visits with stored JWT tokens called `/v1/auth/me` which never updated `lastLogin`.
  2. `POST /verify-otp-login` was missing `lastLogin` update completely.
  3. `UserManagementPage.tsx` cached users query for 60s and lacked polling, requiring manual refresh.
- **Permanent Solution:**
  1. Updated `auth.routes.ts` in `POST /login`, `POST /verify-otp-login`, and `GET /me` (throttled by 1 min to prevent DB spam) to update `lastLogin: new Date()` in both Neon PostgreSQL and `userStore`.
  2. Updated `UserManagementPage.tsx` with a 5-second polling interval (`refetchInterval: 5000`) and added a live pulsing emerald dot (`●`) for users active within the last 5 minutes.
  3. Cleaned `Never` badge contrast for employees who haven't logged in yet.




---

## 2. Live Production Data Context

- **117 Inductive Sensor Items Live:** The primary catalog was seeded directly into the Neon PostgreSQL production database using `backend/scripts/import-user-csv.ts`.
- **Expanded 568 Sensor Catalog Live:** Official full catalog of 568 inductive sensors (`SR-IN-00001` through `SR-IN-00568`) imported across 10 series (Conventional, Extra Distance, Analog, Full Inox, High Temp, Low Form, Weld-Immune, Rectangular Housing, Annular, Eddy Current).
- **CSV Template Storage:** The source data is archived in `frontend/public/inductive-sensors.csv` for backup and client download.
- **Table Headings Aligned:** Item Master table updated to include `Category / Series`, `S.no`, `Product code`, `Product Description`, `Supplier`, `Unit`, etc. Matching flexible CSV import.
- **Default Currency:** Domestic items use `INR (₹)`, international catalog sensors use `USD ($)`.
