# Design System Creation Guide for B-MAD UX Agent

**Purpose:** Guide B-MAD UX agent to create design system using pre-built component libraries
**When to use:** Before generating UX designs or wireframes
**Output:** Complete design system specification in `docs/design-system/design-system.md`

---

## 🎯 Quick Start: Recommended Component Stack

Based on comprehensive research (see component-library-research artifact), this is the optimal free stack:

| Layer | Library | Cost | Installation |
|-------|---------|------|--------------|
| **Foundation** | shadcn/ui | Free (MIT) | `npx shadcn-ui@latest init` |
| **Landing Page Animations** | Aceternity UI | Free tier | `npx aceternity-ui@latest add [component]` |
| **Dashboard/Analytics** | Tremor | Free (Apache 2.0) | `npm install @tremor/react` |

**Total Cost:** $0

---

## 📦 Component Library: What's Available

### shadcn/ui (Foundation - 59+ Components)

**Use for:** All core UI elements (buttons, forms, dialogs, tables, badges)

**Available Components by Category:**

#### Forms & Inputs
- ✅ **Button** - 8 variants (default, destructive, outline, secondary, ghost, link, loading state)
- ✅ **Input** - Text input with validation, error states
- ✅ **Textarea** - Multi-line text input
- ✅ **Select** - Dropdown select with search
- ✅ **Checkbox** - Boolean input
- ✅ **Radio Group** - Single selection from options
- ✅ **Form** - Form wrapper with validation (uses React Hook Form + Zod)

#### Layout & Structure
- ✅ **Card** - Content container with header/footer
- ✅ **Separator** - Horizontal/vertical divider
- ✅ **Tabs** - Tabbed navigation
- ✅ **Accordion** - Collapsible content sections
- ✅ **Collapsible** - Show/hide content toggle

#### Overlays & Modals
- ✅ **Dialog** - Modal dialog overlay
- ✅ **Sheet** - Slide-out panel (for mobile menus)
- ✅ **Popover** - Floating content container
- ✅ **Dropdown Menu** - Context menu

#### Data Display
- ✅ **Table** - Standard data table
- ✅ **Data Table** - Sortable, filterable table with pagination
- ✅ **Badge** - Status labels, tags
- ✅ **Avatar** - User profile images
- ✅ **Progress** - Linear progress indicator
- ✅ **Skeleton** - Loading placeholder

#### Feedback
- ✅ **Toast** - Non-blocking notifications
- ✅ **Alert** - Inline alert messages (success, warning, error)
- ✅ **Alert Dialog** - Confirmation dialogs

**Installation:**
```bash
# Initialize in your Next.js project
npx shadcn-ui@latest init

# Add specific components
npx shadcn add button input form dialog tabs table badge avatar progress skeleton toast alert
```

**Documentation:** https://ui.shadcn.com/docs/components

---

### Aceternity UI (Landing Page Animations - 53+ Components)

**Use for:** Landing page only (animated heroes, feature sections, testimonials)

**Available Components for Our Screens:**

#### Hero Sections (Landing Page)
- ✅ **Hero Highlight** - Animated hero with gradient background + spotlight effect
- ✅ **Hero Parallax** - 3D parallax scrolling hero
- ✅ **Aurora Background** - Animated gradient background
- ✅ **Spotlight** - Spotlight effect following cursor

#### Feature Sections (Landing Page)
- ✅ **Bento Grid** - Masonry-style feature grid (perfect for 3-column features)
- ✅ **3D Card Effect** - Cards with 3D tilt on hover
- ✅ **Wobble Card** - Cards with wobble animation
- ✅ **Card Stack** - Stacked cards with hover effect

#### Testimonials (Landing Page)
- ✅ **Animated Testimonials** - Auto-rotating testimonials with fade effect
- ✅ **Infinite Moving Cards** - Infinite scroll carousel

#### Buttons & CTAs (Landing Page)
- ✅ **Shimmer Button** - Button with shimmer effect (perfect for primary CTA)
- ✅ **Moving Border** - Button with animated border
- ✅ **Stateful Button** - Button with loading/success states

#### Text Effects (Optional Polish)
- ✅ **Text Generate Effect** - Typewriter effect
- ✅ **Wavy Background** - Animated wave background

