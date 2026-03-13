# Meridian - AI-Powered Meeting Intelligence Platform

A sophisticated, real-time meeting management and organizational intelligence system built with Next.js 16, React 19, and modern web technologies. Meridian captures, organizes, and visualizes meeting insights across multiple hierarchical levels.

## Features

### Core Intelligence
- **Decision Tracking**: Automatically captures and categorizes strategic decisions from meetings
- **Action Item Management**: Smart extraction and tracking of action items with owners, priorities, and due dates
- **Risk Identification**: Automatic detection of risks and potential blockers
- **Conflict Detection**: Identifies contradictions and inconsistencies across decisions
- **Knowledge Graph**: Interactive visualization of decision relationships and dependencies

### Navigation Hierarchy
1. **Company Dashboard** - Overview of all departments with live metrics
2. **Department View** - Meeting list + Kanban board of action items per department
3. **Meeting Detail** - Deep dive with 4 comprehensive tabs:
   - **Overview**: 3-column layout (Decisions | Actions | Risks)
   - **Transcript**: Full meeting transcript with synchronized highlights
   - **Knowledge Graph**: Interactive graph showing decision/action/risk relationships
   - **Outputs**: Real-time sync status with Jira, Gmail, Slack, Calendar

### User Experience
- **Smooth Animations**: Framer Motion-powered transitions between views
- **Real-time Recording**: Live meeting capture with timer indicator
- **Inline Editing**: Edit action item fields directly from slide-over panel
- **Global Search**: Search across meetings, departments, actions, and decisions
- **Notifications**: Smart alerts for contradictions, due dates, and pre-meeting briefings
- **Dark Theme**: Enterprise-grade dark UI with cyan accents and status colors

## Technical Stack

- **Frontend**: Next.js 16 (App Router), React 19.2.4
- **Styling**: Tailwind CSS 4 with custom design tokens
- **Animations**: Framer Motion 11.3
- **Components**: Shadcn/ui components + Radix UI primitives
- **Forms**: React Hook Form 7.54 with Zod validation
- **Visualization**: SVG-based knowledge graph with interactive nodes
- **Data**: Mock data system with TypeScript types
- **Fonts**: Geist (sans) and Geist Mono (code)

## Project Structure

```
/app
  /layout.tsx              # Root layout with theme
  /page.tsx               # Company dashboard
  /department/[id]/page.tsx # Department view
  /meeting/[id]/page.tsx   # Meeting detail view
  /globals.css            # Theme tokens and styles

/components
  /dashboard/
    - CompanyDashboard.tsx
    - DepartmentCard.tsx
  /department/
    - DepartmentView.tsx
    - MeetingList.tsx
    - ActionItemBoard.tsx (Kanban)
    - DepartmentIntelligence.tsx (Stats)
  /meeting/
    - MeetingDetailView.tsx
    - OverviewTab.tsx
    - TranscriptTab.tsx
    - KnowledgeGraphTab.tsx
    - OutputsTab.tsx
  /ticket/
    - TicketSlideOver.tsx
  /shared/
    - TopNavBar.tsx
    - RecordingBar.tsx
    - StartMeetingModal.tsx
    - NotificationCenter.tsx
    - GlobalSearch.tsx

/lib
  /types.ts              # TypeScript interfaces
  /animations.ts         # Framer Motion presets
  /data/
    - mockData.ts        # Mock departments, meetings, items

/public
  # Static assets
```

## Getting Started

### Installation

```bash
# Using the shadcn CLI (recommended)
npx shadcn-cli@latest init

# Or clone and install
git clone <repo>
cd meridian
pnpm install
```

### Development

```bash
# Start dev server with HMR
pnpm dev

# Open http://localhost:3000
```

### Build & Deploy

```bash
# Build for production
pnpm build

# Start production server
pnpm start

# Deploy to Vercel
vercel deploy
```

## Color System

**Dark Theme Palette:**
- Background: `#0a0a0a`
- Secondary: `#1a1a1a`, `#2d2d2d`
- Text: `#ffffff` (primary), `#a0a0a0` (secondary)
- Accent (Primary): `#0ea5e9` (cyan)
- Status Green: `#10b981`
- Status Amber: `#f59e0b`
- Status Red: `#ef4444`

All colors are CSS custom properties in `/app/globals.css` for easy theming.

## Key Components

### TopNavBar
- Persistent navigation with search, notifications, start meeting button
- Uses NotificationCenter and GlobalSearch components

### DepartmentCard
- Displays department metrics with pulse animations
- Shows live recording indicator
- Links to department view with smooth transitions

