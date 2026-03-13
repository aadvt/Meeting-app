# Meridian Glassmorphism Edition - Quick Start Guide

## What's New?

This is a complete redesign of Meridian with:
- **Apple-inspired glassmorphism** UI with frosted glass effects
- **Modern authentication flow** with landing page → login → dashboard
- **Interactive timeline visualization** for meeting events
- **SVG-based knowledge graph** showing relationships between decisions, actions, risks, and participants
- **Professional Lucide icons** replacing all emoji icons
- **Smooth Framer Motion animations** throughout

## Getting Started

### 1. Start the Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:3000`

### 2. Navigate the Application

#### Landing Page (Initial Load)
```
URL: /
```
- Hero section with app features
- "Get Started" button leads to login

#### Login Page
```
URL: /login
```
- Mock credentials pre-filled
- Click "Sign In" to enter dashboard (stores auth in localStorage)

#### Dashboard (Department Grid)
```
URL: /dashboard
```
- See all company departments as glassmorphic cards
- Each card shows:
  - Department name
  - Meeting count
  - Action item count
  - Team member avatars
- Click any card to view department detail

#### Department Detail (Timeline + Graph)
```
URL: /dashboard/[department-id]
Example: /dashboard/dept-1
```
- **Left Side**: Event Timeline
  - Shows all meetings, decisions, actions, risks
  - Color-coded by event type
  - Hover for details
- **Right Side**: Knowledge Graph
  - Visual network of meetings
  - Nodes for participants (purple), decisions (cyan), actions (green), risks (red)
  - Edges show relationships
  - Hover nodes to see labels

### 3. Key Features to Try

#### Timeline Interactions
- Hover over timeline events to see full details
- Events appear in reverse chronological order
- Event severity indicators (high/medium/low)

#### Knowledge Graph
- Hover over nodes to see them glow and scale
- Tooltip shows node type on hover
- Legend at bottom explains all colors
- Nodes animate in sequence on load

#### Top Navigation
- Click bell icon to see notifications
- Click settings icon for options
- Click logout icon to return to landing page

#### Department Cards
- Hover effect lifts cards up
- Smooth transition to detail page
- Responsive grid adjusts to screen size

## File Structure

```
app/
├── (auth)/                    # Authentication routes
│   ├── page.tsx              # Landing page
│   ├── login/
│   │   └── page.tsx          # Login page
│   └── layout.tsx            # Auth layout
├── (app)/                    # Protected app routes
│   ├── layout.tsx            # Auth guard
│   └── dashboard/
│       ├── page.tsx          # Department grid
│       └── [id]/
│           └── page.tsx      # Department detail
└── globals.css               # Glassmorphism styles

components/
├── dashboard/
│   ├── GlassDashboard.tsx
│   ├── GlassDepartmentCard.tsx
│   └── DepartmentDetail.tsx
└── department/
    ├── EventTimeline.tsx
    └── KnowledgeGraphVisual.tsx

lib/
├── types.ts                  # TypeScript interfaces
├── data/
│   └── mockData.ts          # Mock company/meetings data
└── animations.ts            # Framer Motion presets
```

## Mock Data

The app uses mock data with:
- **4 Departments**: Product, Engineering, Design, Data & Analytics
- **5 Participants**: Sarah, Mike, Alice, James, Emma
- **5 Meetings** with:
  - 3 Decisions each
  - 5 Action Items each
  - 3 Risks each
  - Full transcripts

Meeting data is in `/lib/data/mockData.ts`. Modify there to see changes reflected in the app.

## Glassmorphism Classes

Use these utility classes to apply the glass effect to any element:

```tsx
// Basic glass effect
<div className="glass">
  
// Smaller variant (compact)
<div className="glass-sm">
  
// Larger variant (prominent)
<div className="glass-lg">
  
// Interactive glass (hover effect)
<div className="glass-interactive">
  
// Glass with glow
<div className="glass-glow">
  
// Glass input field
<input className="glass-input" />

// Gradient text
<h1 className="gradient-text">
  Heading with gradient
</h1>
```