**Installation:**
```bash
# Install Aceternity UI components (as needed)
npx aceternity-ui@latest add hero-highlight
npx aceternity-ui@latest add bento-grid
npx aceternity-ui@latest add animated-testimonials
npx aceternity-ui@latest add shimmer-button
```

**Documentation:** https://ui.aceternity.com/components

**Note:** Only use Aceternity for landing page. Don't use for dashboard/app screens (overkill animations).

---

### Tremor (Dashboard & Analytics - Built for Data)

**Use for:** Dashboard/tracking page only (tables, charts, metrics)

**Available Components for Our Screens:**

#### Data Visualization (Dashboard)
- ✅ **AreaChart** - Area chart with multiple series
- ✅ **BarChart** - Vertical/horizontal bar chart
- ✅ **LineChart** - Line chart with multiple series
- ✅ **DonutChart** - Donut/pie chart for proportions

#### Data Display (Dashboard)
- ✅ **Table** - Sortable, filterable table with built-in pagination
- ✅ **Metric** - Large number display with trend indicator (e.g., "24 messages sent, +8 this week")
- ✅ **Card** - Content container (similar to shadcn but with Tremor styling)
- ✅ **Badge** - Status labels (Pending, Responded, Declined)

#### Progress Indicators (Connections List)
- ✅ **Progress Circle** - Circular progress (perfect for confidence score 0-100%)
- ✅ **Progress Bar** - Linear progress indicator

#### Inputs (Dashboard Filters)
- ✅ **Select** - Dropdown select
- ✅ **Tabs** - Tab navigation (for filtering by status)

**Installation:**
```bash
npm install @tremor/react
```

**Documentation:** https://tremor.so/docs/getting-started/installation

**Note:** Tremor is specifically designed for dashboards. Use it ONLY for the tracking/dashboard page.

---

## 🎨 Design System Creation Process

### Step 1: Initialize Component Libraries

**Prompt for B-MAD UX Agent:**

```
Before creating the design system, initialize the component libraries in the project:

1. shadcn/ui (foundation):
   ```bash
   npx shadcn-ui@latest init
   npx shadcn add button input form dialog tabs table badge avatar progress skeleton toast alert
   ```

2. Tremor (dashboard):
   ```bash
   npm install @tremor/react
   ```

3. Aceternity UI (landing page - optional for MVP):
   ```bash
   npx aceternity-ui@latest add hero-highlight bento-grid shimmer-button
   ```

Document which libraries are installed and their purpose.
```

---

### Step 2: Define Color Palette

**Prompt for B-MAD UX Agent:**

```
Create a color palette for LinkedIn Referral Finder that:

1. Uses LinkedIn blue (#0A66C2) as primary color but makes it our own
2. Defines success/warning/destructive colors for status indicators
3. Includes neutral colors for backgrounds and text
4. Works with both light mode (MVP) and dark mode (future)

Output as Tailwind CSS config extensions.

Reference:
- shadcn/ui uses CSS variables for theming: https://ui.shadcn.com/docs/theming
- Tremor uses Tailwind colors: https://tremor.so/docs/getting-started/theming
```

**Expected Output:**

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0A66C2',
          50: '#E7F3FF',
          100: '#CFE7FF',
          // ... more shades
        },
        success: {
          DEFAULT: '#057642',
          // ... shades
        },
        // ... other colors
      },
    },
  },
};
```

---

### Step 3: Map Components to Screens

**Prompt for B-MAD UX Agent:**

```
For each of the 5 screens in LinkedIn Referral Finder MVP, specify which components to use:

Screen 1: Landing Page
- Hero: Aceternity Hero Highlight OR shadcn Card (if no Aceternity)
- Features: Aceternity Bento Grid OR shadcn Card grid
- CTA: Aceternity Shimmer Button OR shadcn Button
- Testimonials: Aceternity Animated Testimonials OR shadcn Card carousel

Screen 2: Job URL Input
- Input: shadcn Input + Form (with Zod validation)
- Button: shadcn Button (with loading state)
- Loading: shadcn Skeleton

