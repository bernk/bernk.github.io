# Location Logger (loclog)

A simple, single-page app for crew boat captains to log arrivals at predefined locations.

## App Goal

One user logs arrivals during their shift by tapping large, easy-to-tap buttons for each location.

- Locations are editable: add, delete, reorder, rename
- Tapping a location button logs an entry with date, time, and location name
- Manual entry button allows logging custom/one-off locations
- No backend, no server, no frameworks/libraries—just HTML, CSS, vanilla JS
- Mobile-first: huge buttons (min 80px height/touch-friendly), readable fonts, full-screen, minimal UI
- Persist locations and log via localStorage (keys: `loclog_locations`, `loclog_log`)
- No geolocation/auto-detection—just manual button taps

**Out-of-scope:** accounts, sharing, maps, notifications

## File Structure

```
loclog/
├── index.html      # Main HTML structure
├── style.css       # All styles
├── script.js       # All JavaScript
└── CLAUDE.md       # This file
```

## Tech Stack

- Pure HTML5/CSS3/JS (ES6+)
- localStorage for data persistence
- No external dependencies

## Data Structures

### Locations
Simple array of strings stored in `loclog_locations`:
```js
["Dock A", "Marina", "Pier 5"]
```

### Log Entries
Array of objects stored in `loclog_log`:
```js
{
  locationDate: "2026-01-19",           // YYYY-MM-DD
  locationTime: {
    displayTime: "14:23",               // HH:mm (actual time)
    roundedTime: "1425"                 // HHmm (rounded to nearest 5 min)
  },
  locationName: "Dock A"
}
```

## Key Functions

### Main Screen
- `renderMainScreen()` — Renders Manual Entry button + location buttons in grid
- `logLocation(index)` — Logs entry for predefined location
- `logManualEntry(name)` — Logs entry for custom location name
- `showManualInput()` / `hideManualInput()` — Toggle manual entry card overlay

### Manage Screen
- `renderManageScreen()` — Renders editable location list
- `addLocation(name)` — Add new location
- `deleteLocation(index)` — Delete with confirmation
- `renameLocation(index, newName)` — Inline rename
- `moveLocation(index, direction)` — Reorder up/down

### Log Screen
- `renderLogScreen()` — Renders log entries (newest first via `.toReversed()`)
- `clearLog()` — Clear all with confirmation

### Utilities
- `escapeHtml(str)` — Prevent XSS
- `roundTime(hours, minutes)` — Round to nearest 5 minutes, returns "HHmm" string
- `showToast(message)` — Brief feedback notification

## UI Components

### Three Screens (tab navigation)
1. **Log** — Grid of location buttons, Manual Entry first
2. **Locations** — Add/edit/delete/reorder locations
3. **History** — Scrollable log with Clear All button

### Manual Entry Card
- Modal overlay triggered by Manual Entry button
- Input field with Cancel/Log buttons
- Dismissable via Escape, backdrop click, or Cancel

### Toast
- Fixed position notification at bottom
- Auto-dismisses after 2 seconds

## CSS Patterns

- CSS custom properties for theming (`--bg`, `--btn-primary`, etc.)
- Mobile-first with `@media (min-width: 768px)` for desktop
- Grid layout for location buttons (2 columns)
- Flexbox for navigation and lists
- `.show` class pattern for toggling visibility (toast, overlay)

## Coding Conventions

- Event delegation for dynamically rendered elements
- Functions grouped by screen/feature with comment headers
- `enterkeyhint="done"` on mobile inputs
- Accessibility: aria-labels on buttons

## Workflow

1. Scan repo first and propose plan before any file changes
2. Propose new files/folders explicitly before creating
3. Minimal changes: edit in place, no rewrites unless requested
4. Verify changes: describe what changed and why
5. Test manually: simulate mobile (resize browser), check localStorage in devtools
