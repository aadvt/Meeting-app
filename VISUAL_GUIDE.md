# Meridian Glassmorphism - Visual Reference Guide

## Color Palette

### Primary Colors
```
Cyan (Primary Accent)
Hex: #0ea5e9
RGB: 14, 165, 233
Usage: Decisions, primary buttons, headings

Purple (Secondary Accent)
Hex: #8b5cf6
RGB: 139, 92, 246
Usage: Participants, secondary elements

Green (Success/Actions)
Hex: #10b981
RGB: 16, 185, 129
Usage: Action items, completed states, positive indicators

Red (Alerts/Risks)
Hex: #ef4444
RGB: 239, 68, 68
Usage: Risks, errors, high priority

Amber (Warnings)
Hex: #f59e0b
RGB: 245, 158, 11
Usage: Warnings, cautions, medium priority
```

### Neutral Colors
```
Background (Deepest)
Hex: #0a0a0a
RGB: 10, 10, 10
Usage: Main background, full darkness

Card (Dark)
Hex: #1a1a1a
RGB: 26, 26, 26
Usage: Card backgrounds, elevated surfaces

Muted (Medium)
Hex: #2d2d2d
RGB: 45, 45, 45
Usage: Hover states, secondary backgrounds

Text Primary
Hex: #ffffff
RGB: 255, 255, 255
Usage: Main text, headings

Text Secondary
Hex: #a0a0a0
RGB: 160, 160, 160
Usage: Captions, muted text
```

## Glassmorphic Components

### 1. Glass Base
```
Visual Properties:
├── Backdrop Blur: blur-xl (20px)
├── Background: rgba(255, 255, 255, 0.08)
├── Border: 1px rgba(255, 255, 255, 0.10)
├── Border Radius: 16px (rounded-2xl)
└── Box Shadow: None (clean look)

Hover State:
├── Background: rgba(255, 255, 255, 0.12)
├── Border: 1px rgba(255, 255, 255, 0.20)
└── Box Shadow: 0 0 20px rgba(6, 182, 212, 0.20)
```

### 2. Glass Small
```
Visual Properties:
├── Backdrop Blur: blur-lg (12px)
├── Background: rgba(255, 255, 255, 0.05)
├── Border: 1px rgba(255, 255, 255, 0.05)
├── Border Radius: 12px (rounded-xl)
└── Usage: Compact elements, badges, small cards
```

### 3. Glass Large
```
Visual Properties:
├── Backdrop Blur: blur-2xl (40px)
├── Background: rgba(255, 255, 255, 0.10)
├── Border: 1px rgba(255, 255, 255, 0.15)
├── Border Radius: 24px (rounded-3xl)
└── Usage: Major content areas, modals, hero sections
```

### 4. Glass Glow
```
Visual Properties:
├── All base glass properties
├── Box Shadow: 0 0 30px rgba(6, 182, 212, 0.10)
└── Usage: Emphasized elements, call-to-action areas
```

### 5. Glass Interactive
```
Base State:
├── All glass properties
└── Cursor: pointer

Hover State:
├── Background: rgba(255, 255, 255, 0.12)
├── Border: rgba(255, 255, 255, 0.20)
├── Box Shadow: 0 0 20px rgba(6, 182, 212, 0.20)
├── Transform: translateY(-2px)
└── Transition: all 0.3s ease

Active/Focused State:
├── Ring: 2px rgba(6, 182, 212, 0.40)
└── Background: rgba(255, 255, 255, 0.15)
```

## Typography System

### Headings
```
H1 - Large Hero
├── Font Size: 48px (4xl) → 64px (5xl on md)
├── Font Weight: 700 (bold)
├── Line Height: 1.2
├── Letter Spacing: -0.02em
└── Usage: Page titles, hero text

H2 - Section Title
├── Font Size: 32px (2xl)
├── Font Weight: 700
├── Line Height: 1.3
├── Letter Spacing: -0.015em
└── Usage: Section headings

H3 - Subsection
├── Font Size: 20px (lg-xl)
├── Font Weight: 600
├── Line Height: 1.4
├── Letter Spacing: 0
└── Usage: Component headings

H4 - Card Title
├── Font Size: 18px (base-lg)
├── Font Weight: 600
├── Line Height: 1.5
└── Usage: Card titles, item names
```

