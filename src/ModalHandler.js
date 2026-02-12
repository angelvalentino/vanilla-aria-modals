export default class ModalHandler {
  #eventsHandler;
  #activeModals;
  #focusHandler;
  #debug;
  #modalIdCounter

  constructor() {
    if (ModalHandler.instance) return ModalHandler.instance;
    ModalHandler.instance = this;
    this.#eventsHandler = {};
    this.#activeModals = [];
    this.#focusHandler = {};
    this.#debug = false;
    this.#modalIdCounter = 0;
  }

  setDebug(bool) {
    this.#debug = Boolean(bool);
    console.info(`[ModalHandler]: Debug mode ${this.#debug ? 'ON' : 'OFF'}`);
  }

  #isActiveModal(modalKey) {
    const modals = this.#activeModals;
    return modals.length && modals[modals.length - 1] === modalKey;
  }

  #registerModal(modalKey) {
    if (this.#activeModals.includes(modalKey)) {
      console.warn(`[ModalHandler]: Modal with key "${modalKey}" is already registered. Skipping.`);
      return false;
    }

    this.#activeModals.push(modalKey);

    if (this.#debug) {
      console.log(`[ModalHandler][DEBUG]: Register modal with key => "${modalKey}"`);
      console.log('[ModalHandler][DEBUG]: Active modal stack => ', this.#activeModals);
    }

    return true;
  }
  
  #unregisterModal(modalKey) {
    if (!this.#activeModals.includes(modalKey)) {
      console.warn(`[ModalHandler]: Modal with key "${modalKey}" was not registered. Nothing to remove.`);
      return false;
    }

    if (this.#debug) {
      console.log('[ModalHandler][DEBUG]: Active modal stack before filtering => ', this.#activeModals);
    }

    this.#activeModals = this.#activeModals.filter(key => key !== modalKey);

    if (this.#debug) {
      console.log(`[ModalHandler][DEBUG]: Unregister modal with key => "${modalKey}"`);
      console.log('[ModalHandler][DEBUG]: Active modal stack after filtering => ', this.#activeModals);
    }

    if (this.#activeModals.length === 0) {
      if (this.#debug) console.log('[ModalHandler][DEBUG]: Active modal stack is now empty.');
      this.resetKeys();
    }

    return true;
  }

  #trapFocus(e, element) {
    // Select all focusable elements within the given element
    const focusableLms = element.querySelectorAll(`
      a[href]:not([disabled]), 
      button:not([disabled]), 
      textarea:not([disabled]), 
      input:not([disabled]), 
      select:not([disabled]),
      [tabindex]:not([tabindex="-1"])
    `);
    // Get the first and last focusable elements
    const firstFocusableLm = focusableLms[0]; 
    const lastFocusableLm = focusableLms[focusableLms.length - 1];

    // Check if the Tab key was pressed
    const isTabPressed = (e.key === 'Tab');
    
    // Exit if the Tab key was not pressed
    if (!isTabPressed) { 
      return; 
    }

    if (e.shiftKey) /* shift + tab */ {
      if (document.activeElement === firstFocusableLm ) {
        // If 'Shift + Tab' is pressed and focus is on the first element, move focus to the last element
        lastFocusableLm.focus();
        e.preventDefault();
      }
    } 
    else /* tab */ {
      if (document.activeElement === lastFocusableLm) {
        // If Tab is pressed and focus is on the last element, move focus to the first element
        firstFocusableLm.focus();
        e.preventDefault();
      }
    }
  }

  #handleTrapFocus(modalLm) {
    return e => {
      this.#trapFocus(e, modalLm);
    }
  }

  #handleEscapeKeyClose(closeHandler) {
    return e => {
      if (e.key === 'Escape') {
        closeHandler(e);
      }
    }
  }

  #handleOutsideClickClose(closeHandler, modalLmOuterLimits, exemptLms = []) {
    return e => {
      const clickedLm = e.target;
      
      // Click was inside the modal
      if (modalLmOuterLimits.contains(clickedLm)) {
        return;
      } 

      // Click was outside the modal
      const isClickOnExempt = exemptLms.some(exemptEl => exemptEl?.contains(clickedLm));
      if (isClickOnExempt) {
        return;
      }

      closeHandler(e);
    }
  }

  #handleActiveModalClose(modalKey, closeHandler) {
    return () => {
      if (!this.#isActiveModal(modalKey)) return;

      if (this.#debug) {
        console.log(`[ModalHandler][DEBUG]: Close modal with key => "${modalKey}"`);
      }

      closeHandler(); // Only close if this is the topmost modal
    }
  }

  clearDocumentBodyEvents() {
    const documentBodyEvents = this.#eventsHandler.documentBody;

    if (documentBodyEvents) {
      if (this.#debug) {
        console.log('[ModalHandler][DEBUG]: Stored document body events before clearing => ', documentBodyEvents);
      }

      for (const key in documentBodyEvents) {
        const events = documentBodyEvents[key];

        events.forEach(({ eventName, callback, isOutsideClickHandler }) => {
          if (isOutsideClickHandler) {
            document.body.removeEventListener(eventName, callback, true);
          } 
          else {
            document.body.removeEventListener(eventName, callback);
          }
        });

        events.length = 0;
      }

      if (this.#debug) {
        console.log('[ModalHandler][DEBUG]: Stored document body events after clearing => ', documentBodyEvents);
      }
    } 
    else {
      if (this.#debug) {
        console.log('[ModalHandler][DEBUG]: No document body events were found to be cleared.');
      }
    }
  }

  clearActiveModals() {
    if (this.#debug) {
      console.log('[ModalHandler][DEBUG]: Active modal stack before clearing => ', this.#activeModals);
    }

    this.#activeModals.length = 0;

    if (this.#debug) {
      console.log('[ModalHandler][DEBUG]: Active modal stack after clearing => ', this.#activeModals);
    }
  }

  clearFocusRegistry() {
    if (this.#debug) {
      console.log('[ModalHandler][DEBUG]: Focus registry before clearing => ', this.#focusHandler);
    }

    for (const key in this.#focusHandler) {
      delete this.#focusHandler[key];
    }

    if (this.#debug) {
      console.log('[ModalHandler][DEBUG]: Focus registry after clearing => ', this.#focusHandler);
    }
  }

  reset() {
    this.clearDocumentBodyEvents();
    this.clearActiveModals();
    this.clearFocusRegistry();
    this.resetKeys();
  }

  generateKey(prefix = 'modal') {
    this.#modalIdCounter = (this.#modalIdCounter || 0) + 1;
    return `${prefix}-${this.#modalIdCounter}`;
  }

  resetKeys() {
    this.#modalIdCounter = 0;
  }

  rebindTrapFocus(modalKey) {
    const eventsHandler = this.#eventsHandler[modalKey];
    const trapFocusHandler = eventsHandler.find(hander => hander.isTrapFocusHandler === true);
    const { lm, eventName, callback } = trapFocusHandler;

    lm.removeEventListener(eventName, callback);
    lm.addEventListener(eventName, callback);
  }

  addA11yEvents({
    modalKey,
    modalLm = null, 
    modalLmOuterLimits = null,
    closeLms = null, 
    exemptLms = [],
    closeHandler
  }) {
    // Register modal key and skip if already registered
    const isNew = this.#registerModal(modalKey);
    if (!isNew) return;

    // Register event handlers reference
    const handleActiveModalClose = this.#handleActiveModalClose(modalKey, closeHandler);
    const escapeKeyHandler = this.#handleEscapeKeyClose(handleActiveModalClose);

    // Ensure storage for this modal exists
    if (!this.#eventsHandler[modalKey]) this.#eventsHandler[modalKey] = [];
    if (!this.#eventsHandler.documentBody) this.#eventsHandler.documentBody = {};
    if (!this.#eventsHandler.documentBody[modalKey]) this.#eventsHandler.documentBody[modalKey] = [];
    
    const eventsHandler = this.#eventsHandler[modalKey];
    const documentEvents = this.#eventsHandler.documentBody[modalKey];

    // Attach event listeners
    document.body.addEventListener('keydown', escapeKeyHandler);
    eventsHandler.push({ eventName: 'keydown', callback: escapeKeyHandler });
    // Keep references to body events for SPA view changes,
    // so lingering events can be removed if the modal stays open across re-renders
    documentEvents.push({ eventName: 'keydown', callback: escapeKeyHandler });
    
    if (modalLmOuterLimits) {
      const outsideClickHandler = this.#handleOutsideClickClose(handleActiveModalClose, modalLmOuterLimits, exemptLms);

      // Use capture phase to detect outside clicks before event bubbling, 
      // preventing auto-close on overlay click after modal opens
      document.body.addEventListener('click', outsideClickHandler, true); 
      eventsHandler.push({ eventName: 'click', callback: outsideClickHandler, isOutsideClickHandler: true });
      // Keep references to body events for SPA view changes
      documentEvents.push({ eventName: 'click', callback: outsideClickHandler, isOutsideClickHandler: true });
    }
    if (modalLm) {
      const trapFocusHandler = this.#handleTrapFocus(modalLm);
      
      modalLm.addEventListener('keydown', trapFocusHandler);
      eventsHandler.push({ lm: modalLm, eventName: 'keydown', callback: trapFocusHandler, isTrapFocusHandler: true });
    }
    if (closeLms && Array.isArray(closeLms)) {
      closeLms.forEach(closeLm => {
        closeLm.addEventListener('click', handleActiveModalClose);
      });
      eventsHandler.push({ lm: closeLms, eventName: 'click', callback: handleActiveModalClose });
    }
  }

  removeA11yEvents({
    modalKey
  }) {
    // Unregister modal key and skip if it wasn't registered
    const isRegistered = this.#unregisterModal(modalKey);
    if (!isRegistered) return;

    const eventsHandler = this.#eventsHandler[modalKey];

    // Event clean up
    eventsHandler.forEach(({ lm, eventName, callback, isOutsideClickHandler }) => {
      // if lm is undefined we just have to clear the body
      if (lm === undefined) lm = document.body;

      // Check for array of closing lms
      if (Array.isArray(lm)) {
        const lms = lm;

        lms.forEach(lm => {
          lm.removeEventListener(eventName, callback);
        });
      } 
      else {
        if (isOutsideClickHandler) {
          lm.removeEventListener(eventName, callback, true);
        } 
        else {
          lm.removeEventListener(eventName, callback);
        }
      }
    });
    
    // Clean up stored handlers
    this.#eventsHandler[modalKey].length = 0; // empties the array to remove any lingering references
    delete this.#eventsHandler[modalKey]; // removes the property entirely from the eventsHandler object
    const documentEvents = this.#eventsHandler.documentBody[modalKey];
    documentEvents.length = 0;
  }

  addFocus({
    modalKey, 
    firstFocusableLm, 
    lastFocusedLm = null, 
    auto = true
  }) {
    if (auto && Object.hasOwn(this.#focusHandler, modalKey)) {
      console.warn(`[ModalHandler]: Duplicate focus registration for modal "${modalKey}"`);
      return;
    }

    const lastFocusableLm = lastFocusedLm ? lastFocusedLm : document.activeElement;
    if (auto) this.#focusHandler[modalKey] = lastFocusableLm;

    // Needs a timeout for keyboard navigation, if not focus is unreliable
    setTimeout(() => {
      firstFocusableLm.focus();
    });

    if (!auto) return lastFocusableLm;
  }

  restoreFocus({
    modalKey, 
    lastFocusedLm = null, 
    auto = true
  }) {
    if (auto && !Object.hasOwn(this.#focusHandler, modalKey)) {
      console.warn(`[ModalHandler]: No stored focus for modal "${modalKey}" to restore.`);
      return;
    }

    const lastFocusableLm = auto ? this.#focusHandler[modalKey] : lastFocusedLm;
    lastFocusableLm.focus();

    // Clean up the stored focus
    if (auto) {
      delete this.#focusHandler[modalKey];
    }
  }
}