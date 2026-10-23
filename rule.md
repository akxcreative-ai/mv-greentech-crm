# Strict Engineering Rules & Constraints
## MV GREENTECH CRM & ERP

**Audience:** All engineers, AI coding agents, and contributors modifying this codebase.  
**Enforcement:** Mandatory. Any pull request or commit violating these rules must be rejected.

---

## 1. Table & Master Catalog Rules

1. **Never Alter the 14 User-Specified Item Master Columns:**
   The Item Master table must strictly maintain the designated column headers:
   1. `S.no`
   2. `Product code`
   3. `Product Description`
   4. `Picture`
   5. `Category`
   6. `Supplier`
   7. `Standard Cost`
   8. `Currency`
   9. `Unit`
   10. `Landed Cost`
   11. `Standard Price`
   12. `Lead Time`
   13. `Status`
   14. `Actions`

2. **Always Auto-Scroll to Left on Page Navigation:**
   Any pagination handler in `DataTable.tsx` or table wrapper MUST execute `tableContainerRef.current?.scrollTo({ left: 0, behavior: 'smooth' })` to prevent horizontal scroll disorientation.

---

## 2. Component & Event Handler Rules

1. **Button Form Safety:**
   Every button outside or inside a form MUST have an explicit `type="button"` unless it is the intentional form submit trigger (`type="submit"`).
2. **Event Propagation:**
   Table row action buttons (Edit, Delete, Zoom) MUST include `e.stopPropagation()` to prevent unwanted row-click triggers.
3. **Button Contrast Standard:**
   All navigation buttons in `DataTable.tsx` must maintain solid green backgrounds (`#059669`) and pure white text (`#FFFFFF`) with inline style fallbacks to protect against global CSS overrides.

---

## 3. State Management & Query Rules

1. **TanStack Query Caching:**
   Whenever implementing paginated table views with `useQuery`, ALWAYS include:
   ```typescript
   placeholderData: (previousData) => previousData,
   ```
   This prevents table flickering, skeleton flashing, and unwanted unmounting of pagination controls while fetching subsequent pages.
2. **SearchBar Guarding:**
   Search input handlers must NEVER call `setPage(1)` unless the search query has genuinely changed (`if (val !== currentSearch) { setSearch(val); setPage(1); }`).

---

## 4. Backend Route & Database Rules

1. **Pagination Limit Bounds:**
   All list routes MUST enforce:
   ```typescript
   const limit = Math.max(1, Math.min(500, parseInt(req.query.limit as string, 10) || 20));
   ```
2. **Safe Deletions:**
   Never perform raw cascade deletes on catalog entities. Decouple or nullify relational line-item pointers before deleting rows.
3. **Environment Isolation:**
   Never commit hardcoded database credentials, JWT secrets, or production API tokens into version control.

---

## 5. Deployment & Release Discipline

1. **TypeScript Verification Before Commit:**
   Always run `npm run build` in both `frontend/` and `backend/` to confirm zero compilation errors before pushing to `origin main`.
2. **Clean Git Commits:**
   Use conventional commits (`feat(...)`, `fix(...)`, `docs(...)`) with clear descriptions of the problems solved.
