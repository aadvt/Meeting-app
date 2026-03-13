# Meridian Glassmorphism Redesign

## Overview

This document describes the complete redesign of the Meridian meeting intelligence platform with a focus on **Apple-inspired glassmorphism**, elegant typography, and interactive knowledge graphs.

## Key Changes

### 1. Design System - Glassmorphism

#### Glass Components
- **`.glass`** - Base frosted glass with backdrop blur (xl), white/8 background, white/10 border
- **`.glass-sm`** - Smaller variant with less blur, suitable for compact elements
- **`.glass-lg`** - Larger variant with more prominent blur, used for major content areas
- **`.glass-glow`** - Glass with subtle cyan glow shadow for emphasis
- **`.glass-interactive`** - Interactive glass that responds to hover with brightened background

#### CSS Properties
```css
backdrop-blur-xl
bg-white/8
border border-white/10
rounded-2xl
```

#### Visual Effects
- **Shimmer Animation** - Subtle light reflection across elements
- **Gradient Text** - Cyan to purple gradient for headings
- **Blur Backdrop** - Semi-transparent overlay for modals

### 2. Authentication Flow

#### Landing Page (`/`)
- Hero section with gradient text
- Feature cards with glassmorphic design
- Call-to-action button leading to login

#### Login Page (`/login`)
- Mock credentials (no actual password required)
- Glassmorphic card with input fields
- Single-click authentication to dashboard

#### Session Management
- Uses `localStorage` to persist auth state
- Auth token stored as `meridian_auth`
- Protected routes redirect to login if not authenticated

### 3. Navigation Architecture

```
/
├── (auth)/
│   ├── page.tsx (Landing Page)
│   └── login/
│       └── page.tsx (Login Page)
└── (app)/
    ├── layout.tsx (Auth Protection)
    └── dashboard/
        ├── page.tsx (Department Grid)
        └── [id]/
            └── page.tsx (Department Detail)
```

### 4. Dashboard (Department Grid)

**Component**: `GlassDashboard.tsx`

#### Features
- Glassmorphic top navigation with logout, settings, notifications
- Department cards in responsive grid layout (3 columns on desktop)
- Each card displays:
  - Department name and description
  - Meeting count and action item count
  - Team member avatars (max 3 + count)
  - Hover animations with `glass-interactive`

#### Navigation
- Click any department card to view its timeline and knowledge graph

### 5. Department Detail View

**Component**: `DepartmentDetail.tsx`

#### Split Layout
- **Left Panel**: Event Timeline
- **Right Panel**: Interactive Knowledge Graph

#### Left Panel - Event Timeline
`EventTimeline.tsx` displays:
- **Meeting Started** - Purple nodes
- **Decision Made** - Cyan nodes
- **Action Created** - Green nodes  
- **Risk Flagged** - Red nodes
- Timeline connector lines with staggered animations
- Hover interactions reveal full event details

