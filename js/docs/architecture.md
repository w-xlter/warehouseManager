# Architecture Overview

## Overview

This project is a **frontend-driven warehouse management tool** built on top of a Supabase backend.

It is designed for **small-scale environments** (e.g. bars, restaurants) where:

* Real-time updates are useful
* Multi-user access is required
* Setup and maintenance should be minimal

---

## High-Level Structure

```
Frontend (Vanilla JS)
│
├── auth.js   → Authentication layer (Supabase)
├── api.js    → Database interaction layer
├── ui.js     → UI rendering + interaction logic
├── main.js   → App entry point / orchestration
│
└── Supabase Backend
     ├── Auth (users)
     ├── Database (Postgres)
     └── RLS Policies (security)
```

---

## Core Principles

### 1. Separation of Concerns

Each file, as suggested, has a **single responsibility**:

| Module     | Responsibility                    |
| ---------- | --------------------------------- |
| `auth.js`  | Authentication + session handling |
| `api.js`   | Database operations               |
| `ui.js`    | DOM rendering + user interaction  |
| `main.js`  | App orchestration                 |


### 2. Security via RLS (Row-Level Security)

All database access is protected using:

* `auth.uid()` for user identity
* Permission tables (`table_permissions`)
* Custom SQL functions (`has_table_access`)

This ensures:

* Users can only access allowed rows
* Frontend cannot bypass security
* Even direct API calls are constrained

---

### 3. Optimistic UI

UI updates are applied **before** backend confirmation:

1. User performs action (e.g. change quantity)
2. UI updates immediately
3. API request is sent
4. If it fails → rollback

This provides:

* Faster perceived performance
* Smoother UX

---

### 4. Real-Time Synchronization

Uses Supabase real-time channels:

```js
supabase
  .channel("public:testhouse")
  .on("postgres_changes", ..., handler)
```

This allows:

* Multi-user sync
* Live updates without refresh
* Conflict resolution via payload handling

---

## Data Flow

### 1. Read Flow

```
UI → api.js → Supabase → RLS → Data → UI.render()
```

* `main.js` triggers `loadAndRender()`
* `api.js` fetches data
* `ui.js`renders table

---

### 2. Write Flow

```
User Action → ui.js (optimistic update)
             → api.js → Supabase → RLS
             → Success OR Rollback
```

---

### 3. Real-Time Flow

```
Database Change → Supabase Realtime → UI.handlePayload()
                → DOM update
```

---

## Deeper in Module Responsibilities

### `main.js`

* Entry point
* Initializes:

  * Auth state
  * Event listeners
  * Initial data load
  * Realtime subscription

---

### `auth.js`

* Wraps Supabase Auth API
* Provides:

  * `signUp`
  * `signIn`
  * `signOut`
  * `getSession`
  * `onAuthChange`

---

### `api.js`

* Abstracts database calls
* Ensures:

  * Session exists before queries
  * Errors are handled gracefully

Functions:

* `getItems`
* `updateRowById`
* `insertRow`
* `deleteRowById`

---

### `ui.js`

Handles:

* Table rendering
* Event handling
* Optimistic updates
* Realtime payload updates
* Sidebar + modal interactions
