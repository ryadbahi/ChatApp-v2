# DMThreadsMenu Component

This directory contains a modular implementation of the DMThreadsMenu component, broken down into focused sub-components for better maintainability.

## Structure

```
DMThreadsMenu/
├── DMThreadsMenu.tsx         # Main component with state management
├── DMThreadsMenuButton.tsx   # Toggle button with unread count
├── DMThreadsMenuHeader.tsx   # Dropdown header
├── DMThreadsMenuContent.tsx  # Content container
├── DMThreadItem.tsx         # Individual thread item
└── index.ts                 # Barrel exports
```

## Components

### DMThreadsMenu.tsx

- Main container component
- Manages threads state and real-time updates
- Handles dropdown open/close logic
- Coordinates all sub-components

### DMThreadsMenuButton.tsx

- Trigger button for the dropdown
- Shows unread message count badge
- Hover and click animations

### DMThreadsMenuHeader.tsx

- Dropdown header with title
- Close button functionality

### DMThreadsMenuContent.tsx

- Content area with loading and empty states
- Renders list of thread items
- Scroll handling

### DMThreadItem.tsx

- Individual conversation thread
- Shows user avatar and online status
- Last message preview
- Unread count indicator
- Message timestamp formatting

## Usage

```tsx
import DMThreadsMenu from "./DMThreadsMenu";

<DMThreadsMenu
  currentUser={user}
  onOpenDM={handleOpenDM}
  className="custom-class"
/>;
```

## Features

- Real-time message updates
- Unread message counts
- Last message previews
- Click outside to close
- Responsive dropdown
- Empty state handling
- Message truncation
- Time formatting
