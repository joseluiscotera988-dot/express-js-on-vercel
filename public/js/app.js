// ==========================================
// BLOQUE 5: BILLETERA VIRTUAL Y TARJETA ID
// ==========================================

window.userWallet = null;
window.transactionsHistory = [];

// 1. OBTENER / SINCRONIZAR BILLETERA DEL USUARIO
async function syncUserWallet() {
  if (!window.currentUser) throw new Error('Usuario no autenticado.');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${window.currentUser.id}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`
    }
  });

  const wallets = await res.json();
  if (!res.ok) throw new Error('Error al sincronizar billetera.');

  if (Array.isArray(wallets) && wallets.length > 0) {
    window.userWallet = wallets[0];
  } else {
    // Si no existía, crear billetera inicial por seguridad
    const cardId = `PYM-${window.currentUser.id.substring(0,4).toUpperCase()}-${window.currentUser.id.substring(4,8).toUpperCase()}`;
    const createRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${window.currentAccessToken}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        user_id: window.currentUser.id,
        email: window.currentUser.email,
        balance: 1000.00,
        card_id: cardId
      })
    });
    const newWallets = await createRes.json();
    window.userWallet = newWallets[0];
  }

  return window.userWallet;
}

// 2. CARGAR HISTORIAL DE TRANSACCIONES
async function getTransactionHistory() {
  if (!window.currentUser) return [];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/transactions?user_id=eq.${window.currentUser.id}&order=created_at.desc`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`
    }
  });

  const history = await res.json();
  if (!res.ok) throw new Error('Error al cargar movimientos.');

  window.transactionsHistory = history;
  return history;
}

// 3. CARGAR FONDOS A LA BILLETERA
async function loadWalletFunds(amount, concept = 'Carga de Fondos') {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) throw new Error('Monto inválido.');
  if (!window.userWallet) await syncUserWallet();

  const newBalance = parseFloat(window.userWallet.balance) + numAmount;

  // Actualizar saldo
  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${window.currentUser.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ balance: newBalance })
  });

  if (!patchRes.ok) throw new Error('No se pudo actualizar el saldo.');

  // Registrar movimiento
  await recordTransaction(concept, numAmount, 'CREDIT');
  
  window.userWallet.balance = newBalance;
  return newBalance;
}

// 4. TRANSFERIR DINERO A OTRO USUARIO (POR EMAIL O TARJETA ID)
async function transferMoney(destinationIdentifier, amount) {
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) throw new Error('Monto de transferencia inválido.');
  if (!window.userWallet) await syncUserWallet();

  if (parseFloat(window.userWallet.balance) < numAmount) {
    throw new Error('Saldo insuficiente para realizar la operación.');
  }

  // Buscar billetera de destino
  const queryParam = destinationIdentifier.includes('@') 
    ? `email=eq.${encodeURIComponent(destinationIdentifier.trim())}` 
    : `card_id=eq.${encodeURIComponent(destinationIdentifier.trim().toUpperCase())}`;

  const destRes = await fetch(`${SUPABASE_URL}/rest/v1/wallets?${queryParam}`, {
    headers: { 'apikey': SUPABASE_KEY }
  });
  const destWallets = await destRes.json();

  if (!Array.isArray(destWallets) || destWallets.length === 0) {
    throw new Error('Usuario o Tarjeta ID de destino no encontrada.');
  }

  const destWallet = destWallets[0];
  if (destWallet.user_id === window.currentUser.id) {
    throw new Error('No podés transferirte dinero a vos mismo.');
  }

  // A. Restar al emisor
  const senderNewBalance = parseFloat(window.userWallet.balance) - numAmount;
  await fetch(`${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${window.currentUser.id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ balance: senderNewBalance })
  });

  // B. Sumar al receptor
  const receiverNewBalance = parseFloat(destWallet.balance) + numAmount;
  await fetch(`${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${destWallet.user_id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ balance: receiverNewBalance })
  });

  // C. Registrar transacciones en ambos historiales
  await recordTransaction(`Envío a ${destWallet.email}`, numAmount, 'DEBIT');
  
  // Registrar crédito al destino
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: destWallet.user_id,
      concept: `Recibido de ${window.currentUser.email}`,
      amount: numAmount,
      type: 'CREDIT'
    })
  });

  window.userWallet.balance = senderNewBalance;
  return senderNewBalance;
}

// 5. REGISTRAR TRANSACCIÓN EN HISTORIAL
async function recordTransaction(concept, amount, type) {
  await fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${window.currentAccessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: window.currentUser.id,
      concept: concept,
      amount: amount,
      type: type
    })
  });
}

// 6. OBTENER URL DEL CÓDIGO QR DE IDENTIDAD
function getVirtualCardQRUrl() {
  if (!window.userWallet || !window.userWallet.card_id) return '';
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.userWallet.card_id)}`;
                                 }
                          