#### Right Panel - Knowledge Graph
`KnowledgeGraphVisual.tsx` features:
- **SVG-based graph** with Framer Motion animations
- **Node types** (color-coded):
  - Participants (Purple #8b5cf6)
  - Decisions (Cyan #0ea5e9)
  - Action Items (Green #10b981)
  - Risks (Red #ef4444)
- **Animated edges** showing relationships (decided, owns, flagged)
- **Staggered entrance** - Nodes and edges appear sequentially
- **Hover effects** - Node scaling, glow, and tooltip with type label
- **Legend** at bottom showing all node types

### 6. Icon System

#### Replaced Emoji Icons with Lucide React Icons

**Profile/Auth Icons**
- `ArrowLeft` - Back navigation
- `LogOut` - Logout button
- `LogIn` - Login button

**Navigation Icons**
- `Bell` - Notifications
- `Settings` - Settings panel
- `Plus` - Create/Add actions
- `Filter` - Filter options
- `Search` - Search functionality

**Meeting Content Icons**
- `Play` - Meeting started
- `Zap` - Decision made
- `CheckCircle2` - Action item completed
- `AlertCircle` - Risk flagged
- `Users` - Participant events
- `Clock` - Time-based events
- `TrendingUp` - Metrics and trends
- `ChevronRight` - Navigation indicators

### 7. Color Palette

#### Primary Colors
- **Cyan**: `#0ea5e9` - Primary accent, decisions
- **Purple**: `#8b5cf6` - Participants, secondary accent
- **Green**: `#10b981` - Action items, success
- **Red**: `#ef4444` - Risks, alerts
- **Amber**: `#f59e0b` - Warnings

#### Neutrals
- **Background**: `#0a0a0a` - Deep black
- **Card**: `#1a1a1a` - Slightly lighter black
- **Muted**: `#2d2d2d` - Dark gray
- **Text**: `#ffffff` - White
- **Text Secondary**: `#a0a0a0` - Medium gray

### 8. Animations

Using Framer Motion:
- **Stagger Delays** - Child elements appear in sequence (0.05s-0.1s intervals)
- **Entrance Effects** - Fade + slide/scale for initial appearance
- **Hover Interactions** - Scale, color, and shadow changes on interaction
- **SVG Path Animations** - Edge lines draw in, nodes grow from center
- **Shimmer Effect** - Subtle light reflection across glass surfaces

### 9. Typography

- **Font Family**: Geist for sans-serif, Geist Mono for code
- **Heading Sizes**: 
  - H1: 4xl-5xl (`text-4xl md:text-5xl`)
  - H2: 2xl (`text-2xl`)
  - H3: lg-xl (`text-lg`)
- **Body Text**: Base size with `leading-relaxed` (1.5-1.6 line-height)
- **Gradient Headings**: `.gradient-text` class creates cyan→purple gradient

### 10. Responsive Design

#### Breakpoints
- **Mobile**: Single column layouts, compact spacing
- **Tablet** (`md:`): 2-column grids
- **Desktop** (`lg:`): 3-4 column grids

#### Glassmorphic Adjustments
- Padding scales with screen size
- Grid columns change via `md:grid-cols-2 lg:grid-cols-3`
- Text sizes adjust with responsive classes

## Component Structure

```
components/
├── dashboard/
│   ├── GlassDashboard.tsx (Main dashboard container)
│   ├── GlassDepartmentCard.tsx (Department card)
│   ├── DepartmentDetail.tsx (Department view)
│   ├── EventTimeline.tsx (Timeline visualization)
│   └── KnowledgeGraphVisual.tsx (Graph visualization)
├── shared/
│   ├── TopNavBar.tsx (Navigation header)
│   ├── RecordingBar.tsx (Meeting controls)
│   ├── StartMeetingModal.tsx (Meeting creation)
│   ├── NotificationCenter.tsx (Alerts)
│   └── GlobalSearch.tsx (Search interface)
├── meeting/
│   ├── MeetingDetailView.tsx
│   ├── OverviewTab.tsx
│   ├── TranscriptTab.tsx
│   ├── OutputsTab.tsx
│   └── KnowledgeGraphTab.tsx
└── ticket/
    └── TicketSlideOver.tsx
```

## Data Flow

### Mock Data Structure
```
company: Company
  └── departments: Department[]
      ├── name: string
      ├── description: string
      ├── meetings: Meeting[]
      │   ├── decisions: Decision[]
      │   ├── actionItems: ActionItem[]
      │   └── risks: Risk[]
      └── members: string[] (participant names)
```

### Timeline Generation
Events are generated from meeting data:
- Meeting start event
- Decision events (with impact severity)
- Action item events (with priority)
- Risk events (with severity level)

All events sorted by timestamp (newest first) and animated with staggered delays.

## Browser Compatibility

- Modern browsers with ES2020+ support
- CSS backdrop-filter support required for glass effect
- SVG support for knowledge graph visualization
- Next.js 16 with React 19.2+

## Performance Considerations

1. **Staggered Animations** - Distributed over ~400-600ms to prevent jank
2. **SVG Optimization** - Limited node count (particles pattern) for smooth rendering
3. **Lazy Loading** - Department data loaded on demand
4. **Memoization** - Timeline event generation memoized to prevent recalculation

## Future Enhancements

1. Real-time graph updates as transcript is analyzed
2. WebSocket support for live collaboration
3. D3.js integration for larger, more complex graphs
4. Export/share timeline and graph as images
5. Custom theme colors per department
6. Advanced filtering on timeline events
7. AI-powered meeting insights summaries

## Troubleshooting

### Glass effect not visible
- Check browser support for `backdrop-filter` CSS property
- Ensure background gradients are applied to html/body
- Verify `bg-white/X` opacity classes are rendering

### Graph nodes not animating
- Check Framer Motion is imported correctly
- Verify SVG viewBox dimensions match container
- Check browser console for animation errors

### Timeline events not showing
- Verify meeting data has decisions, actions, and risks
- Check event timestamp format is ISO 8601
- Ensure Department data includes meetings array

## Notes

- Landing page redirects to login if not authenticated
- Mock login stores data in localStorage (not persistent across browser close in private mode)
- All emoji icons removed in favor of Lucide React icons for professional appearance
- Glassmorphic design inspired by macOS, iOS, and Apple design systems
