let currentUser = JSON.parse(localStorage.getItem('pm_user')) || null;
let map, carrierMarker;
let gpsWatchId = null;
let activeReleaseToken = null;

const mockFletes = [
  { id: 'auc_101', origen: 'San Pedro', destino: 'Rosario', carga: 'Utilitario', monto: 65000, estado: 'Licitando' },
  { id: 'auc_102', origen: 'Baradero', destino: 'Buenos Aires', carga: 'Camión Chasis', monto: 140000, estado: 'Asignado' }
];

function initMap() {
  const mapElement = document.getElementById('gps-map');
  if (!mapElement || map) return;
  map = L.map('gps-map').setView([-33.6787, -59.6647], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
  carrierMarker = L.marker([-33.6787, -59.6647]).addTo(map).bindPopup('🚛 Carga en Rastreo GPS').openPopup();
}

function updateAuthUI() {
  const badgeText = document.getElementById('user-badge-text');
  const badgeDot = document.getElementById('user-status-dot');
  const cardHolder = document.getElementById('card-holder');
  const profileName = document.getElementById('profile-name');
  const profileRole = document.getElementById('profile-role');
  const adminBadge = document.getElementById('admin-badge');
  const adminBanner = document.getElementById('admin-top-banner');

  if (currentUser) {
    if (badgeText) badgeText.innerText = currentUser.name ? currentUser.name.split(' ')[0] + ' 🟢' : 'Usuario 🟢';
    if (badgeDot) badgeDot.className = 'w-2 h-2 rounded-full bg-emerald-400';
    if (cardHolder) cardHolder.innerText = currentUser.name || 'Usuario';
    if (profileName) profileName.innerText = currentUser.name || 'Usuario';
    if (profileRole) profileRole.innerText = currentUser.role || 'Verificado';

    if (currentUser.role === 'ADMIN_ROOT') {
      if (adminBadge) adminBadge.classList.remove('hidden');
      if (adminBanner) adminBanner.classList.remove('hidden');
    } else {
      if (adminBadge) adminBadge.classList.add('hidden');
      if (adminBanner) adminBanner.classList.add('hidden');
    }
  } else {
    if (badgeText) badgeText.innerText = 'Ingresar';
    if (badgeDot) badgeDot.className = 'w-2 h-2 rounded-full bg-amber-400';
    if (adminBanner) adminBanner.classList.add('hidden');
  }
}

function switchView(viewName) {
  ['home', 'fletes', 'wallet', 'profile', 'simulador', 'login', 'register'].forEach(v => {
    const el = document.getElementById('view-' + v);
    if (el) el.classList.add('hidden');
    const navBtn = document.getElementById('nav-' + v);
    if (navBtn) navBtn.classList.remove('text-amber-400', 'font-bold');
  });

  const selectedView = document.getElementById('view-' + viewName);
  const selectedNav = document.getElementById('nav-' + viewName);
  if (selectedView) selectedView.classList.remove('hidden');
  if (selectedNav) selectedNav.classList.add('text-amber-400', 'font-bold');

  if (viewName === 'fletes') {
    setTimeout(initMap, 200);
    if (typeof startChatPolling === 'function') startChatPolling('auc_101');
  } else {
    if (typeof chatInterval !== 'undefined' && chatInterval) clearInterval(chatInterval);
  }
}

function openAuthModal() {
  if (typeof toggleAuthScreen === 'function') toggleAuthScreen('login');
  switchView('login');
}

function logout() {
  localStorage.removeItem('pm_user');
  currentUser = null;
  updateAuthUI();
  switchView('home');
}

function protectedAction(targetView) {
  if (!currentUser) openAuthModal();
  else switchView(targetView);
}

function renderFeed() {
  const feedContainer = document.getElementById('live-auction-feed');
  if (!feedContainer) return;

  feedContainer.innerHTML = mockFletes.map(f => `
    <div class="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
      <div class="flex justify-between items-center">
        <h4 class="text-xs font-bold text-slate-200">${f.origen} ➔ ${f.destino}</h4>
        <span class="text-emerald-400 font-bold text-xs">$ ${Number(f.monto).toLocaleString()}</span>
      </div>
      <button onclick="payWithMercadoPago('${f.id}', '${f.origen} a ${f.destino}', ${f.monto})" class="w-full bg-blue-600 text-white font-bold py-1.5 rounded-lg text-[10px]">
        Pagar con Mercado Pago
      </button>
    </div>
  `).join('');
}

async function payWithMercadoPago(auctionId, title, amount) {
  if (!currentUser) return openAuthModal();
  try {
    const res = await fetch('/api/payments/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId, title, amount, payerEmail: `${currentUser.phone || 'cliente'}@paseymire.com` })
    });
    const data = await res.json();
    if (data.success && data.init_point) window.location.href = data.init_point;
    else alert('❌ Error al generar preferencia Mercado Pago');
  } catch (err) { alert('❌ Error conectando con pasarela'); }
}