### Body Text
```
Body - Regular
├── Font Size: 16px (base)
├── Font Weight: 400
├── Line Height: 1.5 (leading-relaxed)
├── Letter Spacing: 0
└── Usage: Main content, paragraphs

Body Small
├── Font Size: 14px (sm)
├── Font Weight: 400
├── Line Height: 1.5
└── Usage: Secondary text, descriptions

Body XSmall
├── Font Size: 12px (xs)
├── Font Weight: 400
├── Line Height: 1.5
└── Usage: Captions, metadata, timestamps

Body Code
├── Font Size: 13px
├── Font Family: monospace (Geist Mono)
├── Font Weight: 400
└── Usage: Code snippets, technical info
```

### Gradient Text
```
Gradient Text Style:
├── Background: linear-gradient(90deg, #06b6d4, #3b82f6, #a78bfa)
├── Background-clip: text
├── Text Color: transparent
├── Usage: Hero headings, featured text
└── Effect: Cyan → Blue → Purple gradient
```

## Icon System

### Size Variants
```
Extra Small: w-3 h-3 (12px)
├── Usage: Inline badges, tiny indicators
└── Example: Status dots

Small: w-4 h-4 (16px)
├── Usage: Form inputs, small UI elements
└── Example: Search icon in input

Medium: w-5 h-5 (20px)
├── Usage: Navigation, main icons
└── Example: Top nav icons, buttons

Large: w-6 h-6 (24px)
├── Usage: Featured icons, emphasis
└── Example: Large action buttons

XL: w-8 h-8 (32px)
├── Usage: Hero sections, decorative
└── Example: Large social icons
```

### Icon Colors
```
Primary: #0ea5e9 (cyan)
├── Usage: Main interactive icons
└── Example: Primary action buttons

Success: #10b981 (green)
├── Usage: Completed, positive states
└── Example: Checkmark icons

Warning: #f59e0b (amber)
├── Usage: Cautions, attention needed
└── Example: Alert icons

Danger: #ef4444 (red)
├── Usage: Errors, risks, critical
└── Example: Error/close icons

Muted: #a0a0a0 (gray)
├── Usage: Disabled, secondary states
└── Example: Inactive navigation icons

White: #ffffff (white)
├── Usage: Light backgrounds, contrast
└── Example: Icons on dark glass
```

## Spacing System

```
Base Unit: 4px

Sizes:
├── 0.5: 2px
├── 1: 4px
├── 2: 8px
├── 3: 12px
├── 4: 16px
├── 6: 24px
├── 8: 32px
├── 12: 48px
└── 16: 64px

Padding Examples:
├── Dense: p-2 (8px all sides)
├── Normal: p-4 (16px all sides)
├── Spacious: p-6 (24px all sides)
└── Generous: p-8 (32px all sides)

Gap Between Elements:
├── Tight: gap-2 (8px)
├── Normal: gap-4 (16px)
├── Relaxed: gap-6 (24px)
└── Loose: gap-8 (32px)
```

## Animation Timings

### Duration
```
Quick: 150ms
├── Usage: Subtle hovers, rapid feedback
└── Example: Button scale on hover

Standard: 300ms
├── Usage: Regular transitions
└── Example: Card slide-in, opacity fade

Smooth: 500ms
├── Usage: Slower, more deliberate
└── Example: Page transitions

Slow: 600-800ms
├── Usage: Very deliberate actions
└── Example: Graph node entrance, staggered animations
```

### Easing Functions
```
easeOut: cubic-bezier(0.16, 1, 0.3, 1)
├── Usage: Entrance animations
└── Effect: Starts fast, ends slow

easeIn: cubic-bezier(0.7, 0, 0.84, 0)
├── Usage: Exit animations
└── Effect: Starts slow, ends fast

easeInOut: cubic-bezier(0.4, 0, 0.2, 1)
├── Usage: Balanced animations
└── Effect: Smooth acceleration/deceleration

linear: cubic-bezier(0, 0, 1, 1)
├── Usage: Continuous animations
└── Example: Loading spinners, rotating elements
```

