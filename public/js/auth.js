// ==========================================
// BLOQUE 2: LÓGICA DE AUTENTICACIÓN Y PERFIL
// ==========================================

const SUPABASE_URL = 'https://onjyajaiqpfilvsizpdb.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uanlhamFpcXBmaWx2c2l6cGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU4MDk4MDAsImV4cCI6MjEwMTM4NTgwMH0.2AurjHS0hkFqGoI2r2kkczNcMQ8RBg5GwCWOq0Qjwes';

// Estado global de sesión
window.currentUser = null;
window.currentAccessToken = null;

// 1. INICIAR SESIÓN
async function loginUser(email, password) {
  if (!email || !password) throw new Error('Completá email y contraseña.');

  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Credenciales inválidas');

  window.currentAccessToken = data.access_token;
  window.currentUser = data.user;

  // Guardar en almacenamiento local
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user_id', data.user.id);
  localStorage.setItem('user_email', data.user.email);

  // Actualizar estado 'En línea' en tabla profiles
  await setOnlineStatus(data.user.id, true);

  return data.user;
}

// 2. REGISTRO KYC (Usuario + Perfil + Billetera Inicial)
async function registerUser(fullName, email, password, phone = '') {
  if (!fullName || !email || !password) throw new Error('Nombre, email y contraseña son obligatorios.');

  // A. Crear usuario en Auth
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, data: { full_name: fullName } })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.msg || 'Error al crear la cuenta.');

  const userId = data.id || (data.user && data.user.id);

  if (userId) {
    // B. Obtener ubicación aproximada inicial
    let lat = 0, lng = 0;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { lat = pos.coords.latitude; lng = pos.coords.longitude; },
        (err) => { console.warn('Ubicación denegada, usando default'); }
      );
    }

    // C. Crear registro en la tabla profiles
    await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        id: userId,
        full_name: fullName,
        email: email,
        phone: phone,
        lat: lat,
        lng: lng,
        is_online: true
      })
    });

    // D. Crear Tarjeta ID única y Billetera Inicial
    const cardId = `PYM-${userId.substring(0,4).toUpperCase()}-${userId.substring(4,8).toUpperCase()}`;
    await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        email: email,
        balance: 1000.00,
        card_id: cardId
      })
    });
  }

  return data;
}

// 3. RECUPERAR CONTRASEÑA
async function recoverPassword(email) {
  if (!email) throw new Error('Ingresá tu correo electrónico.');

  const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.msg || 'No se pudo enviar el correo de recuperación.');
  }

  return true;
}

// 4. ACTUALIZAR ESTADO EN LÍNEA
async function setOnlineStatus(userId, isOnline) {
  if (!userId) return;
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      is_online: isOnline,
      last_seen: new Date().toISOString()
    })
  }).catch(() => {});
}

// 5. CERRAR SESIÓN
async function logoutUser() {
  if (window.currentUser) {
    await setOnlineStatus(window.currentUser.id, false);
  }
  localStorage.clear();
  window.currentUser = null;
  window.currentAccessToken = null;
    }
                       