## Color System

```css
/* Primary Colors */
--primary: #0ea5e9        /* Cyan - Decisions */
--accent: #0ea5e9         /* Cyan accent */

/* Status Colors */
--status-green: #10b981   /* Green - Actions */
--status-amber: #f59e0b   /* Amber - Warnings */
--status-red: #ef4444     /* Red - Risks */

/* Chart Colors */
--chart-1: #0ea5e9        /* Cyan */
--chart-2: #10b981        /* Green */
--chart-3: #f59e0b        /* Amber */
--chart-4: #ef4444        /* Red */
--chart-5: #8b5cf6        /* Purple */
```

## Common Tasks

### Add a New Department
Edit `/lib/data/mockData.ts`:
```typescript
export const departments = {
  // ... existing departments
  newdept: {
    id: 'dept-5',
    name: 'New Department',
    description: 'Description here',
    isRecording: false,
    openActionItems: 0,
    meetingCount: 0,
    participants: [participants.sarah, participants.mike],
    color: '#your-color-here',
  },
}
```

### Add Meetings to a Department
```typescript
const createMeeting = (id: string, deptId: string, title: string, offset: number): Meeting => ({
  id,
  title,
  date: new Date(Date.now() - offset).toISOString(),
  duration: 45,
  departmentId: deptId,
  status: 'Completed',
  participants: [...],
  decisions: [...],
  actionItems: [...],
  risks: [...],
  // ... other fields
})

export const meetings = {
  // ... existing meetings
  'your-meeting': createMeeting('your-meeting', 'dept-id', 'Meeting Title', 2 * 60 * 60 * 1000),
}
```

### Customize Glassmorphism Effect
Edit `/app/globals.css` - look for `@layer components` section:
```css
.glass {
  @apply backdrop-blur-xl bg-white/8 border border-white/10 rounded-2xl;
  /* Adjust opacity values:
     bg-white/8 = 8% opacity
     border-white/10 = 10% opacity
  */
}
```

### Change Theme Colors
Edit `/app/globals.css` - update `:root` CSS variables:
```css
:root {
  --primary: #your-color;
  --accent: #your-accent;
  --status-green: #your-success;
  /* ... etc */
}
```

## Troubleshooting

### "Authentication failed" on dashboard
- Clear localStorage: `localStorage.removeItem('meridian_auth')`
- Click logout and login again

### Glassmorphic effect not visible
- Check browser supports `backdrop-filter`
- Ensure dark background is applied (it is by default)
- Verify CSS is loaded: check DevTools > Styles

### Timeline events not showing
- Verify meeting has decisions/actions/risks
- Check that meetings are assigned to correct department
- Open browser console for errors

### Graph nodes not animating
- Check Framer Motion installed: `npm list framer-motion`
- Verify SVG renders: inspect with DevTools
- Check browser supports CSS transforms and animations

## Performance Tips

1. **Reduce animation stagger** - Edit `DepartmentDetail.tsx` transition delays
2. **Simplify graph** - Reduce node count by limiting decisions/actions/risks
3. **Lazy load images** - Add `loading="lazy"` to any images
4. **Disable animations** - Set `motion.defaults.skip = true` for older devices

## Next Steps

- Read `REDESIGN.md` for detailed technical documentation
- Explore component code in `components/` folder
- Customize colors and effects in `globals.css`
- Modify mock data to test with your own scenarios
- Deploy to Vercel with one click using the "Publish" button

## Support

For issues or questions:
1. Check browser console for errors (F12 > Console)
2. Verify all dependencies installed: `npm install`
3. Clear build cache: `rm -rf .next` then `npm run dev`
4. Check REDESIGN.md for detailed documentation

---

**Happy building! Enjoy the glassmorphic experience.**
