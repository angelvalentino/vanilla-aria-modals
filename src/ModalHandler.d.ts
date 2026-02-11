export default class ModalHandler {
    constructor();

    setDebug(bool: boolean): void;

    clearDocumentBodyEvents(): void;

    clearActiveModals(): void;

    clearFocusRegistry(): void;

    reset(): void;

    generateKey(prefix?: string): string;

    resetKeys(): void;

    addA11yEvents(options: {
      modalKey: string;
      modalLm?: HTMLElement | null;
      modalLmOuterLimits?: HTMLElement | null;
      closeLms?: HTMLElement[] | null;
      exemptLms?: HTMLElement[];
      closeHandler: () => void;
    }): void;

    removeA11yEvents(options: {
      modalKey: string;
      modalLm?: HTMLElement | null;
      closeLms?: HTMLElement[] | null;
    }): void;

    addFocus(options: {
      modalKey: string;
      firstFocusableLm: HTMLElement;
      lastFocusedLm?: HTMLElement | null;
      auto?: boolean;
    }): HTMLElement | void;

    restoreFocus(options: {
      modalKey: string;
      lastFocusedLm?: HTMLElement | null;
      auto?: boolean;
    }): void;
  }