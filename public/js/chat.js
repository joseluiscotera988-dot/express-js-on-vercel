// ==========================================
// BLOQUE 6: CHAT, LLAMADAS Y PRESENCIA EN TIEMPO REAL
// ==========================================

window.activeChatUser = null;
window.chatPollingInterval = null;

// 1. OBTENER LISTA DE CONTACTOS / AMIGOS
async function getContactsList() {
  if (!window.currentUser) return [];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_id=eq.${window.currentUser.id}&select=*,contact:profiles!contacts_contact_user_id_fkey(id,full_name,email,avatar_url,is_online,last_seen)`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`
    }
  });

  const contacts = await res.json();
  if (!res.ok) throw new Error('Error al cargar contactos.');

  return contacts;
}

// 2. AGREGAR UN CONTACTO / AMIGO
async function addContact(contactEmail) {
  if (!window.currentUser) throw new Error('Usuario no autenticado.');
  if (!contactEmail) throw new Error('Ingresá el correo del contacto.');

  // Buscar el usuario en profiles
  const profileRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.${encodeURIComponent(contactEmail.trim())}`, {
    headers: { 'apikey': SUPABASE_KEY }
  });
  const profiles = await profileRes.json();

  if (!Array.isArray(profiles) || profiles.length === 0) {
    throw new Error('No se encontró ningún usuario con ese correo.');
  }

  const targetUser = profiles[0];
  if (targetUser.id === window.currentUser.id) {
    throw new Error('No podés agregarte a vos mismo.');
  }

  // Guardar relación de amistad
  const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      user_id: window.currentUser.id,
      contact_user_id: targetUser.id,
      status: 'ACCEPTED'
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error('El usuario ya está en tu lista de contactos.');

  return data[0];
}

// 3. CARGAR MENSAJES DE CONVERSACIÓN
async function loadChatMessages(otherUserId) {
  if (!window.currentUser || !otherUserId) return [];

  window.activeChatUser = otherUserId;

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/chat_messages?or=(and(sender_id.eq.${window.currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${window.currentUser.id}))&order=created_at.asc`, 
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${window.currentAccessToken}`
      }
    }
  );

  const messages = await res.json();
  if (!res.ok) throw new Error('Error al obtener mensajes.');

  return messages;
}

// 4. ENVIAR MENSAJE DE CHAT
async function sendChatMessage(receiverId, messageText) {
  if (!window.currentUser) throw new Error('Usuario no autenticado.');
  if (!receiverId || !messageText.trim()) throw new Error('El mensaje no puede estar vacío.');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_messages`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      sender_id: window.currentUser.id,
      receiver_id: receiverId,
      message: messageText.trim()
    })
  });

  const data = await res.json();
  if (!res.ok) throw new Error('Error al enviar mensaje.');

  return data[0];
}

// 5. REGISTRAR UNA LLAMADA (AUDIO O VIDEO)
async function registerCallLog(receiverId, callType = 'AUDIO', status = 'COMPLETED', durationSeconds = 0) {
  if (!window.currentUser || !receiverId) return;

  await fetch(`${SUPABASE_URL}/rest/v1/call_logs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      caller_id: window.currentUser.id,
      receiver_id: receiverId,
      call_type: callType,
      status: status,
      duration_seconds: durationSeconds
    })
  }).catch(() => {});
}

// 6. OBTENER HISTORIAL DE LLAMADAS
async function getCallLogsHistory() {
  if (!window.currentUser) return [];

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/call_logs?or=(caller_id.eq.${window.currentUser.id},receiver_id.eq.${window.currentUser.id})&order=created_at.desc`,
    {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${window.currentAccessToken}`
      }
    }
  );

  const logs = await res.json();
  if (!res.ok) throw new Error('Error al obtener historial de llamadas.');

  return logs;
}

// 7. OBTENER USUARIOS EN LÍNEA EN TIEMPO REAL
async function getOnlineUsers() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?is_online=eq.true&select=id,full_name,email,avatar_url,last_seen`, {
    headers: { 'apikey': SUPABASE_KEY }
  });

  const users = await res.json();
  if (!res.ok) return [];

  return users;
}

// 8. INICIAR AUTO-ACTUALIZACIÓN DE CHAT (POLLING)
function startChatAutoRefresh(otherUserId, callbackUI) {
  stopChatAutoRefresh();
  window.chatPollingInterval = setInterval(async () => {
    if (window.activeChatUser === otherUserId) {
      const msgs = await loadChatMessages(otherUserId);
      if (typeof callbackUI === 'function') callbackUI(msgs);
    }
  }, 3000);
}

function stopChatAutoRefresh() {
  if (window.chatPollingInterval) {
    clearInterval(window.chatPollingInterval);
    window.chatPollingInterval = null;
  }
      }
  
