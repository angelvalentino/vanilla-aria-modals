# ModalHandler Architecture

## Introduction

This document describes the internal architecture of `ModalHandler`, including private methods, data structures, and the overall logic flow. It is intended for developers who want to understand the inner workings of the class, customize it, or troubleshoot advanced issues.  

> **Note:** This document does not replace reading the actual code. Many internal behaviors rely on private methods and closures, which are essential to understand before making any modifications. 
💾 Modifications to the public API of the class should be accompanied by updates to the corresponding **.d.ts** file to ensure accurate IntelliSense.

`ModalHandler` handles modal stacking, focus management, ARIA event registration, and restoration. Internally, it uses private properties and methods to manage:  

- Event handlers for body and modal elements to keep track of function references
- Active modal stack to be able to close only current modal
- Focus tracking and restoration  
- Debug logging  

Understanding the flow of modal registration, event attachment, and focus handling is key to modifying or extending the class safely.

<br>

## Logic Flow Overview

The lifecycle of a modal in `ModalHandler` can be summarized as follows.

1. **Adding focus**

   - Public method: `addFocus()`

   - Logic flow:
     - First, the method checks whether `auto` is **true**. If it is, the class needs to store the last focused element for later restoration. Before doing so, it verifies that the provided `modalKey` is not already registered in the focus registry. If a duplicate key is detected, a warning is logged and the process stops.
     - If `auto` is **true**, the last active element is stored internally. If `auto` is **false**, the last active element is returned to the caller so it can be managed manually.
     - A small timeout is used before focusing the first focusable element. This is necessary because, depending on timing and rendering order, setting focus immediately may fail or behave inconsistently.

2. **Opening a modal**

   - Public method: `addA11yEvents()`

   - Logic flow:
     - `#registerModal()` adds the modal key to the active modal stack and logs a warning if the key is already registered.
     - `#handleActiveModalClose()` wraps the close handler to ensure only the topmost modal in the stack can be closed.
     - `#handleEscapeKeyClose()` creates the Escape key handler. This handler is always attached, as Escape-based closing is considered essential for accessibility and minimum ARIA expectations.
     - `#handleOutsideClickClose()` handles clicks outside the modal boundaries, excluding any exempt elements.
     - `#handleTrapFocus()` handles trapping keyboard focus within the modal container.
     - Event listeners are attached to `document.body` and modal elements as needed. Only the Escape key listener is always attached. All other listeners are optional, allowing flexibility in how the class is used.
     - Handler references are stored internally under the corresponding modal key. Document body events are stored separately to allow easy cleanup during SPA route changes or dynamic re-renders.

3. **Restoring focus**

   - Public method: `restoreFocus()`

   - Logic flow:
     - If `auto` is **true**, the method attempts to retrieve the previously stored focus reference from the internal registry. If no stored focus exists for the given modal key, a warning is logged.
     - Depending on the value of `auto`, focus is restored either from the internal registry or from a user-provided element.
     - If `auto` is **true**, the stored focus reference is deleted after restoration.

4. **Closing a modal**

   - Public method: `removeA11yEvents()`

   - Logic flow:
     - `#unregisterModal()` removes the modal key from the active modal stack and logs a warning if the key does not exist.
     - All registered event listeners are removed, including Escape key handling, outside click handling, close button handlers, and focus trapping.
     - Internal references for the modal are cleared to fully clean up associated state.

5. **SPA or dynamic content cleanup**

   - Public method: `reset()`

   - Logic flow:
     - Clears all document body event listeners, resets the active modal stack, and clears the focus registry.
     - This is especially useful in SPAs where `document.body` may not re-render between views and lingering events could otherwise accumulate.
     - The individual cleanup methods `clearDocumentBodyEvents()`, `clearActiveModals()`, and `clearFocusRegistry()` can also be called separately if finer control is needed.

<br>

## Private Properties

### Debug

`#debug` stores a boolean to toggle verbose logging, useful for reviewing stack management, class resets, and which modal is being closed.

```js
#debug = true;  // Enables debug logging
#debug = false; // Disables debug logging
```

Managed by: **setDebug()**

### Event Storage

