export default class ModalHandler {
  #eventsHandler;
  #activeModals;
  #focusHandler;
  #debug

  constructor() {
    if (ModalHandler.instance) return ModalHandler.instance;
    ModalHandler.instance = this;
    this.#eventsHandler = {};
    this.#activeModals = [];
    this.#focusHandler = {};
    this.#debug = false;
  }

  setDebug(bool) {
    this.#debug = Boolean(bool);
    console.info(`[ModalHandler]: Debug mode ${this.#debug ? 'ON' : 'OFF'}`);
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

  #registerModal(modalKey) {
    if (this.#activeModals.includes(modalKey)) {
      console.warn(`[ModalHandler]: Modal with key "${modalKey}" is already registered. Skipping.`);
      return false;
    }

    this.#activeModals.push(modalKey);

    if (this.#debug) {
      console.warn(`[ModalHandler][DEBUG]: Register modal with key => "${modalKey}"`);
      console.warn('[ModalHandler][DEBUG]: Active modal stack => ', this.#activeModals);
    }

    return true;
  }
  
  #unregisterModal(modalKey) {
    if (!this.#activeModals.includes(modalKey)) {
      console.warn(`[ModalHandler]: Modal with key "${modalKey}" was not registered. Nothing to remove.`);
      return false;
    }

    if (this.#debug) {
      console.warn('[ModalHandler][DEBUG]: Active modal stack before filtering => ', this.#activeModals);
    }

    this.#activeModals = this.#activeModals.filter(key => key !== modalKey);

    if (this.#debug) {
      console.warn(`[ModalHandler][DEBUG]: Unregister modal with key => "${modalKey}"`);
      console.warn('[ModalHandler][DEBUG]: Active modal stack after filtering => ', this.#activeModals);
    }

    return true;
  }
  
  #isActiveModal(modalKey) {
    const modals = this.#activeModals;
    return modals.length && modals[modals.length - 1] === modalKey;
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
    return e => {
      e.stopPropagation();
      if (!this.#isActiveModal(modalKey)) return;

      if (this.#debug) {
        console.warn(`[ModalHandler][DEBUG]: Close modal with key => "${modalKey}"`);
      }

      closeHandler(); // Only close if this is the topmost modal
    }
  }

  clearDocumentBodyEvents() {
    const documentBodyEvents = this.#eventsHandler.documentBody;

    if (documentBodyEvents) {
      for (const key in documentBodyEvents) {
        const events = documentBodyEvents[key];

        events.forEach(eventHandler => {
          document.body.removeEventListener(eventHandler.eventName, eventHandler.callback);
        });

        events.length = 0;
      }
    }
  }

  clearActiveModals() {
    this.#activeModals.length = 0;
  }

  reset() {
    this.clearDocumentBodyEvents();
    this.clearActiveModals();
  }

  addA11yEvents({
    modalKey,
    modalLm = null, 
    modalLmOuterLimits = null,
    closeLms = null, 
    exemptLms = [],
    closeHandler
  }) {
    // Extra guard to protect against event bubbling after modal open
    setTimeout(() => {
      // Register modal key and skip if already registered
      const isNew = this.#registerModal(modalKey);
      if (!isNew) return;

      // Register event handlers reference
      const handleActiveModalClose = this.#handleActiveModalClose(modalKey, closeHandler);
      const escapeKeyHandler = this.#handleEscapeKeyClose(handleActiveModalClose);
      const outsideClickHandler = this.#handleOutsideClickClose(handleActiveModalClose, modalLmOuterLimits, exemptLms);
      const trapFocusHandler = this.#handleTrapFocus(modalLm);

      // Attach event listeners
      document.body.addEventListener('keydown', escapeKeyHandler);
      
      if (modalLmOuterLimits) {
        document.body.addEventListener('click', outsideClickHandler)
      }
      if (modalLm) {
        modalLm.addEventListener('keydown', trapFocusHandler)
      }
      if (closeLms && Array.isArray(closeLms)) {
        closeLms.forEach(closeLm => {
          closeLm.addEventListener('click', handleActiveModalClose);
        });
      }
      
      // Ensure eventsHandler object exists for this modal
      if (!this.#eventsHandler[modalKey]) {
        this.#eventsHandler[modalKey] = {};
      }
      const eventsHandler = this.#eventsHandler[modalKey];

      // Ensure the documentBody object and array exist for this modal key
      if (!this.#eventsHandler.documentBody) {
        this.#eventsHandler.documentBody = {};
      }
      if (!this.#eventsHandler.documentBody[modalKey]) {
        this.#eventsHandler.documentBody[modalKey] = [];
      }
      const documentEvents = this.#eventsHandler.documentBody[modalKey];

      // Store event handlers references so they can be removed later
      eventsHandler.escapeKeyHandler = escapeKeyHandler;
      modalLmOuterLimits && (eventsHandler.outsideClickHandler = outsideClickHandler);
      modalLm && (eventsHandler.trapFocusHandler = trapFocusHandler);
      closeLms && (eventsHandler.closeHandler = handleActiveModalClose);

      // Keep references to body events for SPA view changes,
      // so lingering events can be removed if the modal stays open across re-renders
      documentEvents.push({ eventName: 'keydown', callback: escapeKeyHandler });
      if (modalLmOuterLimits) {
        documentEvents.push({ eventName: 'click', callback: outsideClickHandler });
      }
    });
  }

  removeA11yEvents({
    modalKey,
    modalLm = null, 
    closeLms = null
  }) {
    // Unregister modal key and skip if it wasn't registered
    const isRegistered = this.#unregisterModal(modalKey);
    if (!isRegistered) return;

    const eventsHandler = this.#eventsHandler[modalKey];

    // Remove event listeners from elements
    document.body.removeEventListener('keydown', eventsHandler.escapeKeyHandler);
    
    if (eventsHandler.outsideClickHandler) {
      document.body.removeEventListener('click', eventsHandler.outsideClickHandler);
    }
    if (modalLm) {
      modalLm.removeEventListener('keydown', eventsHandler.trapFocusHandler);
    }
    if (closeLms && Array.isArray(closeLms)) {
      closeLms.forEach(closeLm => {
        closeLm.removeEventListener('click', eventsHandler.closeHandler);
      });
    }
    
    // Clean up stored handlers
    delete this.#eventsHandler[modalKey]; 
    const documentEvents = this.#eventsHandler.documentBody[modalKey];
    documentEvents.length = 0;
  }

  addFocus({
    modalKey, 
    firstFocusableLm, 
    lastFocusedLm = null, 
    auto = true
  }) {
    if (Object.hasOwn(this.#focusHandler, modalKey)) {
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
    if (!Object.hasOwn(this.#focusHandler, modalKey)) {
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