// ==========================================
// BLOQUE 4: MÓDULO DE LOGÍSTICA EN TIEMPO REAL
// ==========================================

window.activeDrivers = [];
window.driverWatchId = null;

// 1. ACTIVAR / DESACTIVAR ESTADO COMO CHOFER
async function toggleDriverStatus(serviceType, vehicleInfo, contactPhone, isActive) {
  if (!window.currentUser) throw new Error('Debés iniciar sesión.');
  if (isActive && (!serviceType || !contactPhone)) {
    throw new Error('Tipo de servicio y teléfono de contacto son obligatorios.');
  }

  // Obtener posición actual
  let lat = window.userLocation.lat || 0;
  let lng = window.userLocation.lng || 0;

  if (isActive && navigator.geolocation) {
    await new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
          resolve();
        },
        () => resolve(),
        { timeout: 5000 }
      );
    });
  }

  // Verificar si ya existe un registro de este chofer
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/logistics_services?driver_id=eq.${window.currentUser.id}`, {
    headers: { 'apikey': SUPABASE_KEY }
  });
  const existing = await checkRes.json();

  let res;
  if (Array.isArray(existing) && existing.length > 0) {
    // Actualizar registro existente
    res = await fetch(`${SUPABASE_URL}/rest/v1/logistics_services?driver_id=eq.${window.currentUser.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${window.currentAccessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        service_type: serviceType,
        vehicle_info: vehicleInfo || '',
        contact_phone: contactPhone,
        is_active: isActive,
        current_lat: lat,
        current_lng: lng,
        updated_at: new Date().toISOString()
      })
    });
  } else {
    // Crear nuevo registro de chofer
    res = await fetch(`${SUPABASE_URL}/rest/v1/logistics_services`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${window.currentAccessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        driver_id: window.currentUser.id,
        service_type: serviceType,
        vehicle_info: vehicleInfo || '',
        contact_phone: contactPhone,
        is_active: isActive,
        current_lat: lat,
        current_lng: lng
      })
    });
  }

  const data = await res.json();
  if (!res.ok) throw new Error('Error al actualizar estado de chofer.');

  // Si se activa, iniciar rastreo de ubicación continua
  if (isActive) {
    startDriverLocationTracking();
  } else {
    stopDriverLocationTracking();
  }

  return data[0];
}

// 2. OBTENER CHOFERES ACTIVOS POR CATEGORÍA
// Categroías: 'MOTO', 'REMIS', 'FLETE', 'LARGA_DISTANCIA'
async function getActiveDriversByCategory(serviceType) {
  await getUserLocation();

  let url = `${SUPABASE_URL}/rest/v1/logistics_services?is_active=eq.true&select=*,driver:profiles(full_name,email,avatar_url)`;
  if (serviceType) {
    url += `&service_type=eq.${encodeURIComponent(serviceType)}`;
  }

  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY }
  });

  const drivers = await res.json();
  if (!res.ok) throw new Error('Error al obtener choferes.');

  // Calcular distancia desde la posición del usuario
  window.activeDrivers = drivers.map(d => {
    const dist = calculateDistance(
      window.userLocation.lat,
      window.userLocation.lng,
      d.current_lat,
      d.current_lng
    );
    return { ...d, distanceKm: dist };
  });

  // Ordenar de más cercano a más lejano
  window.activeDrivers.sort((a, b) => a.distanceKm - b.distanceKm);

  return window.activeDrivers;
}

// 3. RASTREO CONTINUO DE UBICACIÓN PARA CHOFERES ACTIVOS
function startDriverLocationTracking() {
  if (window.driverWatchId || !navigator.geolocation) return;

  window.driverWatchId = navigator.geolocation.watchPosition(
    async (pos) => {
      if (!window.currentUser) return;
      await fetch(`${SUPABASE_URL}/rest/v1/logistics_services?driver_id=eq.${window.currentUser.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${window.currentAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_lat: pos.coords.latitude,
          current_lng: pos.coords.longitude,
          updated_at: new Date().toISOString()
        })
      }).catch(() => {});
    },
    (err) => console.warn('Error en seguimiento de chofer:', err),
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
  );
}

function stopDriverLocationTracking() {
  if (window.driverWatchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(window.driverWatchId);
    window.driverWatchId = null;
  }
                               }
  
