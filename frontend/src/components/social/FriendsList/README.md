# FriendsList Component

This directory contains a modular implementation of the FriendsList component, broken down into focused sub-components for better maintainability.

## Structure

```
FriendsList/
├── FriendsList.tsx           # Main component with state management
├── FriendsListHeader.tsx     # Header with tabs and close button
├── FriendsTab.tsx           # Friends list display
├── RequestsTab.tsx          # Friend requests display
├── FriendItem.tsx           # Individual friend item
├── FriendRequestItem.tsx    # Individual friend request item
└── index.ts                 # Barrel exports
```

## Components

### FriendsList.tsx

- Main container component
- Manages friends and friend requests state
- Handles socket events for real-time updates
- Coordinates all sub-components

### FriendsListHeader.tsx

- Tab navigation (Friends/Requests)
- Close button functionality
- Unread requests indicator

### FriendsTab.tsx

- Displays list of friends
- Shows online status
- Empty state handling

### RequestsTab.tsx

- Shows received and sent friend requests
- Handles accept/reject actions
- Empty state handling

### FriendItem.tsx

- Individual friend display
- Online status indicator
- Message and remove buttons

### FriendRequestItem.tsx

- Individual friend request display
- Accept/reject buttons for received requests
- Pending status for sent requests

## Usage

```tsx
import FriendsList from "./FriendsList";

<FriendsList
  isOpen={true}
  onClose={handleClose}
  onOpenDM={handleOpenDM}
  onOnlineFriendsChange={handleOnlineFriendsChange}
/>;
```

## Features

- Real-time friend status updates
- Online/offline indicators
- Friend request management
- Modal interface
- Tab-based navigation
- Empty state handling