`#eventsHandler` stores all event references to enable proper removal on modal close or SPA route changes.

```js
#eventsHandler = {
  modalKey: {
    escapeKeyHandler,
    outsideClickHandler,
    trapFocusHandler,
    closeHandler
  },
  documentBody: {
    modalKey: [
      { eventName: 'keydown', callback: escapeKeyHandler },
      { eventName: 'click', callback: outsideClickHandler }
    ]
  }
}
```

Managed by: **addA11yEvents()**, **removeA11yEvents()**, **clearDocumentBodyEvents()**, **reset()**  

### Active Modals
`#activeModals` tracks the stack of currently active modal keys. The topmost modal is the last item in the array.

```js
#activeModals = [
  'modalKey',
  ...
]
```

Tracked by: **#isActiveModal()**

Managed by: **#registerModal()**, **#unregisterModal()**, **clearActiveModals()**, **reset()**  

### Focus Handler
`#focusHandler` stores the last focused element for each modal, allowing focus to be restored when the modal closes.

```js
#focusHandler = {
  modalKey: lastFocusedLmBeforeModal,
  ...
}
```

Managed by: **addFocus()**, **restoreFocus()**, **clearFocusRegistry()**, **reset()**

<br>

## Private Methods

### #isActiveModal()
Checks if the modal with the given key is the topmost active modal.

#### Parameters

- **`modalKey: string;`** Unique modal identifier.

Returns `boolean`. **true** if the modal is the topmost active modal, otherwise **false**

### #registerModal()
Adds the modal with the specified key to the active stack.

#### Parameters

- **`modalKey: string;`** Unique modal identifier.

Returns `boolean`. **true** if the modal was newly added, **false** if the key was already registered.

### #unregisterModal()
Removes the modal with the given key from the active stack.

#### Parameters

- **`modalKey: string;`** Unique modal identifier.

Returns `boolean`. **true** if the modal was removed, **false** if the key did not exist.

### #trapFocus()
Traps keyboard focus inside the modal, handling **Tab** and **Shift+Tab** navigation.

#### Parameters

- **`e: KeyboardEvent;`** The keyboard event object.
- **`element: HTMLElement;`** The modal element in which focus should be trapped.

Returns `void`

### #handleTrapFocus()
Returns a callback for focus trapping on a modal element.
The callback receives only the keyboard event, using a closure.

#### Parameters

- **`modalLm: HTMLElement;`** The modal element where focus should be trapped.

Returns `(e: KeyboardEvent) => void`

### #handleEscapeKeyClose()
Returns a callback that closes the modal when the **Escape** key is pressed. The callback receives the keyboard event and it is passed to **handleActiveModalClose()** to ensure proper propagation control.

#### Parameters
- **`closeHandler: (e: Event) => void;`** Active modal close handler. Receives the event so **e.stopPropagation** can be called if needed. Should be calling the callback returned from **handleActiveModalClose()**.

Returns `(e: KeyboardEvent) => void`

### #handleOutsideClickClose()
Returns a callback that closes the modal if a click occurs outside **modalLmOuterLimits**, excluding any **exemptLms**.

#### Parameters

- **`closeHandler: (e: Event) => void;`** Active modal close handler. Receives the event so **e.stopPropagation** can be called if needed. Should be calling the callback returned from **handleActiveModalClose()**.
- **`modalLmOuterLimits: HTMLElement;`** The container that defines the modal boundary. Used to detect clicks outside the modal. 
- **`exemptLms?: HTMLElement[];`** *(optional)* Array of elements that should not trigger closing even if clicked outside.

Returns `(e: MouseEvent) => void`

### #handleActiveModalClose()
Returns a callback that executes `closeHandler` **only if the modal is the topmost active modal**. 
It calls **e.stopPropagation()** on the event to prevent other close events from being triggered.

#### Parameters

- **`modalKey: string;`** Unique modal identifier.

- **`closeHandler: () => void;`** The callback function to close the modal, received as a parameter from **addA11yEvents()**.

Returns `(e: Event) => void`. Accepts any event type (click or keyboard) so that **e.stopPropagation()** can be called to prevent bubbling.