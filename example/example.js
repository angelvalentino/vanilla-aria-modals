// Import and instantiate modal handler class
import ModalHandler from "../src/ModalHandler.js";
const modalHandler = new ModalHandler();
modalHandler.setDebug(true);

// First modal close timeout ID
let firstModalCloseTimId;

// First modal DOM references
const firstModalContainerLm = document.getElementById('first-modal');
const firstModalContentLm = document.getElementById('first-modal__content');
const firstModalOverlayLm = document.getElementById('first-modal__overlay');
const firstModalCloseBtns = [...firstModalContentLm.querySelectorAll('.close-first-modal-btn')];
const firstModalFocusableLm = document.getElementById('first-modal__close-btn');
const firstModalAcceptBtn = document.getElementById('first-modal__accept-btn');
const firstModalToggleBtn = document.getElementById('first-modal__toggle-btn');

// Second modal close timeout ID
let secondModalCLoseTimId;

// Second modal DOM references
const secondModalContainerLm = document.getElementById('second-modal');
const secondModalContentLm = document.getElementById('second-modal__content');
const secondModalOverlayLm = document.getElementById('second-modal__overlay');
const secondModalCloseBtns = [...secondModalContentLm.querySelectorAll('.close-second-modal-btn')];
const secondModalFocusableLm = document.getElementById('second-modal__close-btn');

// Popup bottom margin variable
let lastPopupBottom = 40;

// Rusable show UI modal function
function showModal({
  modalContainerLm,
  modalContentLm,
  modalOverlayLm, 
  firstFocusableLm, 
  closeModalTimId, 
  modalKey
}) {
  clearTimeout(closeModalTimId);
  
  document.body.style.overflow = 'hidden';
  modalContainerLm.style.display = 'flex';

  modalHandler.addFocus({
    modalKey: modalKey,
    firstFocusableLm: firstFocusableLm
  });
 
  // Timeout is needed to properly play animations after changing the element's display
  // Also, managing opacity separately seems to give a smoother transition
  setTimeout(() => {
    modalContentLm.style.transform = 'scale(1)';
    modalContentLm.style.opacity = 1;
    modalOverlayLm.style.opacity = 1;
  });
}

// Rusable hide UI modal function
function hideModal({
  modalContainerLm, 
  modalContentLm, 
  modalOverlayLm, 
  modalKey
}) {
  document.body.style.overflow = '';
  modalContentLm.style.transform = 'scale(0)';
  modalOverlayLm.style.opacity = 0;
  modalContentLm.style.opacity = 0;

  const closeModalTimId = setTimeout(() => {
    modalContainerLm.style.display = 'none';
    modalHandler.restoreFocus({ modalKey: modalKey })
  }, 250);

  return closeModalTimId;
}

function openFirstModal() {
  const modalKey = modalHandler.generateKey();

  const toggleDisabled = e => {
    const disabledBtn = e.target.nextElementSibling;
    disabledBtn.disabled = !disabledBtn.disabled;
    disabledBtn.textContent = disabledBtn.disabled ? 'Disabled...' : 'Enabled!';
  }

  const closeFirstModal = () => {
    // Hide modal and store the close timeout id to able to clear it if needed
    firstModalCloseTimId = hideModal({
      modalContainerLm: firstModalContainerLm, 
      modalContentLm: firstModalContentLm, 
      modalOverlayLm: firstModalOverlayLm, 
      modalKey: modalKey
    });

    // Remove open additional modal event
    firstModalAcceptBtn.removeEventListener('click', openSecondModal);

    // Remove toggle disabled btn logic
    firstModalToggleBtn.removeEventListener('click', toggleDisabled);

    // Remove ARIA event listeners
    modalHandler.removeA11yEvents({ modalKey: modalKey });
  }

  // Show modal
  showModal({
    modalContainerLm: firstModalContainerLm, 
    modalContentLm: firstModalContentLm,
    modalOverlayLm: firstModalOverlayLm,
    firstFocusableLm: firstModalFocusableLm,
    closeModalTimId: firstModalCloseTimId, 
    modalKey: modalKey
  });

  // Add open additional modal event
  firstModalAcceptBtn.addEventListener('click', openSecondModal);

  // Add toggle disabled btn logic
  firstModalToggleBtn.addEventListener('click', toggleDisabled);

  // Add ARIA event listeners
  modalHandler.addA11yEvents({
    modalKey: modalKey,
    modalLm: firstModalContentLm,
    modalLmOuterLimits: firstModalContentLm,
    closeLms: firstModalCloseBtns,
    closeHandler: closeFirstModal
  });
}

function openSecondModal() {
  const modalKey = modalHandler.generateKey();

  const closeSecondModal = () => {
    // Hide modal and store the close timeout id to able to clear it if needed
    secondModalCLoseTimId = hideModal({
      modalContainerLm: secondModalContainerLm, 
      modalContentLm: secondModalContentLm, 
      modalOverlayLm: secondModalOverlayLm,
      modalKey: modalKey
    });

    // Remove ARIA event listeners
    modalHandler.removeA11yEvents({ modalKey: modalKey });
  }

  // Show modal
  showModal({
    modalContainerLm: secondModalContainerLm, 
    modalContentLm: secondModalContentLm,
    modalOverlayLm: secondModalOverlayLm, 
    firstFocusableLm: secondModalFocusableLm, 
    closeModalTimId: secondModalCLoseTimId, 
    modalKey: modalKey
  });

  // Add ARIA event listeners
  modalHandler.addA11yEvents({
    modalKey: modalKey,
    modalLm: secondModalContentLm,
    modalLmOuterLimits: secondModalContentLm,
    closeLms: secondModalCloseBtns,
    closeHandler: closeSecondModal
  });
}

function generatePopup(className) {
  const modalHTML = `
    <div id="${className}" class="${className} popup">
      <div class="${className}__content popup__content">
        <button title="Close modal" aria-label="Close modal." id="${className}__close-btn" class="${className}__close-btn popup__close-btn">
          <svg aria-hidden="true" focusable="false" role="presentation" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z" />
          </svg>
        </button>
      <p class="${className}__text popup__text">I am a just a pop up with no overlay!</p>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", modalHTML);

  const popupLm = document.getElementById(className);
  
  const closePopup = () => {
    popupLm.classList.remove("active");
    modalHandler.removeA11yEvents({ modalKey: className });
  };

  // Set the bottom based on last popup
  popupLm.style.bottom = lastPopupBottom + "px";

  // Update lastPopupBottom for next popup
  lastPopupBottom += popupLm.offsetHeight + 10; // 

  // Now generate a button for this popup
  const main = document.querySelector("main");
  const popupBtn = document.createElement("button");
  popupBtn.textContent = `toggle ${className}`;
  popupBtn.className = "open-popup-btn";

  const closeBtn = document.getElementById(`${className}__close-btn`);

  popupBtn.addEventListener("click", () => {
    const isOpen = popupLm.classList.toggle("active");

    if (isOpen) {
      // add aria events
      modalHandler.addA11yEvents({
        modalKey: className,
        closeHandler: closePopup,
        closeLms: [closeBtn]
      });
    } 
    else {
      // remove aria events
      modalHandler.removeA11yEvents({ modalKey: className });
    }
    });

  // Insert the button after the last element inside main
  main.appendChild(popupBtn);
}

for (let i = 1; i <= 3; i++) {
  generatePopup(`popup-${i}`);
}

const openModalBtn = document.getElementById('open-modal-btn');
openModalBtn.addEventListener('click', openFirstModal);