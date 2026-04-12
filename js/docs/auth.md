# `/docs/auth.md`

This document describes the authentication layer of the warehouse management application.

This module is a thin wrapper around the Supabase authentication system and provides a simplified API for the rest of the application.

It is responsible for:
- initializing the Supabase client
- exposing authentication methods
- providing session access
- emitting auth state change events

It does NOT:
- handle UI rendering
- store application state beyond session retrieval
- enforce authorization rules (handled via RLS in the database)

---

# 1. Supabase Client Initialization

## Purpose
Creates and exposes a shared Supabase client instance used across the application.

---

## Implementation

- Uses `@supabase/supabase-js`
- Configured with:
  - project URL
  - public anon key

---

## Exports

### `supabase`
- Primary client instance
- Used by:
  - `api.js`
  - auth functions
  - realtime subscriptions

### `window.supabase`
- Exposed globally for debugging purposes
- Allows inspection from browser console

---

## Security Note

The key used here is a **public anon key**:
- safe to expose in frontend
- permissions are enforced via RLS (Row Level Security)
- does NOT grant admin access

---

# 2. Authentication API

This module wraps Supabase authentication methods to provide a consistent interface.

---

# 2.1 `signUp(email, password)`

## Purpose
Registers a new user account.

---

## Behavior

- Calls `supabase.auth.signUp`
- Returns auth response data
- Throws error if registration fails

---

## Error Handling

Errors are not swallowed:
- must be handled by caller (UI layer)

---

# 2.2 `signIn(email, password)`

## Purpose
Authenticates an existing user.

---

## Behavior

- Uses password-based login via Supabase
- Returns session/user data on success
- Throws error on failure

---

# 2.3 `signOut()`

## Purpose
Logs out the current user.

---

## Behavior

- Invalidates current session
- Clears auth state in Supabase client

---

## Return Value

- `void` on success
- throws error on failure

---

# 2.4 `getSession()`

## Purpose
Retrieves the current authentication session.

---

## Behavior

- Calls `supabase.auth.getSession()`
- Logs session result to console (debugging aid)
- Returns session object

---

## Usage

Used by:
- `main.js` (initial load check)
- `api.js` (access control validation)

---

## Note

This function is a **read-only state query**:
- does not modify auth state
- safe to call frequently

---

# 2.5 `onAuthChange(callback)`

## Purpose
Subscribes to authentication state changes.

---

## Behavior

- Wraps `supabase.auth.onAuthStateChange`
- Invokes callback on:
  - login
  - logout
  - token refresh
  - session restoration

---

## Callback Signature

```js
(event, session) => {}