Screen 3: Connections List
- Cards: shadcn Card (for connection cards)
- Avatar: shadcn Avatar
- Badges: shadcn Badge (for 2nd/3rd degree)
- Confidence score: Tremor Progress Circle (0-100%)
- Filters: shadcn Select + Dropdown Menu

Screen 4: Message Generation Modal
- Modal: shadcn Dialog
- Tabs: shadcn Tabs (Casual, Professional, Direct)
- Textarea: shadcn Textarea (read-only)
- Buttons: shadcn Button Group (Regenerate, Edit, Copy)
- Toast: shadcn Toast (after copy)

Screen 5: Dashboard (Tracking)
- Metrics: Tremor Metric cards (messages sent, response rate)
- Table: Tremor Table (sortable, with pagination)
- Badges: shadcn Badge (status: Pending, Responded)
- Charts: Tremor AreaChart (response rate over time)
- Filters: shadcn Tabs

Output as a component mapping table.
```

**Expected Output:**

```markdown
## Component Mapping

| Screen | Element | Component | Library |
|--------|---------|-----------|---------|
| Landing | Hero | Hero Highlight | Aceternity |
| Landing | Features | Bento Grid | Aceternity |
| Job Input | Text input | Input + Form | shadcn/ui |
| Connections | Card | Card | shadcn/ui |
| Connections | Confidence | Progress Circle | Tremor |
| Modal | Dialog | Dialog | shadcn/ui |
| Dashboard | Table | Table | Tremor |
| Dashboard | Metrics | Metric | Tremor |
```

---

### Step 4: Create Wireframes with Components

**Prompt for B-MAD UX Agent:**

```
For EACH of the 5 screens, create detailed wireframes in Notion-flavored Markdown.

For each wireframe:
1. Specify the EXACT component to use (e.g., "shadcn/ui Dialog", not just "modal")
2. Include component props (variant, size, etc.)
3. Specify states: loading, error, empty, success
4. Include responsive behavior (desktop vs mobile)

Example structure:
```markdown
## Screen: Connections List

### Header
**Component:** Custom div
**Text (Tailwind class: text-2xl font-semibold):** "We found 8 connections at Acme Corp"

### Filter Row
**Component:** shadcn/ui Select
**Props:** { variant: "outline", placeholder: "All Roles" }
**Options:** ["All Roles", "Hiring Manager", "Recruiter", "Engineer"]

### Connections Grid
**Component:** Custom grid (Tailwind: grid grid-cols-1 md:grid-cols-2 gap-4)

#### Connection Card
**Component:** shadcn/ui Card
**Props:** { className: "p-4 hover:shadow-lg transition" }
**Contents:**
- Avatar (shadcn/ui Avatar, size: 48px)
- Name (text-lg font-semibold)
- Badge (shadcn/ui Badge, variant: "secondary", text: "2nd • via Sarah")
- Confidence (Tremor Progress Circle, value: 85, label: "Likely to help")
- Button (shadcn/ui Button, variant: "default", text: "Generate Message")
```
```

Output complete wireframes for all 5 screens.
```

---

### Step 5: Define Interaction Patterns

**Prompt for B-MAD UX Agent:**

```
Define consistent interaction patterns across the app:

1. **Primary Actions** (e.g., "Find Connections", "Copy Message")
   - Component: shadcn/ui Button
   - Variant: default
   - Size: lg on desktop, full width on mobile
   - Hover: Slight elevation + darker shade
   - Loading state: Spinner icon + disabled

2. **Secondary Actions** (e.g., "Regenerate", "Edit")
   - Component: shadcn/ui Button
   - Variant: outline
   - Size: md
   - Hover: Background color change

3. **Form Validation**
   - Component: shadcn/ui Form (with Zod)
   - Error display: Inline below field (red text)
   - Success display: Green check icon

4. **Loading States**
   - Component: shadcn/ui Skeleton
   - Pattern: Match content shape (card skeleton for cards, table skeleton for tables)
   - Duration indicator: Show "~10 sec" if >5 seconds

5. **Error States**
   - Component: shadcn/ui Alert (variant: destructive)
   - Pattern: User-friendly message + retry button
   - Never show: Raw error messages

6. **Empty States**
   - Pattern: Icon + heading + description + CTA
   - Example: "No jobs yet. Add your first job to get started."

7. **Success Feedback**
   - Component: shadcn/ui Toast
   - Duration: 3 seconds
   - Auto-dismiss: Yes
   - Example: "Message copied ✓"

Output as a specification document.
```

