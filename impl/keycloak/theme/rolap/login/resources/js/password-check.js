let passwordInput, confirmPasswordInput, confirmPasswordInputError;

window.addEventListener('load', function () {
  initVariables();
  createObservers();
});

function initVariables() {
  passwordInput = document.getElementById('password');
  confirmPasswordInput = document.getElementById('password-confirm');
  confirmPasswordInputError = document.getElementById('password-confirm-error');
}

function createObservers() {
  confirmPasswordInput.addEventListener('blur', checkConfirmPassword)
  confirmPasswordInput.addEventListener('input', checkConfirmPassword)
}

/**
 * Check if confirm password is valid.
 */
function checkConfirmPassword(event) {
  const confirmPasswordValue = event.target.value;
  const passwordValue = passwordInput.value;

  if (passwordValue !== confirmPasswordValue) {
    confirmPasswordInputError.classList.remove('d-none');
  } else {
    confirmPasswordInputError.classList.add('d-none');
  }
}
