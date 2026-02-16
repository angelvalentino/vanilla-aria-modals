# ModalHandler Architecture

## Introduction

This document describes the internal architecture of `ModalHandler`, including private methods, data structures, and the overall logic flow. It is intended for developers who want to understand the inner workings of the class, customize it, or troubleshoot advanced issues.  

> **Note:** This document does not replace reading the actual code. Many internal behaviors rely on private methods and closures, which are essential to understand before making any modifications. 
💾 Modifications to the public API of the class should be accompanied by updates to the corresponding **.d.ts** file to ensure accurate IntelliSense.

`ModalHandler` handles modal stacking, focus management, A11y event registration and restoration. Internally, it uses private properties and methods to manage:  

- Event handlers for body and modal elements to keep track of function references
- Active modal stack to close only the current modal or let overlayless modals bypass stack order
- Modular focus tracking and restoration  
- Debug logging  

Understanding the flow of modal registration, event attachment, and focus handling is key to modifying or extending the class safely.

> **Note:** The **closeHandler** receives both the original **DOM event** and the associated **modalKey** automatically. The caller can use these to inspect the event or determine which modal triggered the close.


<br>

## Logic Flow Overview

The lifecycle of a modal in `ModalHandler` can be summarized as follows. The utility provides a `generateKey()` method for cases where the caller does not want to create a manual key each time. See the [example reference](../example/example.js) for actual usage.

### (1) Adding Focus

**Public method:** `addFocus()`

#### Logic flow


- Check if `auto` is **true**:
  - If **true**, verify `modalKey` is not in the focus registry; log a warning and stop on duplicates.
  - If **false**, skip registry validation.  

- Use the caller-provided element for active focus if given; otherwise, use `document.activeElement`.  

- If `auto` is **true**, store the active element (caller-provided or `document.activeElement`) with the `modalKey`; if **false**, return it for manual management.

- Apply a short timeout before focusing the first focusable element to ensure the DOM is fully rendered.


### (2) **Adding Events**

**Public method:** `addA11yEvents()`

#### Logic flow

- `#registerModal()` registers the modal key in the active modal stack. If the key is already present, a warning is logged and execution stops.

- `#handleActiveModalClose()` wraps the provided `closeHandler` to ensure that only the topmost modal in the stack can be closed. It also accounts for edge cases such as overlayless modals (popups). In those cases, stack enforcement is ignored only for click events.

- `#handleEscapeKeyClose()` creates the Escape key handler. This listener is always attached because Escape-based closing is essential for accessibility and minimum ARIA compliance. the handler reference is stored for cleanup.

After this initial setup, conditional logic attaches additional listeners based on the provided options:

- If `modalLmOuterLimits` is not provided, we keep track of the modal with its respective `modalKey` in the internal `#popups` array for overlayless modals.

- If `modalLmOuterLimits` is provided, a click listener is added to detect clicks outside the specified element and close the modal. The handler reference is stored for cleanup.  
  - Attached with **capture: true** so it triggers during the capture phase rather than bubbling. This approach avoids relying on timing or asynchronous workarounds, such as using timeouts or stopping propagation, and provides the most reliable behavior.

- If `modalLm` is **true**, a focus trap handler is attached to enforce focus management within the modal. The handler reference is stored for removal.
- If `closeLms` are provided, the given `closeHandler`, wrapped with `#handleActiveModalClose()`, is attached to those elements. The handler references are stored internally so they can be removed during cleanup.


Event listeners are attached to `document.body` and relevant modal elements as required. Only the Escape key listener is mandatory. All other listeners are optional, allowing flexible usage of the class.

All handler references are stored internally under the corresponding `modalKey`. Document body handlers are tracked separately as well to ensure proper cleanup during SPA route changes, re-renders, or when `reset()` is called.

### (3) Restoring Focus

**Public method:** `restoreFocus()`

#### Logic flow

- The method checks whether `auto` is **true**.  
  - If **true**, it attempts to retrieve the previously stored focus reference from the internal registry using the provided `modalKey`. If no reference is found, a warning is logged.
  - If **false**, the method expects a user-provided element to restore focus manually.

- Focus is restored.

- When `auto` is **true**, the stored focus reference is removed from the registry.

### (4) Event Cleanup

**Public method:** `removeA11yEvents()`

#### Logic flow

- Checks if the modal to be removed is overlayless; if so, it sets the `isOverlayLess` flag to **true**.

- Calls `#unregisterModal()` to unregister the respective `modalKey`. If the key is not present, a warning is logged and execution stops. We also check for overlayless modals in case we need to ignore stack order, but only for click events. Keep in mind that overlayless modals triggered by a click are checked inside `#handleActiveModalClose`, ensuring this behavior only occurs in that context. Otherwise, normal stack order is followed, and the modal is unregistered as usual.

- All event listeners associated with the modal are removed, including the **Escape** key handler, **outside click** handler, **close button** handlers, and **focus trap**. Because these listeners are optional, only those that were previously registered are removed.

- All internal references related to the modal are cleared, and the stored automatic key value is reset to ensure complete cleanup.


### SPA or Dynamic Content Cleanup

**Public method:** `reset()`

#### Logic flow

- Clears all **document body** event listeners, resets the **active modal stack**, clears the **focus registry**, resets the automatic **modal ID counter** and clears the **overlayless modals registry**.

