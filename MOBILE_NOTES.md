# Mobile Support - Technical Notes

## Changes Made

### 1. HTML Meta Tags (`index.html`)

- Enhanced viewport configuration with safe-area-inset support
- Added Apple mobile web app capabilities
- Configured app status bar and display mode

### 2. CSS (`src/responsive.css`)

- Minimal responsive breakpoints
- Hide non-essential buttons on mobile (Annual, Stats, PNG, JPEG)
- Basic font scaling for small screens
- Print optimization
- Accessibility support (reduced motion, high contrast)

### 3. Base Styles (`src/index.css`)

- Prevent iOS input zoom with 16px font size
- Simple viewport overflow handling

### 4. Layout (`src/App.tsx`)

- ConfigPanel only visible to managers and admins (via `canAccessSettings` check)
- No layout restructuring - maintains original design

## Browser Support

- iOS Safari 14+
- Chrome for Android 90+
- All modern mobile browsers

## Testing

Test on actual mobile devices:

- iPhone (Safari, Chrome)
- Android phone (Chrome)
- Tablets in both orientations

## Notes

- Original desktop layout preserved
- Mobile optimization is minimal and non-invasive
- All existing features work on mobile without changes