---

### Step 6: Responsive Breakpoints

**Prompt for B-MAD UX Agent:**

```
Define responsive behavior for all screens using Tailwind breakpoints:

**Breakpoints:**
- Mobile: < 768px (default)
- Tablet: 768px - 1023px (md:)
- Desktop: 1024px+ (lg:)

**Layout Rules:**
1. **Sidebar:**
   - Mobile: Hidden, hamburger menu
   - Tablet: Collapsible, 240px when expanded
   - Desktop: Always visible, 240px

2. **Main Content:**
   - Mobile: Full width, 16px padding
   - Tablet: Full width, 24px padding
   - Desktop: Max 1200px, centered, 32px padding

3. **Grids (Connections List, Features):**
   - Mobile: 1 column (grid-cols-1)
   - Tablet: 2 columns (md:grid-cols-2)
   - Desktop: 2-3 columns (lg:grid-cols-2, lg:grid-cols-3 for features)

4. **Buttons:**
   - Mobile: Full width (w-full)
   - Tablet/Desktop: Auto width (w-auto)

5. **Typography:**
   - Mobile: Base sizes (text-base = 16px)
   - Desktop: Slightly larger (text-lg for body)

Output as Tailwind class examples for each breakpoint.
```

---

## ✅ Verification Checklist

After design system is created, verify:

- [ ] Component libraries installed (shadcn, Tremor, Aceternity if used)
- [ ] Color palette defined in Tailwind config
- [ ] Typography scale defined (display, heading, body, caption)
- [ ] All 5 screens have component specifications
- [ ] All screens have wireframes in Notion-flavored Markdown
- [ ] Interaction patterns documented (buttons, forms, loading, errors)
- [ ] Responsive behavior defined (mobile, tablet, desktop)
- [ ] States documented (loading, error, empty, success) for each screen

---

## 🚀 Final Output Structure

The B-MAD UX agent should output to: `docs/design-system/design-system.md`

**File Structure:**

```markdown
# Design System - LinkedIn Referral Finder MVP

## 1. Component Library Stack
- Foundation: shadcn/ui (59+ components)
- Animations: Aceternity UI (landing page only)
- Analytics: Tremor (dashboard only)

## 2. Installation
[Commands to install each library]

## 3. Color Palette
[Tailwind config with all color definitions]

## 4. Typography
[Font families, sizes, weights]

## 5. Spacing & Layout
[Max widths, sidebar width, padding/margin scale]

## 6. Component Mapping
[Table showing which component for which screen element]

## 7. Screen Wireframes
### Screen 1: Landing Page
[Detailed wireframe with component specs]

### Screen 2: Job URL Input
[Detailed wireframe with component specs]

[... all 5 screens]

## 8. Interaction Patterns
[Button styles, form validation, loading states, etc.]

## 9. Responsive Behavior
[Breakpoint definitions, layout rules]

## 10. Accessibility
[ARIA labels, keyboard navigation, color contrast]
```

---

## 💡 Tips for B-MAD UX Agent

1. **Start with shadcn/ui as the foundation** - It's the most versatile and production-ready
2. **Only add Aceternity for landing page** - Don't over-animate the app screens
3. **Use Tremor for dashboard only** - It's optimized for data visualization
4. **Don't mix overlapping components** - e.g., don't use both shadcn Dialog and Tremor Dialog
5. **Reference official docs** - Include links to component documentation
6. **Think mobile-first** - Design for 375px width, then enhance for desktop
7. **Document states** - Every component needs loading, error, empty, success states

---

## 📚 Component Library Documentation Links

- **shadcn/ui:** https://ui.shadcn.com/docs/components
- **Aceternity UI:** https://ui.aceternity.com/components
- **Tremor:** https://tremor.so/docs/getting-started/installation
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Radix UI** (shadcn is built on this): https://www.radix-ui.com/

---

**Ready to create your design system with B-MAD UX agent!** Load this guide and follow the step-by-step prompts.