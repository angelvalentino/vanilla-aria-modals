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

// Second modal close timeout ID
let secondModalCLoseTimId;

// Second modal DOM references
const secondModalContainerLm = document.getElementById('second-modal');
const secondModalContentLm = document.getElementById('second-modal__content');
const secondModalOverlayLm = document.getElementById('second-modal__overlay');
const secondModalCloseBtns = [...secondModalContentLm.querySelectorAll('.close-second-modal-btn')];
const secondModalFocusableLm = document.getElementById('second-modal__close-btn');

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

function closeFirstModal() {
  // Hide modal and store the close timeout id to able to clear it if needed
  firstModalCloseTimId = hideModal({
    modalContainerLm: firstModalContainerLm, 
    modalContentLm: firstModalContentLm, 
    modalOverlayLm: firstModalOverlayLm, 
    modalKey: 'firstModal'
  });

  // Remove open additional modal event
  firstModalAcceptBtn.removeEventListener('click', openSecondModal);

  // Remove ARIA event listeners
  modalHandler.removeA11yEvents({
    modalKey: 'firstModal',
    modalLm: firstModalContentLm,
    closeLms: firstModalCloseBtns
  });
}

function openFirstModal(e) {
  // Stop event propagation to make sure no events are called on bubbling
  e.stopPropagation();
  // Show modal
  showModal({
    modalContainerLm: firstModalContainerLm, 
    modalContentLm: firstModalContentLm,
    modalOverlayLm: firstModalOverlayLm,
    firstFocusableLm: firstModalFocusableLm,
    closeModalTimId: firstModalCloseTimId, 
    modalKey: 'firstModal'
  });

  // Add open additional modal event
  firstModalAcceptBtn.addEventListener('click', openSecondModal);

  // Add ARIA event listeners
  modalHandler.addA11yEvents({
    modalKey: 'firstModal',
    modalLm: firstModalContentLm,
    modalLmOuterLimits: firstModalContentLm,
    closeLms: firstModalCloseBtns,
    closeHandler: closeFirstModal
  });
}

function closeSecondModal() {
  // Hide modal and store the close timeout id to able to clear it if needed
  secondModalCLoseTimId = hideModal({
    modalContainerLm: secondModalContainerLm, 
    modalContentLm: secondModalContentLm, 
    modalOverlayLm: secondModalOverlayLm,
    modalKey: 'secondModal'
  });

  // Remove ARIA event listeners
  modalHandler.removeA11yEvents({
    modalKey: 'secondModal',
    modalLm: secondModalContentLm,
    closeLms: secondModalCloseBtns
  });
}

function openSecondModal(e) {
  // Stop event propagation to make sure no events are called on bubbling
  e.stopPropagation();
  // Show modal
  showModal({
    modalContainerLm: secondModalContainerLm, 
    modalContentLm: secondModalContentLm,
    modalOverlayLm: secondModalOverlayLm, 
    firstFocusableLm: secondModalFocusableLm, 
    closeModalTimId: secondModalCLoseTimId, 
    modalKey: 'secondModal'
  });

  // Add ARIA event listeners
  modalHandler.addA11yEvents({
    modalKey: 'secondModal',
    modalLm: secondModalContentLm,
    modalLmOuterLimits: secondModalContentLm,
    closeLms: secondModalCloseBtns,
    closeHandler: closeSecondModal
  });
}

const openModalBtn = document.getElementById('open-modal-btn');
openModalBtn.addEventListener('click', openFirstModal);