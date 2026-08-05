// ==========================================
// BLOQUE 3: MERCADO POR CERCANÍA Y PRODUCTOS
// ==========================================

window.currentProducts = [];
window.userLocation = { lat: 0, lng: 0 };

// 1. OBTENER UBICACIÓN DEL USUARIO
function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(window.userLocation);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        resolve(window.userLocation);
      },
      () => resolve(window.userLocation),
      { timeout: 5000 }
    );
  });
}

// 2. FÓRMULA DE DISTANCIA (Haversine en Kilómetros)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round((R * c) * 10) / 10; // Retorna km con 1 decimal
}

// 3. CARGAR PRODUCTOS Y ORDENAR POR CERCANÍA
async function loadProximityProducts(category = '') {
  await getUserLocation();

  let url = `${SUPABASE_URL}/rest/v1/products?is_active=eq.true&select=*,seller:profiles(full_name,email,phone,avatar_url)&order=created_at.desc`;
  if (category) {
    url += `&category=eq.${encodeURIComponent(category)}`;
  }

  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY }
  });

  const products = await res.json();
  if (!res.ok) throw new Error('Error al obtener productos.');

  // Calcular distancia para cada producto
  window.currentProducts = products.map(p => {
    const dist = calculateDistance(window.userLocation.lat, window.userLocation.lng, p.lat, p.lng);
    return { ...p, distanceKm: dist };
  });

  // Ordenar de menor a mayor distancia
  window.currentProducts.sort((a, b) => a.distanceKm - b.distanceKm);

  return window.currentProducts;
}

// 4. CREAR NUEVA PUBLICACIÓN CON GEOLOCALIZACIÓN
async function createProductAd(title, description, price, category, imageUrl = '') {
  if (!window.currentUser) throw new Error('Debés iniciar sesión para publicar.');
  if (!title || !price) throw new Error('Título y precio son obligatorios.');

  await getUserLocation();

  const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      seller_id: window.currentUser.id,
      title: title,
      description: description,
      price: parseFloat(price),
      category: category || 'General',
      image_url: imageUrl || 'https://via.placeholder.com/300x200?text=Pase+Y+Mire',
      lat: window.userLocation.lat,
      lng: window.userLocation.lng
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Error al publicar anuncio.');

  return data[0];
}

// 5. INICIAR LLAMADA AL VENDEDOR
function callSeller(phoneNumber) {
  if (!phoneNumber) {
    alert('El vendedor no registró un número de teléfono.');
    return;
  }
  window.location.href = `tel:${phoneNumber}`;
              }
              
