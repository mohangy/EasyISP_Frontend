# Responsive UI Development Guidelines

## Overview
All UI changes in the EasyISP Frontend **MUST** be optimized for viewing on all screen sizes:
- **Mobile** (sm: 640px and below)
- **Tablet** (md: 768px to 1023px)  
- **Desktop** (lg: 1024px and above)

## Breakpoint Reference (Tailwind CSS)
| Prefix | Min Width | Device Type |
|--------|-----------|-------------|
| (none) | 0px | Mobile first (default) |
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops/Desktops |
| `xl:` | 1280px | Large screens |
| `2xl:` | 1536px | Extra large screens |

## Required Responsive Patterns

### 1. Layout Centering
- Mobile: Full-width layouts
- Tablet+: Centered with `md:flex md:flex-col md:items-center` and `md:w-fit`

### 2. Text Sizing
- Use responsive text: `text-sm md:text-base lg:text-lg`
- Labels: `text-xs md:text-sm`
- Headings: `text-lg md:text-xl lg:text-2xl`

### 3. Spacing & Padding
- Use responsive padding: `p-3 md:p-4 lg:p-6`
- Use responsive gaps: `gap-2 md:gap-4`
- Use responsive margins: `space-y-4 md:space-y-6`

### 4. Grid Layouts
- Mobile: Stack or 2-column `grid-cols-1 sm:grid-cols-2`
- Tablet: 2-3 columns `md:grid-cols-3`
- Desktop: 3-4 columns `lg:grid-cols-4`

### 5. Tables
- Always wrap in `overflow-x-auto` for horizontal scroll on mobile
- Consider card-based layout on mobile for complex tables

### 6. Forms
- Mobile: Stack fields vertically `flex-col`
- Tablet+: Side by side `sm:flex-row`
- Full-width inputs on mobile: `w-full sm:max-w-md`

### 7. Navigation/Tabs
- Mobile: Horizontal scroll with `overflow-x-auto scrollbar-hide`
- Tablet+: Centered with `md:justify-center`

### 8. Buttons
- Mobile: Full-width or icon-only
- Larger screens: Standard width with text

### 9. Modals
- Mobile: Full-screen or nearly full `w-full sm:max-w-lg`
- Tablet+: Centered with max-width

## Checklist Before Completing UI Changes
- [ ] Tested on mobile viewport (< 640px)
- [ ] Tested on tablet viewport (768px - 1023px)
- [ ] Tested on desktop viewport (1024px+)
- [ ] Text is readable on all sizes
- [ ] Touch targets are large enough on mobile (min 44x44px)
- [ ] No horizontal overflow issues
- [ ] Centering/alignment correct on all sizes
