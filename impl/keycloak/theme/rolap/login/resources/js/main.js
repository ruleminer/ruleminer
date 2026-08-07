window.addEventListener('load', function () {});

function getCurrentLang() {
  const loginBtn = document.getElementById('kc-login');

  return (loginBtn.value === 'Logowanie') ? 'pl' : 'en';
}