- This is especially important in SPA environments where **document body** does not re-render between views and lingering event listeners could accumulate.

- The individual cleanup methods `clearDocumentBodyEvents()`, `clearActiveModals()`, `clearFocusRegistry()`, `resetKeys()`, and `clearPopups()` can also be called separately when finer control is needed.

<br>

## Private Properties

### Debug

`#debug` stores a boolean to toggle verbose logging, useful for reviewing stack management, class resets, and which modal is being closed.

```js
#debug = true; // Enables debug logging
#debug = false; // Disables debug logging
```

Managed by: **setDebug()**

### Event Storage

`#eventsHandler` stores all event references to enable proper removal on modal close or SPA route changes.

```js
#eventsHandler = {
  modalKey: [
    {
      lm: HTMLElement, // Optional. If not provided, defaults to document.body
      eventName: 'click'/'keydown',
      callback: closeHandler(),
      isOutsideClickHandler: true/false // Flag used to pass (capture: true) only for the outside-click handler, at cleanup for removal
      isTrapFocusHandler: true/false // Used in rebindTrapFocus() logic to locate the specific event handler based on the provided modal key
    },
    ...
  ],
  documentBody: {
    modalKey: [
      { eventName: 'keydown', callback: escapeKeyHandler },
      { eventName: 'click', callback: outsideClickHandler }
    ]
  }
}
```

- Managed by: **addA11yEvents()**, **removeA11yEvents()**, **clearDocumentBodyEvents()**
- Indirectly affected by: **reset()** 

### Focus Handler
`#focusHandler` stores the last focused element for each modal, allowing focus to be restored when the modal closes.

```js
#focusHandler = {
  modalKey: lastFocusedLmBeforeModal,
  ...
}
```

- Managed by: **addFocus()**, **restoreFocus()**, **clearFocusRegistry()**
- Indirectly affected by: **reset()**

### Active Modals
`#activeModals` tracks the stack of currently active modal keys. The topmost modal is the last item in the array.

```js
#activeModals = [...modalkeys];
```

- Tracked by: **#isActiveModal()**
- Managed by: **#registerModal()**, **#unregisterModal()**, **clearActiveModals()**  
- Indirectly affected by: **reset()**

### ID Counter
`#modalIdCounter` tracks the current number of active modals in stack.

```js
#modalIdCounter = 0; // Initial value
this.#modalIdCounter++; // Increments when a new modal ID key is added
```

- Managed by: **generateKey()**, **resetKeys()** 
- Indirectly affected by: **reset()**

### Overlayless Modals Registry
`#popups` tracks the current number of active overlayless modals (popups).

```js
#popups = [...modalkeys];
```

- Managed by: **clearPopups()**
- Indirectly affected by: **reset()**

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
- **`isOverlayLess: boolean;`** Whether the modal to unregister is overlayless. If so, it ignores stack order.

Returns `boolean`. **true** if the modal was removed, **false** if the key did not exist.

### #trapFocus()
Traps keyboard focus inside the modal, handling **Tab** and **Shift+Tab** navigation.

#### Parameters

- **`e: KeyboardEvent;`** The keyboard event object.
- **`element: HTMLElement;`** The modal element in which focus should be trapped.

Returns `void`

### #handleTrapFocus()
Returns a callback for focus trapping on a modal element.

#### Parameters

- **`modalLm: HTMLElement;`** The modal element where focus should be trapped.

Returns `(e: KeyboardEvent) => void`

### #handleEscapeKeyClose()
Returns a callback that closes the modal when the **Escape** key is pressed.

#### Parameters
- **`modalKey: string;`** The unique modal identifier, passed automatically to the `closeHandler`.  
- **`closeHandler: (e: Event) => void;`** Active modal close handler. Receives the event to pass it back to the `closeHandler`. Should be the callback returned from **#handleActiveModalClose()**.

Returns `(e: KeyboardEvent) => void`

### #handleOutsideClickClose()
Returns a callback that closes the modal if a click occurs outside **modalLmOuterLimits**, excluding any **exemptLms**.

#### Parameters

- **`modalKey: string;`** The unique modal identifier, passed automatically to the `closeHandler`.  
- **`closeHandler: (e: Event) => void;`** Active modal close handler. Receives the event to pass it back to the `closeHandler`. Should be calling the callback returned from **handleActiveModalClose()**.
- **`modalLmOuterLimits: HTMLElement;`** The container that defines the modal boundary. Used to detect clicks outside the modal. 
- **`exemptLms?: HTMLElement[];`** *(optional)* Array of elements that should not trigger closing even if clicked outside.

Returns `(e: MouseEvent) => void`

### #handleActiveModalClose()
Wraps `closeHandler` so only the topmost modal can close. For overlayless modals (popups), stack checks are ignored for clicks inside the modal. The modal is unregistered on valid close; if the modal key is not in the registry, the method returns without calling `closeHandler`.

#### Parameters

- **`modalKey: string;`** The unique modal identifier, passed automatically to the `closeHandler`.  
- **`closeHandler: () => void;`** The callback function to close the modal, received as a parameter from **addA11yEvents()**.
- **`modalLmOuterLimits: HTMLElement;`** The container defining the modal’s boundary. Used to detect overlayless modals (popups) so stacking order can be ignored.

Returns `(e: Event) => void`. Accepts any event type (click or keyboard).