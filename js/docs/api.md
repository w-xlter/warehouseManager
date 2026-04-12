# `/docs/api.md`

This document describes the API/data-access layer of the warehouse management application.

This module is responsible for all communication with the database (Supabase) and acts as the **single source of truth for data operations**.

It does NOT:
- render UI
- handle DOM events
- manage authentication state
- implement business logic beyond request execution

---

# 1. Overview

This module provides CRUD operations for the `testhouse` table:

- `getItems()` → read data
- `updateRowById()` → update existing rows
- `insertRow()` → insert new rows
- `deleteRowById()` → remove rows

All operations are executed through Supabase and are subject to Row Level Security (RLS).

---

# 2. Authentication Dependency

This module depends on `auth.js` for:

- retrieving the current session
- accessing the Supabase client instance

Before executing any read operation, the module verifies that a valid session exists.

---

# 3. Data Fetching (`getItems`)

## Purpose
Retrieves all rows from the `testhouse` table for the authenticated user.

---

## Flow

1. Retrieve current session via `AUTH.getSession()`
2. Validate session exists
3. Query Supabase table:
   - `select("*")` from `testhouse`
4. Return results or empty array on failure

---

## Security Model

Access control is enforced by:
- Supabase Row Level Security (RLS)

This function does NOT manually filter data; it relies on database-level rules.

---

## Failure Handling

Returns `[]` in all failure cases:
- missing session
- query error
- unexpected runtime error

This ensures UI stability and prevents crashes.

---

# 4. Update Operation (`updateRowById`)

## Purpose
Updates a specific row in a given table.

---

## Parameters

- `table` → target table name
- `id` → row identifier
- `updates` → object containing fields to update

---

## Behavior

- Performs a `.update(updates)` query
- Filters by `.eq("id", id)`
- Returns Supabase response directly

---

## Notes

- No session check is performed here
  - assumes caller has validated authentication
- Relies on RLS for permission enforcement

---

# 5. Insert Operation (`insertRow`)

## Purpose
Inserts a new row into a specified table.

---

## Behavior

- Inserts provided `values`
- Uses `.select().single()` to return:
  - the newly created row (not an array)

---

## Why `.single()` is used

It simplifies UI handling:
- avoids array unpacking
- ensures immediate access to inserted row

---

## Logging

Logs insert payload for debugging purposes.

---

# 6. Delete Operation (`deleteRowById`)

## Purpose
Deletes a row by ID.

---

## Behavior

- Executes `.delete()`
- Filters by `.eq("id", id)`
- Returns Supabase response

---

## Security

Deletion is enforced by:
- RLS policies (not by frontend logic)

---

# 7. Error Handling Strategy

This module does NOT throw errors upward by default.

Instead:
- errors are returned by Supabase responses
- callers decide how to handle UI rollback or messaging

---

# 8. Design Patterns Used

## 8.1 Thin Data Layer
This module is intentionally minimal:
- no UI logic
- no state management
- no transformation beyond request formatting

---

## 8.2 RLS-First Security Model
All access control is handled in the database:
- this module assumes policies are correctly configured

---

## 8.3 Fail-Safe Returns
`getItems()` always returns an array:
- prevents UI crashes
- simplifies rendering logic

---

# 9. External Dependencies

- `auth.js`
  - provides Supabase client
  - provides session access

- Supabase client API
  - `.from()`
  - `.select()`
  - `.insert()`
  - `.update()`
  - `.delete()`

---

# 10. What this module should NOT do

To maintain clean separation of concerns:

- No DOM manipulation
- No rendering logic
- No modal/UI interaction
- No business rules enforcement beyond request execution