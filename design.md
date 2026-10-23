# UI/UX Design System & Style Guide
## MV GREENTECH CRM & ERP

**Design Theme:** Clean Enterprise Green & White  
**Target Aesthetic:** Professional Industrial ERP / Modern Glassmorphism  
**Key Principle:** Ultra-high contrast, reliable typography, non-collapsible interactive controls.

---

## 1. Brand Color Palette

| Token Name | Hex Code | Purpose |
|---|---|---|
| **Brand Primary (Emerald 600)** | `#059669` | Primary action buttons, active navigation states, brand accents, table headers. |
| **Brand Dark (Emerald 700)** | `#047857` | Button hover states, prominent totals, high-priority status badges. |
| **Brand Light (Emerald 50)** | `#ECFDF5` | Selected row highlights, filter badge backgrounds, table subtle tints. |
| **Clean White** | `#FFFFFF` | Table cards, modal panels, input backgrounds, active text on green. |
| **Background Neutral (Slate 50)** | `#F8FAFC` | Page body background, alternating table row shading. |
| **Border Neutral (Slate 200/300)** | `#E2E8F0` / `#CBD5E1` | Card dividers, input outlines, table cell grids. |
| **Primary Text (Slate 900)** | `#0F172A` | Core headings, SKU codes, numbers, table row text. |
| **Secondary Text (Slate 600)** | `#475569` | Meta descriptions, subheadings, column headers, helper labels. |

---

## 2. Mandatory Button Styling Rules

> [!IMPORTANT]
> **The Golden Button Rule:** Every primary action button, navigation control, and modal trigger MUST have:
> - Solid Green Background: `backgroundColor: '#059669'`
> - Bold White Text: `color: '#FFFFFF' !important`
> - Crisp Hover State: `hover:backgroundColor: '#047857'`

### Why this rule exists:
In dark/light mixed CSS engines, white buttons with light text can inadvertently cause white-on-white text masking. By enforcing solid `#059669` backgrounds with `#FFFFFF` text on all pagination and action buttons, text remains 100% visible across every operating system, display contrast mode, and browser zoom level.

---

## 3. Printer-Style Table Pagination System

All tables in the CRM (`DataTable.tsx`) implement the **Printer-Style Navigation Bar**:

```
[ Showing 1 to 10 of 117 entries ]   [ Rows: 10 per page ▾ ]   [ Find Row #: [   ] (Find) ]
──────────────────────────────────────────────────────────────────────────────────────────
[ ≪ First ]   [ ◀ Prev ]   Page [  1  ] of 12 [ Go ]   [ Next ▶ ]   [ Last ≫ ]   [ 🖶 PDF ]
```

### Components of the Footer:
1. **Entry Summary Counter:** Clear statement of current record slice: `Showing 1 to 10 of 117 entries`.
2. **Rows Per Page Dropdown:** `[ 10, 20, 25, 50, 100, 200, 500 ]` options with bold emerald borders.
3. **Custom Row Finder:** Input box allowing direct lookup by record index (e.g., Row 45 navigates to Page 5).
4. **Custom Page Finder:** Clean input `Page [ 1 ] of 12 [ Go ]` allowing direct page jumping via keyboard Enter or Go click.
5. **Solid Green Navigation Buttons:** `First`, `Prev`, `Next`, `Last` buttons with white icons and labels.
6. **Auto-Scroll Behavior:** Any page change or row jump automatically executes smooth horizontal scrolling back to column 1 (`S.no`, `Product code`).

---

## 4. Typography & Layout Specifications

- **Font Family:** `Inter`, system `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`.
- **SKU & Product Codes:** Font Mono (`font-mono text-xs font-semibold text-emerald-700`).
- **Cards & Surfaces:** Rounded corners (`rounded-xl` / `rounded-2xl`), subtle drop shadow (`shadow-xs` / `shadow-sm`), and frosted glass borders.
- **Modals:** Centered overlay dialog with backdrop blur (`backdrop-blur-sm bg-black/40`), clear close buttons (`X`), and separated header/body/footer partitions.
