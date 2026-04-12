## Overview

The openModal system provides a **fully generic, low-level utility** for rendering modal dialogs.

It is intentionally designed to be:

* **Unopinionated**
* **Layout-agnostic**
* **Logic-free**

The modal does **not** manage form state, layout, or validation.
Instead, it acts as a **container and lifecycle manager**, while the caller fully controls:

* Content structure
* Layout (rows, inputs, buttons, etc.)
* Behavior and validation logic

---

## Design Principles

### 1. "Stupid" by Design

The modal:
* Renders a container
* Mounts provided elements
* Handles closing
* Provides optional keyboard handling

---

### 2. Caller Owns Everything Inside

You are expected to:

* Build DOM elements manually
* Group them however you want (rows, grids, etc.)
* Handle validation logic yourself

---

### 3. Promise-Based API

The modal returns a `Promise`, allowing usage like:

```js
const result = await openModal(...);
```

The resolved value depends on what your action handlers return.

---

## API

### `openModal(options)`

#### Parameters

| Property         | Type                                     | Description                 |
| ---------------- | ---------------------------------------- | --------------------------- |
| `title`          | `string \| null`                         | Optional modal title        |
| `content`        | `HTMLElement \| HTMLElement[] \| string` | Main content                |
| `actions`        | `Array`                                  | Footer buttons              |
| `onKeydown`      | `function`                               | Custom keyboard handler     |
| `closeOnOverlay` | `boolean`                                | Close when clicking outside |
| `closeOnEscape`  | `boolean`                                | Close on Escape key         |

---

## Content Handling

The modal accepts three types of content:

### 1. Single Element

```js
openModal({
  content: inputElement
});
```

### 2. Multiple Elements 

```js
openModal({
  content: [row1, row2, row3]
});
```

### 3. String

```js
openModal({
  content: "Simple text"
});
```

Strings are automatically wrapped in a `<p>` element.

---

## Row-Based Layout

The modal does not create rows itself.

You must define them manually:

```js
const row = document.createElement("div");
row.className = "modal-row";

row.append(label, input);
```

Then pass:

```js
openModal({
  content: row
});
```

Or multiple rows:

```js
openModal({
  content: [row1, row2]
});
```

---

## Actions (Buttons)

### Structure

```js
actions: [
  {
    label: "Confirm",
    className: "confirm",
    onClick: () => value
  }
]
```

### Behavior

* `onClick` is optional
* If it returns:

  * `false` → modal stays open
  * anything else → modal closes and resolves with that value

---

## Return Value

The modal resolves with:

* Value returned by an action
* `null` if closed via overlay or Escape

Example:

```js
const result = await openModal(...);

if (result === null) {
  // user cancelled
} else {
  // user confirmed with value
}
```

---

## Keyboard Handling

### Custom Handler

```js
onKeydown: (e, { close }) => {
  if (e.key === "Enter") {
    close("value");
    return false; // prevents default behavior
  }
}
```

### Behavior Priority

1. Custom `onKeydown`
2. Default Escape handling

---

## Closing Behavior

### Overlay Click

Controlled by:

```js
closeOnOverlay: true
```

Closes only when clicking outside the modal.

---

### Escape Key

Controlled by:

```js
closeOnEscape: true
```

---

### Programmatic Close

You can close manually:

```js
close(value);
```

---

## Internal Lifecycle

### Creation Flow

1. Create overlay
2. Create modal container
3. Append title (if any)
4. Append content
5. Append actions (if any)
6. Mount to DOM

---

### Destruction Flow

On close:

* Event listeners are removed
* Modal is removed from DOM
* Promise resolves

---

## Example Usage

### Simple Input Modal

```js
const row = document.createElement("div");
row.className = "modal-row";

const label = document.createElement("label");
label.textContent = "Amount";

const input = document.createElement("input");

row.append(label, input);

const result = await openModal({
  content: row,
  actions: [
    {
      label: "Confirm",
      className: "confirm",
      onClick: () => parseInt(input.value)
    },
    {
      label: "Cancel",
      className: "cancel",
      onClick: () => null
    }
  ]
});
```
