This module is a **DOM-driven UI layer**. It intentionally avoids frameworks (never used them before, don't know how) and instead relies on:

- Direct DOM manipulation
- Event delegation
- Optimistic UI updates
- Stateless rendering patterns

## Design Philosophy

This code follows a few principles:

### Optimistic UI First
All user actions immediately reflect in the UI before server confirmation. Failures trigger rollback.

### Stateless Rendering
There is no internal state store. The DOM is treated as the source of truth (might need to change this in the future).

### Composability
Small utilities (`createRow`, `createQuantityCell`, `openModal`) are reused everywhere.

### Event Delegation
Instead of binding events per element, listeners are attached to containers.

---

# Table Rendering System

## `render(items, tableId)`

This is the main entry point for displaying data.

### Responsibilities:
- Clears the container (`#stockTable`)
- Creates a fresh `<table>`
- Injects:
  - An inline input row (always first)
  - A list of data rows


# Row Creation Abstraction

## createRow(data, options)

This function is the core rendering primitive.

It supports two modes:

### Inline Mode (isInline = true)

Used for creating new entries.

Renders:
  - Product input
  - Quantity input

Handles keyboard navigation:
  - Enter on product → move to quantity
  - Enter on quantity → submit


#### Submission Flow
  - Validate input
  - Create temporary row (optimistic)
  - Insert into DOM
  - Clear inputs
  - Call API
  - Replace temp row with real data OR rollback

### Display Mode

Used for existing rows.

Behavior:
  -Assigns row ID

Renders:
  - Product name (text)
  - Quantity (via createQuantityCell)

# Quantity System
`createQuantityCell(quantity)`

Encapsulates quantity display + controls.

[ - ]  [ 42 ]  [ + ]

# Event Delegation 

`tableContainer.addEventListener("click", async (e) => { ... })`

## Responsibilities:
  - Detect clicked cell
  - Route behavior based on target:
  - + / - → modal flow
  - Cell click → inline edit

# Increment / Decrement Flow

Handled by:

additionAndSubtraction(e, cell, row)

Behavior:
  - Detect button (+ or -)
  - Accept user input via modal
  - Optimistically update UI and persist via API / rollback if needed

# loginModal()

Uses openModal to implement auth flow.

Returns:
  - { email, password, action }


# updateAuthUI(session)

Simple UI toggle:

  - Logged in → "profile"
  - Logged out → "login"


# togglePopover(session)
  - Injects user email
  - Toggles popover visibility


# Real-Time Sync 

`handlePayload(payload)`

Processes backend events.

Supported Events:
  - INSERT
  - UPDATE
  - DELETE
  - INSERT
If row already exists → ignore (optimistic case)

# Sidebar System
Initialization: `initSidebar()`

Creates a section: `createMenuSection(title)`

Returns a controller object with:
  - setItems
  - addItem
  - updateItem
  - removeItem

## Public API
  - setMagazzini
  - addMagazzino
  - updateMagazzino
  - removeMagazzino

specific the "magazzino" section

# Row Editing & Deletion

Triggered by clicking on name cell.

`openEditModal({ rowId, currentName, row })`

Custom modal (not using openModal yet).

Features:
- Edit name
- Delete row
- Cancel



# This module relies on shared UI utilities defined elsewhere:

- `openModal` → defined in `/docs/openModal.md` 
  - Used for all modal-based interactions
  - Handles lifecycle, key events, overlay behavior, and resolution flow
  - UI module only provides content and behavior, not modal infrastructure

- `createQuantityCell` → internal UI helper
  - Builds quantity control UI (+ / - buttons)