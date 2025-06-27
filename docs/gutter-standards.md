# Gutter Standards and Implementation Guide

## Overview
This document outlines the consistent gutter (horizontal spacing) standards implemented across the ChatOS application to ensure proper visual hierarchy, readability, and user experience across all device sizes.

## Gutter Size Standards

### Mobile Devices (≤ 639px)
- **Minimum gutter width**: 16px (1rem)
- **Tailwind class**: `px-4` or use `gutter-responsive`
- **Purpose**: Ensures content doesn't touch screen edges on small devices

### Small Tablets (640px - 767px)
- **Gutter width**: 20px (1.25rem)
- **Tailwind class**: `px-5` or use `gutter-responsive`
- **Purpose**: Provides breathing room as screen size increases

### Tablets and Desktop (≥ 768px)
- **Gutter width**: 24px (1.5rem)
- **Tailwind class**: `px-6` or use `gutter-responsive`
- **Purpose**: Maintains visual balance on larger screens

## Implementation

### 1. Responsive Gutter Utility Class
Use the `gutter-responsive` class for automatic responsive gutters:

```css
.gutter-responsive {
  padding-left: 1rem; /* 16px on mobile */
  padding-right: 1rem; /* 16px on mobile */
}

@media (min-width: 640px) {
  .gutter-responsive {
    padding-left: 1.25rem; /* 20px on small tablets */
    padding-right: 1.25rem; /* 20px on small tablets */
  }
}

@media (min-width: 768px) {
  .gutter-responsive {
    padding-left: 1.5rem; /* 24px on tablets and desktop */
    padding-right: 1.5rem; /* 24px on tablets and desktop */
  }
}
```

### 2. Fixed Gutter Utility Classes
For specific gutter sizes:

- `.gutter-xs`: 16px gutters
- `.gutter-sm`: 20px gutters
- `.gutter-md`: 24px gutters
- `.gutter-lg`: 32px gutters

### 3. Tailwind Configuration
The following spacing values are available in `tailwind.config.ts`:

```typescript
spacing: {
  "gutter-xs": "1rem", // 16px
  "gutter-sm": "1.25rem", // 20px
  "gutter-md": "1.5rem", // 24px
  "gutter-lg": "2rem", // 32px
}
```

### 4. Container Configuration
Tailwind container automatically applies responsive gutters:

```typescript
container: {
  center: true,
  padding: {
    DEFAULT: "1rem", // 16px minimum gutter for mobile
    xs: "1rem", // 16px for extra small screens
    sm: "1.25rem", // 20px for small tablets
    md: "1.5rem", // 24px for tablets
    lg: "1.5rem", // 24px for desktop
    xl: "1.5rem", // 24px for large desktop
    "2xl": "2rem", // 32px for extra large screens
  },
}
```

## Usage Examples

### Header Component
```tsx
<header className="sticky top-0 bg-background border-b">
  <div className="w-full max-w-4xl mx-auto gutter-responsive py-4">
    {/* Header content */}
  </div>
</header>
```

### Footer Component
```tsx
<footer className="sticky bottom-0 bg-background border-t">
  <div className="w-full max-w-4xl mx-auto gutter-responsive">
    {/* Footer content */}
  </div>
</footer>
```

### Main Content
```tsx
<main className="flex-1">
  <div className="container mx-auto">
    {/* Content automatically gets responsive gutters */}
  </div>
</main>
```

## Component Guidelines

### Do's
- ✅ Use `gutter-responsive` for main layout containers
- ✅ Use Tailwind's `container` class for automatic responsive gutters
- ✅ Apply gutters to parent containers, not individual components
- ✅ Test on multiple device sizes to ensure proper spacing
- ✅ Use `safe-area-padding` class for mobile devices with notches

### Don'ts
- ❌ Don't hardcode pixel values for gutters
- ❌ Don't apply horizontal padding to child components when parent has gutters
- ❌ Don't use inconsistent gutter sizes across similar components
- ❌ Don't let content touch screen edges on any device size

## Testing Checklist

### Mobile Testing (320px - 639px)
- [ ] Minimum 16px gutters on both sides
- [ ] No horizontal scrolling
- [ ] Content doesn't touch screen edges
- [ ] Readable text with proper spacing

### Tablet Testing (640px - 1023px)
- [ ] 20-24px gutters provide adequate breathing room
- [ ] Proper visual hierarchy maintained
- [ ] Touch targets are appropriately spaced

### Desktop Testing (≥ 1024px)
- [ ] 24px gutters maintain visual balance
- [ ] Content is centered and well-proportioned
- [ ] No excessive white space on large screens

## Safe Area Support

For devices with notches or rounded corners, use the `safe-area-padding` class:

```css
.safe-area-padding {
  padding-left: max(1rem, env(safe-area-inset-left));
  padding-right: max(1rem, env(safe-area-inset-right));
}
```

## Maintenance

- Review gutter consistency during code reviews
- Test new components on multiple device sizes
- Update this documentation when gutter standards change
- Ensure new team members understand these standards

## Related Files

- `src/index.css` - Global gutter utilities and responsive styles
- `tailwind.config.ts` - Tailwind configuration with gutter spacing
- `src/hooks/use-mobile.tsx` - Device detection hooks
- `src/components/Header.tsx` - Header implementation example
- `src/components/ChatView.tsx` - Footer implementation example
- `src/components/InputArea.tsx` - Component without horizontal padding