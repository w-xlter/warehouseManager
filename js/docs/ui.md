# `/docs/ui.md`

This document describes the UI module of the warehouse management application.

The UI layer is responsible for:
- rendering and updating DOM elements
- handling user interactions (clicks, inputs, modals)
- optimistic UI updates
- reacting to real-time database events
- managing sidebar navigation
- handling modal-based workflows

It does NOT:
- directly manage authentication
- perform raw database access (delegated to `api.js`)
- manage session state (delegated to `auth.js`)

---

# 1. Quantity Adjustment Flow (`additionAndSubtraction`)

## Purpose
Handles increment/decrement operations for stock quantities using a modal input system.

Triggered when a user clicks:
- `+` button → increases quantity
- `-` button → decreases quantity

---

## Flow Overview

1. Read current quantity from DOM
2. Determine operation type (`+` or `-`)
3. Build modal UI dynamically:
   - label shows current value + operation
   - numeric input for delta value
4. Open modal via `openModal`
5. Wait for user input
6. Validate input
7. Apply optimistic UI update
8. Persist change to database
9. Roll back UI if API fails

---

## Key Behaviors

### Modal structure is dynamically built
A `div.modal-row` is created manually and passed into the modal system.

This allows full UI flexibility without coupling to modal implementation.

---

### Keyboard handling
- `Enter` → submits value
- handled via `onKeydown` callback passed into modal system

---

### Optimistic UI update pattern
Before database confirmation:
- UI is immediately updated
- improves perceived responsiveness

If API fails:
- original value is restored

---

# 2. Authentication UI (`updateAuthUI`)

## Purpose
Updates the top status indicator based on authentication state.

---

## Behavior

- If session exists:
  - displays user email
- If no session:
  - shows logged-out state

---

## Responsibility
This function is purely presentational.

It does NOT:
- fetch session
- manage auth state

---

# 3. Real-time Database Updates (`handlePayload`)

## Purpose
Handles live updates from Supabase Realtime subscription.

Ensures UI stays in sync with backend changes.

---

## Event Types

### INSERT
- Adds new row to table
- Skips update if row already exists (optimistic UI protection)

### UPDATE
- Updates:
  - product name (cell 0)
  - quantity cell (cell 1)

- Rebuilds quantity cell using `createQuantityCell`

### DELETE
- Removes row from DOM if it exists

---

## Design Pattern

This function enforces **event-driven UI consistency**:
- backend is source of truth
- UI reacts to changes asynchronously

---

# 4. Sidebar Navigation System

## Purpose
Manages a collapsible sidebar menu.

---

## Behavior

### Toggle logic
- clicking `#menu-btn` toggles sidebar visibility
- clicking outside closes sidebar

---

## Menu construction

### `createMenuSection(title, items)`
Builds a UI section with:
- title header
- list of buttons

Each item contains:
- `label`
- `onClick` handler

---

## Design Note
Sidebar is fully data-driven:
- UI is generated from configuration arrays
- no hardcoded button logic inside DOM

---

# 5. Row Edit Modal (`openEditModal`)

## Purpose
Allows editing or deleting a table row (product name + row removal).

---

## Trigger condition

Activated when:
- clicking first column (`cellIndex === 0`)
- row is NOT an inline input row
- click is not on a button

---

## Modal structure

Contains:
- input field (pre-filled with current name)
- action buttons:
  - Save
  - Cancel
  - Delete

---

## Actions

### Save
1. Update UI immediately (optimistic)
2. Call `API.updateRowById`
3. Roll back on failure

---

### Delete
1. Remove row immediately (optimistic)
2. Call `API.deleteRowById`
3. Roll back on failure if needed

---

### Cancel
- closes modal without changes

---

## DOM Strategy
This modal is fully manual DOM construction:
- no abstraction layer
- direct control over layout and behavior

---

# 6. UI Design Patterns Used

## 6.1 Optimistic UI
Used in:
- quantity updates
- row edits
- deletions

Pattern:
> update UI first → confirm with backend → rollback if error

---

## 6.2 Event Delegation
Used in:
- table click handling
- sidebar interactions

Benefits:
- fewer listeners
- dynamic row support

---

## 6.3 Real-time synchronization
UI is continuously synced with backend events:
- INSERT
- UPDATE
- DELETE

---

## 6.4 Manual DOM construction
No framework abstraction:
- explicit element creation
- predictable rendering flow
- full control over UI structure

---

# 7. Module Responsibility Summary

This file is responsible for:

- Table rendering interactions
- Quantity manipulation workflows
- Row editing and deletion UI
- Sidebar navigation system
- Real-time database UI synchronization
- Modal-driven interaction flows

---

# 8. What this file should NOT do

To maintain separation of concerns:

- No authentication logic
- No direct Supabase queries
- No business rules (permissions, validation rules)
- No persistent state management

---

# 9. Architectural Note

This UI module acts as a **reactive DOM layer**:
- backend → emits events
- UI → reacts and updates view
- API layer → performs persistence
- auth layer → manages identity


## External Dependencies

This module relies on shared UI utilities defined elsewhere:

- `openModal` → defined in `/docs/modal-system.md` (or modal module)
  - Used for all modal-based interactions
  - Handles lifecycle, key events, overlay behavior, and resolution flow
  - UI module only provides content and behavior, not modal infrastructure

- `createQuantityCell` → internal UI helper
  - Builds quantity control UI (+ / - buttons)