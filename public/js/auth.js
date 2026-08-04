// P&M Ecosistema - Autenticación y Perfiles
let currentUser = JSON.parse(localStorage.getItem('pm_user')) || null;

function updateAuthUI() {
  const badgeText = document.getElementById('user-badge-text');
  const cardHolder = document.getElementById('card-holder');
  const profileName = document.getElementById('profile-name');
  const profileRole = document.getElementById('profile-role');
  const adminBadge = document.getElementById('admin-badge');

  if (currentUser) {
    if (badgeText) badgeText.innerText = currentUser.name.split(' ')[0] + ' 🟢';
    if (cardHolder) cardHolder.innerText = currentUser.name;
    if (profileName) profileName.innerText = currentUser.name;
    if (profileRole) profileRole.innerText = currentUser.role;

    if (currentUser.role === 'ADMIN_ROOT' && adminBadge) {
      adminBadge.classList.remove('hidden');
    }
  } else {
    if (badgeText) badgeText.innerText = 'Invitado (Ingresar)';
  }
}

function openAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('hidden');
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value;
  const phone = document.getElementById('reg-phone').value;
  const role = document.getElementById('reg-role').value;

  currentUser = { name, phone, role, verified: true };
  localStorage.setItem('pm_user', JSON.stringify(currentUser));

  updateAuthUI();
  closeAuthModal();
  alert('🎉 ¡Registro exitoso, ' + name + '! Ya estás habilitado para operar en el ecosistema.');
}

function logout() {
  localStorage.removeItem('pm_user');
  currentUser = null;
  updateAuthUI();
  if (typeof switchView === 'function') switchView('home');
  alert('Sesión cerrada.');
}

function protectedAction(targetView) {
  if (!currentUser) {
    openAuthModal();
  } else {
    if (typeof switchView === 'function') switchView(targetView);
  }
}

document.addEventListener('DOMContentLoaded', updateAuthUI);
    