### ActionItemBoard
- Kanban board with 4 columns: Backlog, In Progress, In Review, Done
- Drag-enabled (visual system in place for future backend sync)
- Color-coded priorities and status badges

### MeetingDetailView
- Tab-based interface with smooth transitions
- Quick stats header showing counts
- Responsive grid for desktop, stack for mobile

### TicketSlideOver
- Right-side overlay panel for action item details
- Inline title editing
- Status/Priority dropdowns
- Owner avatars with contact info
- Jira integration indicator
- Comments section with activity log

### KnowledgeGraphTab
- SVG-based interactive visualization
- Nodes for Decisions (cyan), Actions (amber), Risks (red)
- Edges show relationships and create dependencies
- Click nodes to highlight related items
- Shows conflict detection banner

### TranscriptTab
- Full meeting transcript with speaker names
- Highlighted sections linked to decisions/actions/risks
- Right panel shows all highlights with jump-to functionality
- Synchronized scrolling

## Usage Examples

### Navigate Through Hierarchy

1. **Dashboard** → Click a department card
2. **Department** → Click a meeting in the list
3. **Meeting** → Switch between tabs for insights
4. **Action Item** → Click any action to open slide-over

### Record a Meeting

1. Click "Start Meeting" in top navbar
2. Select department and enter title
3. Recording bar appears at bottom with timer
4. Click "Stop" when done
5. Meridian processes and captures intelligence

### Search & Find

1. Use top navbar search to find meetings, departments, or items
2. Results show type, title, and context
3. Click result to navigate directly

### Edit Action Items

1. Click any action item card to open slide-over
2. Click title to inline edit
3. Change status via dropdown
4. Update priority with chip buttons
5. Changes persist in mock data

## Data Structure

### Meeting
- Decisions: Strategic choices made
- Action Items: Tasks with owner, status, priority
- Risks: Potential blockers with severity
- Transcript: Full meeting text with timestamps
- Outputs: Sync status (Jira, Gmail, Slack, Calendar)

### Action Item
- Status: Backlog | In Progress | In Review | Done
- Priority: P1 (high) | P2 (medium) | P3 (low)
- Owner: Assigned participant
- Due Date: Target completion
- Jira Link: External issue tracker reference
- Comments: Activity log and discussion

### Department
- Open Action Items: Count of unresolved items
- Meeting Count: Total meetings in this group
- Is Recording: Live indicator
- Participants: Team members
- Last Meeting Date: Timestamp

## Animations

- **Entrance**: Fade-in with stagger for lists
- **Hover**: Scale and color transitions
- **Navigation**: Zoom-in for dashboard → department, slide-out for ticket panel
- **Recording**: Pulse animation on red dot, timer updates
- **Notifications**: Slide-in from top with scale

All animations use Framer Motion spring config for natural feel.

## Browser Support

- Chrome/Edge 120+
- Firefox 121+
- Safari 17+
- Mobile browsers (iOS Safari 17+, Chrome Mobile)

## Performance Optimizations

- Next.js 16 automatic code splitting
- Dynamic imports for heavy components
- SVG knowledge graph (lightweight, scalable)
- Debounced search and notifications
- Optimized re-renders with React 19 compiler prep

## Future Enhancements

- Backend integration with real database (Supabase, Neon)
- WebSocket support for real-time collaboration
- Audio/video recording with transcription API
- ML-powered decision/action extraction
- Calendar integration for meeting scheduling
- Slack bot for notifications
- Export to PDF/email
- Dark/light theme toggle
- Multi-language support
- Advanced filtering and analytics

## Dependencies

### Core
- `next`: 16.1.6 - React framework
- `react`: 19.2.4 - UI library
- `react-dom`: 19.2.4 - DOM rendering

### Styling & UI
- `tailwindcss`: 4.2.0 - Utility-first CSS
- `shadcn/ui`: Latest - Component library
- `@radix-ui/*`: Accessibility primitives
- `lucide-react`: 0.564.0 - Icons

### Animations
- `framer-motion`: 11.3.28 - Animation library

### Forms & Data
- `react-hook-form`: 7.54.1 - Form state
- `zod`: 3.24.1 - Schema validation
- `date-fns`: 4.1.0 - Date utilities

### Utilities
- `clsx`: 2.1.1 - Conditional classes
- `tailwind-merge`: 3.3.1 - Merge Tailwind classes

## License

MIT

## Support

For issues or questions, open a GitHub issue or contact the team at support@meridian.dev

---

**Built with ❤️ using v0**
