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

---

## 2. Live Production Data Context

- **117 Inductive Sensor Items Live:** The primary catalog was seeded directly into the Neon PostgreSQL production database using `backend/scripts/import-user-csv.ts`.
- **CSV Template Storage:** The source data is archived in `frontend/public/inductive-sensors.csv` for backup and client download.
- **Default Currency:** Domestic items use `INR (₹)`, international catalog sensors use `USD ($)`.
