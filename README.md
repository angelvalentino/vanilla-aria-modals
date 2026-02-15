# ModalHandler

See the full release history and updates in the [Changelog](https://github.com/angelvalentino/vanilla-aria-modals/blob/main/CHANGELOG.md).

## Introduction


`ModalHandler` is a framework-agnostic utility for managing accessibility (A11y) events in modals or modal-like UIs within your web application. It supports modal stacking and key accessibility features, including focus trapping, focus management, and closing modals with the Escape key or an outside click.

Although designed primarily for modal interactions, it can be used in any UI logic that requires basic ARIA support and focus management.

It supports a dynamic number of modals and events. In SPAs or dynamic interfaces, navigating away or re-rendering a component without closing a modal can leave lingering event listeners on `document.body`, which may interfere with future interactions. A reset method is provided to call on route changes or component unmounts. See more at: [SPA / Advanced Usage](#spa--advanced-usage)

`ModalHandler` is written in vanilla JS for full flexibility. You can modify it directly in `node_modules` if needed. Just update the `.d.ts` file when changing public methods to keep IntelliSense accurate. Internals documentation, such as architecture and logic flow can be found [here](https://github.com/angelvalentino/vanilla-aria-modals/blob/main/docs/architecture.md).

## Set up

```js
import ModalHandler from 'vanilla-aria-modals';
const modalHandler = new ModalHandler();
```

`ModalHandler` is a singleton, so creating multiple instances returns the same object.

TypeScript types are used in the **docs** and in the **.d.ts** file to indicate the intended type and optionality of parameters, even though the class is fully vanilla JavaScript. This makes it easier to use, manage, and understand, without requiring any compiler.

<br>

## Usage

A fully detailed example including the necessary JavaScript, HTML, and CSS files, can be found [here](https://github.com/angelvalentino/vanilla-aria-modals/tree/main/example).

> **Note:** The **closeHandler** receives both the original **DOM event** and the associated **modalKey** automatically. The caller can use these to inspect the event or determine which modal triggered the close.

**Note:** `lm` in the code stands for *HTMLElement*.

```js
// Basic example of showing a modal
showModal() {
  modalContainerLm.style.display = 'block';
}

// Basic example of hiding a modal
hideModal() {
  modalContainerLm.style.display = 'none';
}

openModal() {
  // Generate a key or use your own
  const modalKey = modalHandler.generateKey();

  const closeModal = () => {
    hideModal();
    // ...Your hide UI logic

    // Restore focus
    modalHandler.restoreFocus({ modalKey: modalKey });
    // Remove ARIA events added
    modalHandler.removeA11yEvents({ modalKey: modalKey });
  }

  showModal();
  // ...Your show UI logic

  // Add focus
  modalHandler.addFocus({
    modalKey: modalKey,
    firstFocusableLm: modalFirstFocusableLm
  });
  // Add ARIA events 
  modalHandler.addA11yEvents({
    modalKey: modalKey,
    modalLm: modalContentLm,
    modalLmOuterLimits: modalContentLm,
    closeLms: [...modalCloseBtns],
    closeHandler: closeModal
  });
}

const openModalBtn = document.getElementById('open-modal-btn');
openModalBtn.addEventListener('click', openModal);
```

<br>

## SPA / Advanced Usage

In Single Page Applications (SPA) or frameworks like React, Vue, or vanilla JS with dynamic content, modals may persist across view changes. To prevent lingering events or broken focus, `ModalHandler` provides cleanup methods.

### Example: Cleanup on route change or component unmount

```js
// Suppose your SPA route or component changes
function onRouteChange() {
  // Clear leftover document events, active modals, focus tracking and modal ID key counter
  modalHandler.reset();

  // Or individually:
  // modalHandler.clearDocumentBodyEvents();
  // modalHandler.clearActiveModals();
  // modalHandler.clearFocusRegistry();
  // modalHandler.resetKeys();
}
```
<br>

## Public API Methods

### setDebug()
Enables or disables debug logs, aimed for reviewing stacked modals, clear and close logic.

#### Parameters
- **`bool: boolean;`** **true** enables debug mode, **false** disables it.

Returns `void`

### addA11yEvents()
Registers ARIA events and modal stacking handling:
- Close at overlay click
- Close at ESC key
- Trap focus
- Modal stacking

#### Parameters
**Takes parameters as a single object, which are destructured inside the method.**

- **`modalKey: string;`** Unique modal identifier. Used for stacking and event management.
- **`modalLm?: HTMLElement | null;`** *(optional)* The main modal element. Used to trap focus inside the modal.
- **`modalLmOuterLimits?: HTMLElement | null;`** *(optional)* The container that defines the modal boundary. Used to detect clicks outside the modal. **modalLm** is usually used here, but depending on the UI we may not want to trap focus into the same container we want to close, maybe just in a part of it.
- **`closeLms?: HTMLElement[] | null;`** *(optional)* Array of elements that should trigger closing the modal (e.g., close buttons).
- **`exemptLms?: HTMLElement[];`** *(optional)* Array of elements that should not trigger closing even if clicked outside.
- **`closeHandler: (e: Event, modalKey: string) => void;`** Function to call when the modal should close. Usually should call **removeA11yEvents()**. Automatically receives the event **(e)** and **(modalKey)** from the wrapper; no need to pass as arguments. It’s up to the caller whether to use them.
If you need to pass additional arguments to the close handler, you can wrap it in a function that returns a handler accepting only the two parameters (`e` and `modalKey`):
  
  ```js
  const closeModalWrapper = (...args) => {
    // Returns a handler that the utility calls internally with e and modalKey
    return (e, modalKey) => {
      // Your logic for the close handler here 
      // Access to parameters thanks to closures
    }
  }

  modalHandler.addA11yEvents({
    closeHandler: closeModalWrapper(...args)
  });
  ```

Returns `void`

### removeA11yEvents()

Removes all accessibility and interaction event listeners for the specific registered modal.

#### Parameters
**Takes parameters as a single object, which are destructured inside the method.**

- **`modalKey: string;`** Unique modal identifier. Must match the modalKey used in **addA11yEvents()**.
- **`isToggle?: boolean;`** Optional flag to indicate that the modal (no overlay, usually popups with toggle logic) is being closed via a toggle action (outside of the usual close handler). Setting this flag to **true** ensures the modal is properly removed from the active stack, even when called outside of any closing handler.

Returns `void`

### addFocus()

Focuses a specific element inside a modal. If `auto` is **true**, the class automatically stores the last active element and manages its restoration later. If `auto` is **false**, the method returns the last active element so the user can handle it manually.

#### Parameters
**Takes parameters as a single object, which are destructured inside the method.**

- **`modalKey: string;`** Unique modal identifier.
- **`firstFocusableLm: HTMLElement;`** Element to receive focus.
- **`lastFocusedLm?: HTMLElement | null;`** *(optional)* Stores a custom element as the last focused. Defaults to **document.activeElement**.
- **`auto?: boolean;`** *(optional)* Defaults to **true**. If **false**, focus is returned but not stored for restoration. Can be used with truthy or falsy values as well.

Returns `HTMLElement | void`

### restoreFocus()
Restores focus to the element that was active before the modal opened.

#### Parameters
**Takes parameters as a single object, which are destructured inside the method.**

- **`modalKey: string;`** Unique modal identifier.
- **`lastFocusedLm?: HTMLElement | null;`** *(optional)* Custom element to restore focus to if auto is **false**.
- **`auto?: boolean;`** *(optional)* Defaults to **true**. If **false**, uses lastFocusedLm to restore focus instead of the stored one.

Returns `void`

### clearDocumentBodyEvents()
Clears any leftover document body event listeners.

Returns `void`

### clearActiveModals()
Resets the active modal stack.

Returns `void`

### clearFocusRegistry()
Clears stored focus references.

Returns `void`

### reset()
Combines **clearDocumentBodyEvents()**, **clearActiveModals()**, **clearFocusRegistry()** for a full cleanup.

Returns `void`

### generateKey()
Generates a unique identifier for the modal.

- **`prefix?: string;`** Optional prefix to modify the generated modal key.

Returns `string`. The generated modal key to be used later in the code.

### resetKeys()

Resets the internal modal key counter back to 0.

Returns `void`

### rebindTrapFocus()

Re-attaches the focus-trapping event listener for a specific modal. The internal **trapFocus** method already queries the DOM on each keyboard event, so in most cases, manually rebinding is not necessary.

- **`modalKey: string;`** The unique key of the modal whose focus trap should be rebound.

returns `void`