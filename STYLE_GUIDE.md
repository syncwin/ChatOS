# ChatOS Style Guide

## Brand Color Palette

This application uses a **strictly enforced** color palette to maintain a distinctive, enterprise-grade appearance. **No other colors should be used outside the specified palette.**

### Color Definitions

| Role      | Dark Mode | Light Mode | Hex Code  | Tailwind Class |
|-----------|-----------|------------|-----------|----------------|
| Base      | #0d0d0d   | #ffffff    | -         | `bg-background` |
| Primary   | #3f00ff   | #3f00ff    | #3f00ff   | `bg-primary` or `bg-brand-primary` |
| Secondary | #FFFF00   | #FFFF00    | #FFFF00   | `bg-secondary` or `bg-brand-secondary` |
| Accent    | #FF8000   | #FF8000    | #FF8000   | `bg-accent` or `bg-brand-accent` |

### Color Usage Rules

1. **Exclusive Palette**: Only use colors from the defined brand palette
2. **No Custom Colors**: Do not introduce any colors outside this palette
3. **No Colored Borders**: Use transparent or same-color borders only
4. **Consistent Branding**: Primary, secondary, and accent colors remain the same in both light and dark modes
5. **Base Color Switch**: Only the base color changes between modes (#0d0d0d for dark, #ffffff for light)

## Tailwind Configuration

The brand colors are available in Tailwind config as:

```typescript
brand: {
  base: {
    dark: '#0d0d0d',
    light: '#ffffff',
  },
  primary: '#3f00ff',
  secondary: '#FFFF00',
  accent: '#FF8000',
}
```

### Usage Examples

```tsx
// Primary brand color
<button className="bg-brand-primary text-white">

// Secondary brand color
<div className="bg-brand-secondary text-black">

// Accent brand color
<span className="text-brand-accent">

// Using Shadcn design system (recommended)
<Button variant="default"> // Uses primary color
<Button variant="secondary"> // Uses secondary color
```

## Scrollbar Design

All scrollbars use a standardized design that matches the chat interface:

### Standard Scrollbar
- **Width/Height**: 8px
- **Track**: Transparent background
- **Thumb**: Uses `--muted` color with 4px border-radius
- **Hover**: Uses `--muted-foreground` with 50% opacity

### Chat-Specific Scrollbar
For enhanced chat interface consistency, use the `.chat-scroll` class:
- **Thumb**: Uses primary color with 30% opacity
- **Hover**: Uses primary color with 50% opacity

```tsx
// Apply chat-specific scrollbar
<div className="chat-scroll overflow-y-auto">
  {/* Chat content */}
</div>
```

## Implementation Guidelines

### 1. Color Enforcement
- Use only Shadcn design system colors (`primary`, `secondary`, `accent`, `muted`, etc.)
- For direct brand colors, use `brand-primary`, `brand-secondary`, `brand-accent`
- Avoid hardcoded hex values in components

### 2. Border Guidelines
- Use `border-transparent` for invisible borders
- Use `border-border` for standard borders (follows theme)
- **Never** use colored borders outside the palette

### 3. Component Consistency
- Prefer Shadcn UI components which automatically use the design system
- Use Tailwind utilities that reference CSS variables
- Test components in both light and dark modes

### 4. Scrollbar Implementation
- Global scrollbar styles are automatically applied
- Use `.chat-scroll` class for chat-related scrollable areas
- Ensure scrollbar visibility in both light and dark modes

## CSS Variables Reference

### Light Mode
```css
:root {
  --background: 0 0% 100%; /* #ffffff */
  --primary: 252 100% 50%; /* #3f00ff */
  --secondary: 60 100% 50%; /* #FFFF00 */
  --accent: 24 100% 50%; /* #FF8000 */
}
```

### Dark Mode
```css
.dark {
  --background: 0 0% 5.1%; /* #0d0d0d */
  --primary: 252 100% 50%; /* #3f00ff */
  --secondary: 60 100% 50%; /* #FFFF00 */
  --accent: 24 100% 50%; /* #FF8000 */
}
```

## Development Checklist

### Before Adding New Components
- [ ] Verify all colors use the approved palette
- [ ] Test component in both light and dark modes
- [ ] Ensure no hardcoded colors outside the palette
- [ ] Check that borders follow the guidelines
- [ ] Apply appropriate scrollbar styling if needed

### Code Review Checklist
- [ ] No hex colors outside the brand palette
- [ ] No colored borders (except transparent or theme colors)
- [ ] Proper use of Shadcn design system
- [ ] Consistent scrollbar implementation
- [ ] Visual consistency across light/dark modes

## Prohibited Practices

❌ **Don't Do This:**
```tsx
// Hardcoded colors
<div style={{backgroundColor: '#ff0000'}}>
<div className="bg-red-500">

// Colored borders
<div className="border-blue-500">

// Custom scrollbar styles
<div style={{scrollbarColor: '#ff0000'}}>
```

✅ **Do This Instead:**
```tsx
// Use design system colors
<div className="bg-primary">
<div className="bg-brand-accent">

// Use theme borders
<div className="border-border">
<div className="border-transparent">

// Use standardized scrollbar
<div className="chat-scroll overflow-y-auto">
```

## Support

For questions about the style guide or color implementation, refer to:
- `src/index.css` - CSS variables and scrollbar styles
- `tailwind.config.ts` - Brand color definitions
- Shadcn UI documentation for component usage

---

**Remember**: This style guide ensures visual consistency and maintains the distinctive ChatOS brand identity. All developers must follow these guidelines strictly.