async function handleCreateAuction(e) {
  e.preventDefault();
  const origen = document.getElementById('flete-origen').value;
  const destino = document.getElementById('flete-destino').value;
  const monto = document.getElementById('flete-monto').value;

  try {
    const res = await fetch('/api/auctions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: origen, destination: destino, amount: monto, userId: currentUser ? currentUser.id : 'usr_anon' })
    });
    const data = await res.json();
    if (data.success) {
      mockFletes.unshift({ id: data.auction.id, origen, destino, carga: 'General', monto, estado: 'Licitando' });
      renderFeed();
      alert('🚀 Subasta creada con retención del 5%');
      switchView('home');
    }
  } catch (err) { alert('❌ Error al crear subasta'); }
}

function runFinancialSimulation(e) {
  e.preventDefault();
  const monto = parseFloat(document.getElementById('sim-monto').value);
  const resBox = document.getElementById('sim-result');
  resBox.classList.remove('hidden');
  resBox.innerHTML = `
    <p class="text-amber-400 font-bold mb-1">⚡ SPLIT FINANCIERO 5%</p>
    <p>• Total: <b>$ ${monto.toLocaleString()}</b></p>
    <p>• Prestador (95%): <b>$ ${(monto * 0.95).toLocaleString()}</b></p>
    <p>• Retención CBU Maestro (5%): <b class="text-emerald-400">$ ${(monto * 0.05).toLocaleString()}</b></p>
  `;
}

function startGPSSender() {
  if (!navigator.geolocation) return alert('❌ Dispositivo sin GPS.');
  gpsWatchId = navigator.geolocation.watchPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    if (carrierMarker) { carrierMarker.setLatLng([lat, lng]); if (map) map.panTo([lat, lng]); }
    fetch('/api/gps/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId: 'auc_101', carrierId: currentUser ? currentUser.id : 'anon', lat, lng })
    }).catch(() => {});
  });
  alert('🛰️ Transmisión GPS activada.');
}

function stopGPSSender() {
  if (gpsWatchId !== null) navigator.geolocation.clearWatch(gpsWatchId);
  alert('🔴 Transmisión GPS detenida.');
}

async function generateEscrowQR(auctionId, amount) {
  try {
    const res = await fetch('/api/escrow/generate-qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auctionId, amount })
    });
    const data = await res.json();
    if (data.success) {
      activeReleaseToken = data.releaseToken;
      document.getElementById('qr-box').classList.remove('hidden');
      document.getElementById('qr-image').src = data.qrDataUrl;
      alert('📲 QR de Liberación Escrow Generado.');
    }
  } catch (err) { alert('❌ Error generando QR'); }
}

async function simulateClientQRScan() {
  if (!activeReleaseToken) return alert('❌ Generá un QR primero.');
  try {
    const res = await fetch('/api/escrow/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ releaseToken: activeReleaseToken })
    });
    const data = await res.json();
    if (data.success) {
      alert('🎉 ¡Pago Escrow Liberado al Transportista!');
      document.getElementById('qr-box').classList.add('hidden');
      activeReleaseToken = null;
    }
  } catch (err) { alert('❌ Error liberando pago'); }
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderFeed();
  if (typeof loadAdBanners === 'function') loadAdBanners();
});
                                              
