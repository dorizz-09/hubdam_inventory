# Military Barracks Management Website - Design Guidelines

## Design Approach

**System Selected:** Material Design with military-professional adaptations
**Rationale:** This management system prioritizes clear information hierarchy, data density, and administrative efficiency. Material Design provides robust patterns for forms, tables, and list views while maintaining visual clarity.

**Design Principles:**
- Authority and Trust: Clean, structured layouts that convey professionalism
- Clarity First: Information should be scannable and actionable
- Hierarchical Organization: Clear distinction between public and admin areas

## Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary: Inter 400 (body text, labels)
- Medium: Inter 500 (subheadings, card titles)
- Semibold: Inter 600 (headings, CTAs)
- Bold: Inter 700 (page titles, emphasis)

**Type Scale:**
- Page Titles: text-3xl md:text-4xl font-bold
- Section Headers: text-2xl font-semibold
- Card/Component Titles: text-lg font-medium
- Body Text: text-base
- Metadata/Labels: text-sm text-gray-600
- Helper Text: text-xs

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8
- Component padding: p-4 or p-6
- Section spacing: py-8 md:py-12
- Card gaps: gap-4 or gap-6
- Inline spacing: space-x-2 or space-x-4

**Grid Structure:**
- Container: max-w-7xl mx-auto px-4
- Barrack cards grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Detail page: Two-column layout on desktop (lg:grid-cols-3 with 2:1 ratio)

## Component Library

### Navigation
**Public Header:**
- Fixed top bar with logo/title left-aligned
- Admin login button right-aligned
- Height: h-16, shadow-sm

**Admin Header:**
- Extended navigation with tabs/links (Dashboard, Barracks, Inventory, Members)
- User indicator and logout right-aligned
- Height: h-16, shadow-md for elevation

### Barrack Cards (List View)
- Aspect ratio 16:9 image at top
- Card padding: p-6
- Content: Image → Name (text-lg font-medium) → Location (text-sm) → PIC (text-sm with icon)
- Hover: subtle shadow elevation (hover:shadow-lg transition)
- Border: border border-gray-200 rounded-lg

### Barrack Detail Page
**Layout:**
- Hero section: Full-width image (h-64 md:h-80) with overlay gradient
- Content area: Grid layout (lg:grid-cols-3 gap-8)
  - Left column (col-span-2): Inventory table + Members list
  - Right sidebar: Info card with Name, Location, PIC, Verification status

**Verification Badge:**
- Verified: Green checkmark icon + "Verified" text in rounded badge
- Not Verified: Gray shield icon + "Not Verified" with subtle styling
- Position: Prominent in info card

**Verify Information Button:**
- Full-width in sidebar (w-full)
- Primary styling with icon (shield/checkmark)
- Opens modal dialog for PIC credential entry

### Tables (Inventory & Members)
- Clean, bordered design with alternating row backgrounds
- Header: font-medium bg-gray-50
- Cell padding: px-4 py-3
- Responsive: Stack to cards on mobile

### Forms (Admin & Verification)
**Field Structure:**
- Label: text-sm font-medium mb-2
- Input: px-4 py-2 border rounded-lg, focus:ring-2
- Helper text: text-xs mt-1
- Error state: border-red-500 with error message

**Modal Dialogs:**
- Max width: max-w-md
- Padding: p-6
- Backdrop: semi-transparent overlay
- Actions: Right-aligned button group (Cancel + Submit)

### Admin Panel
**Dashboard Cards:**
- Stats overview: 4-column grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-4)
- Each card: Icon + Number + Label, p-6
- Quick actions grid below stats

**CRUD Forms:**
- Single column layout (max-w-2xl)
- Field groups with consistent spacing (space-y-4)
- Image upload with preview
- Action buttons: Right-aligned with primary + secondary pattern

### Feedback Components
**Notifications:**
- Toast style, fixed top-right
- Success: green accent with checkmark icon
- Error: red accent with alert icon
- Auto-dismiss after 4 seconds

**Loading States:**
- Skeleton loaders for card grids
- Spinner for form submissions
- Full-page loader for admin navigation

## Images

**Barrack Photos:**
- List view cards: 16:9 aspect ratio, object-cover
- Detail page hero: Full-width banner (h-64 md:h-80)
- Admin forms: Upload preview with 4:3 aspect ratio
- Placeholder: Gray background with building icon when no image

**Icons:**
- Library: Heroicons (via CDN)
- Usage: 16px for inline, 20px for buttons, 24px for headers
- Common: Shield (verification), Building (barracks), Users (members), Package (inventory)

## Accessibility & Polish

- Form inputs: Consistent height (h-10), clear focus states
- Buttons: Minimum h-10 for touch targets
- Tab navigation: Visible focus rings throughout
- ARIA labels on icon-only buttons
- Responsive breakpoints: md:768px, lg:1024px

## Page-Specific Layouts

**Public Landing/List:**
- Header with title and login
- Grid of barrack cards with search/filter bar above
- Footer with basic info

**Detail Page:**
- Hero image with barrack name overlay
- Info + content two-column split
- Verification CTA prominently placed

**Admin Dashboard:**
- Stats cards row
- Quick action buttons
- Recent activity list

**Admin Forms:**
- Centered form (max-w-2xl)
- Breadcrumb navigation
- Clear save/cancel actions