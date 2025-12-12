# HomeFit Score Panel

A modern, data-driven property analysis dashboard designed as a fixed right-side panel for Zillow listing pages.

## Overview

HomeFit Score is a compact 400px-wide vertical panel that provides comprehensive property analysis including:

- Overall HomeFit Score with visual rating
- Price comparison vs Zestimate
- Environment metrics (noise, light, air quality)
- Commute and essentials proximity scores
- Skate and kid-friendly features
- Must-have property checks

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Lucide React (icons)

## Project Structure

```
/
├── App.tsx                      # Main panel component
├── components/
│   ├── check-chip.tsx           # Pass/fail check indicator
│   ├── horizontal-bar.tsx       # Color-coded score bar
│   ├── price-card.tsx           # Price comparison card
│   ├── score-card.tsx           # Overall score display
│   └── tag-chip.tsx             # Status tags/labels
└── styles/
    └── globals.css              # Tailwind configuration
```

## Components

### ScoreCard
Displays the overall HomeFit Score with a large number, fit rating, and description.

**Props:**
- `score: number` - The score value
- `maxScore?: number` - Maximum score (default: 100)
- `title: string` - Card title
- `fitLabel: string` - Rating label (e.g., "Strong Fit")
- `fitVariant: 'success' | 'warning' | 'danger' | 'neutral'` - Color theme
- `description: string` - Explanatory text

### PriceCard
Shows list price vs Zestimate with percentage difference and market status.

**Props:**
- `listPrice: number` - Property list price
- `zestimate: number` - Zillow estimate

### HorizontalBar
Color-coded progress bar for scoring metrics.

**Props:**
- `label: string` - Metric name
- `value: number` - Score value
- `maxValue?: number` - Maximum value (default: 100)
- `subtitle?: string` - Optional additional info

**Color Ranges:**
- 0-30: Red (poor)
- 30-60: Orange (fair)
- 60-80: Light green (good)
- 80-100: Strong green (excellent)

### CheckChip
Pass/fail indicator with icon and label.

**Props:**
- `label: string` - Check description
- `passed: boolean` - Pass/fail status

### TagChip
Reusable status pill/badge component.

**Props:**
- `label: string` - Tag text
- `variant?: 'success' | 'warning' | 'danger' | 'neutral'` - Color theme
- `size?: 'sm' | 'md' | 'lg'` - Size variant

## Customization

### Updating Property Data

Edit the `property` object in `/App.tsx`:

```typescript
const property = {
  address: '2847 Barton Skyway',
  city: 'Austin, TX 78704',
  specs: '3 bd · 2 ba · 2,100 sqft',
  inZone: true,
  overallScore: 87,
  listPrice: 550000,
  zestimate: 544100,
};
```

### Modifying Score Sections

Update the score arrays in `/App.tsx`:

```typescript
const environmentScores = [
  { label: 'Sound Score', value: 72, subtitle: 'Quiet is better' },
  // Add more scores...
];
```

### Adjusting Color Thresholds

Edit the `getBarColor` function in `/components/horizontal-bar.tsx`:

```typescript
const getBarColor = (score: number) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-lime-500';
  if (score >= 30) return 'bg-orange-500';
  return 'bg-red-500';
};
```

### Panel Width

Modify the width in `/App.tsx`:

```typescript
<div
  style={{
    width: '400px', // Change this value (380-420px recommended)
    // ...
  }}
>
```

## Design System

### Colors

- **Success Green:** `#22C55E` (bg-green-500)
- **Warning Orange:** `#F59E0B` (bg-orange-500)
- **Danger Red:** `#EF4444` (bg-red-500)
- **Muted Text:** `#6B7280` (text-gray-600)
- **Light Background:** `#F9FAFB` (bg-gray-50)
- **Bar Backdrop:** `#E5E7EB` (bg-gray-200)

### Typography

The project uses Tailwind's default font stack with custom typography defined in `/styles/globals.css`:

- **H1:** 2xl, medium weight
- **H2:** xl, medium weight
- **H3:** lg, medium weight
- **Body:** base, normal weight

### Spacing

- **Panel Padding:** 24px (p-6)
- **Section Gaps:** 24px (mb-6)
- **Element Gaps:** 16px (mb-4)

## Development Notes

- All components are fully typed with TypeScript
- Panel uses fixed positioning for right-side display
- Fully responsive within the panel width
- Scroll enabled for content overflow
- Clean separation of concerns with modular components

## Future Enhancements

- Add smooth animations on score bar fills
- Implement hover states with tooltips
- Add data fetching from real APIs
- Create settings panel for customization
- Add export/share functionality
- Implement dark mode toggle