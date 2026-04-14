# Main Application Entry Point

This file (`main.js`) is the central entry point of the warehouse management application.

It is responsible for initializing authentication, loading initial data, wiring UI events, and subscribing to real-time database updates.

---

## Purpose

The main module acts as an **orchestrator**. It does not contain business logic itself. Instead, it connects:

- `auth.js` → authentication and session handling
- `api.js` → database operations
- `ui.js` → rendering and UI state updates

---

## Initialization Flow

When the DOM is fully loaded, the application executes the following sequence:

### Session Check
- Calls `AUTH.getSession()`
- Determines whether a user is already logged in
- If a session exists → table access is loaded immediately, otherwise prompt the login

### Authentication Listener
- Registers `AUTH.onAuthChange()`
- Keeps UI in sync with login/logout state changes

---

## Authentication Handlers

### Sign Up
Triggered by `#signup` button:
- Reads email and password inputs
- Calls `AUTH.signUp()`
- Displays success or error message
- UI updates automatically via auth listener 

### Login
Triggered by `#login` button:
- Calls `AUTH.signIn()`
- Waits for session confirmation
- Loads data if login succeeds

### Logout
Triggered by `#logout` button:
- Calls `AUTH.signOut()`
- UI updates automatically via auth listener

---

## Data Loading

## `getTables`

This function is responsible for:
- Verifying an active session
- Fetching items from the database via `API.getAvailableTables()`
- Rendering results using `UI.setMagazzini()`

### `loadAndRender()`

This function is responsible for:
- Verifying an active session
- Fetching items from the database via `API.getItems()`
- Rendering results using `UI.render()`

It is called when a user selects a table from the available ones in the sidebar.

---

## Real-Time Database Subscription

The application listens to changes in the `testhouse` table using Supabase Realtime via the `subscribeToTable(tableId)` function:

Events handled:
- INSERT → new rows added to UI
- UPDATE → existing rows updated
- DELETE → rows removed from UI

Handler:
- `UI.handlePayload`

---


## Key Responsibilities Summary

This file is responsible for:

- Application bootstrapping
- Authentication lifecycle coordination
- Initial data loading
- Real-time subscription setup
- Delegating UI updates to `ui.js`

---

## What this file should NOT do

To maintain separation of concerns, this file must NOT:

- Manipulate DOM structure directly (outside initialization)
- Contain business logic (database rules, validation, etc.)
- Implement UI rendering logic
- Handle raw Supabase queries directly