### Stagger Pattern
```
Default Stagger:
├── First child: delay 0.1s
├── Each child: +0.05s delay
└── Total: ~300-600ms range

Example with 5 items:
├── Item 1: 0.1s
├── Item 2: 0.15s
├── Item 3: 0.2s
├── Item 4: 0.25s
└── Item 5: 0.3s
```

## Component Layouts

### Department Card
```
┌─────────────────────────────┐
│  Name              [→]      │  ← Chevron on hover
│  Description                │
│                             │
│  ┌──────┐  ┌──────┐        │
│  │ 24   │  │ 12   │        │  ← Stats boxes
│  │Mtgs  │  │Actn  │        │
│  └──────┘  └──────┘        │
│                             │
│  Team: [S] [M] [A] +2      │  ← Member avatars
└─────────────────────────────┘
```

### Timeline Event
```
  ┌─ [●] ━━━  ← Timeline dot + connector
  │  
  ├─ ┌──────────────────────┐
  │  │ Event Title          │
  │  │ Event Description    │
  │  │                      │
  │  │ [Metadata] [Badges]  │
  │  └──────────────────────┘
  │
  └─ [●]
```

### Knowledge Graph Node
```
Standard State:
  ┌─────────────┐
  │   Label     │
  │  (colored)  │  ← 24-32px circle
  └─────────────┘

Hover State:
  ✨ ┌─────────────┐ ✨
    │   Label     │
  ✨ │  (glowing)  │ ✨  ← Glow around node
    └─────────────┘

With Tooltip:
  ╔═════════════╗
  ║  decision   ║  ← Type label
  ╚═════════════╝
      ↓
    ┌─────────┐
    │ Node    │
    └─────────┘
```

## Responsive Breakpoints

### Mobile (< 768px)
```
• Single column layouts
• Full-width elements
• Vertical spacing
• Compact navigation
• Touch-friendly (48px+ tap targets)
```

### Tablet (768px - 1023px)
```
• Two column layouts
• Medium spacing
• Horizontal navigation
• Balanced proportions
```

### Desktop (1024px+)
```
• Three+ column layouts
• Generous spacing
• Sticky navigation
• Optimal reading width
• Sidebar layouts possible
```

## Example Component Styling

### Button Primary
```
Base:
  background: linear-gradient(135deg, #0ea5e9, #06b6d4)
  color: white
  padding: 12px 24px
  border-radius: 8px
  font-weight: 600
  font-size: 16px

Hover:
  transform: translateY(-2px)
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.3)

Active:
  transform: translateY(0)
  opacity: 0.9
```

### Input Field
```
Unfocused:
  background: rgba(255, 255, 255, 0.05)
  border: 1px rgba(255, 255, 255, 0.08)
  padding: 10px 16px
  border-radius: 8px

Focused:
  background: rgba(255, 255, 255, 0.10)
  border: 1px rgba(6, 182, 212, 0.4)
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1)
```

### Card Container
```
  background: rgba(255, 255, 255, 0.08)
  border: 1px rgba(255, 255, 255, 0.10)
  border-radius: 16px
  padding: 24px
  backdrop-filter: blur(20px)
  
  On Hover:
    background: rgba(255, 255, 255, 0.12)
    border: 1px rgba(255, 255, 255, 0.20)
```

## Visual Hierarchy

### Primary Elements (Attract attention first)
- Large headings (H1, H2)
- Cyan colored elements
- Glow effects
- Animations/motion

### Secondary Elements (Next level of importance)
- Section headings (H3)
- Purple accents
- Glass containers
- Icons

### Tertiary Elements (Supporting)
- Body text
- Gray text
- Small metadata
- Static badges

### Quaternary Elements (Minimal importance)
- Borders
- Dividers
- Placeholders
- Disabled states

---

**All visual specifications follow Apple Human Interface Guidelines and material design principles for glassmorphism.**
