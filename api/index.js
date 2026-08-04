// @ts-nocheck
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

const getSupabase = () => {
  const url = (process.env.SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_KEY || '').trim();
  if (!url || !key || !url.startsWith('http')) return null;
  return createClient(url, key);
};

const logEvent = async (supabase: any, transaction_id: string, event: string, details: any = {}) => {
  try {
    await supabase.from('escrow_logs').insert([{ transaction_id, event, details }]);
  } catch (e) {
    console.error('Error log:', e);
  }
};

// =============================================================================
// FRONTEND INTERACTIVO (DASHBOARD WEB)
// =============================================================================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Dashboard Pro</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen font-sans p-4 md:p-8">
  <div class="max-w-6xl mx-auto space-y-8">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-emerald-400">🛡️ Escrow System Manager</h1>
        <p class="text-sm text-gray-400">Plataforma de Retención de Fondos y Disputas</p>
      </div>
      <span class="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-mono rounded-full border border-emerald-500/20">● Servidor Activo</span>
    </div>

    <!-- CREAR TRANSACCIÓN -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
      <h2 class="text-lg font-semibold text-gray-200 mb-4">➕ Nueva Orden de Escrow</h2>
      <form id="createForm" class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input type="text" id="buyer_id" placeholder="ID Comprador" required class="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none">
        <input type="text" id="seller_id" placeholder="ID Vendedor" required class="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none">
        <input type="number" id="amount" placeholder="Monto ($)" required class="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none">
        <input type="text" id="description" placeholder="Descripción del servicio/producto" required class="bg-gray-800 border border-gray-700 text-white rounded-lg p-2.5 text-sm focus:border-emerald-500 outline-none">
        <button type="submit" class="md:col-span-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg text-sm transition">Crear Transacción</button>
      </form>
    </div>

    <!-- LISTA DE TRANSACCIONES -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold text-gray-200">📋 Transacciones Activas</h2>
        <button onclick="loadData()" class="text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-700">🔄 Actualizar</button>
      </div>
      <div id="txList" class="space-y-3">
        <p class="text-sm text-gray-500">Cargando datos...</p>
      </div>
    </div>

    <!-- PANEL DE DISPUTAS -->
    <div class="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl space-y-4">
      <h2 class="text-lg font-semibold text-amber-400">⚖️ Casos en Disputa (Panel Admin)</h2>
      <div id="disputeList" class="space-y-3">
        <p class="text-sm text-gray-500">Cargando disputas...</p>
      </div>
    </div>

  </div>

  <script>
    const API = '';

    async function loadData() {
      // Cargar Transacciones
      const resTx = await fetch(API + '/api/escrow/all');
      const dataTx = await resTx.json();
      const txContainer = document.getElementById('txList');
      
      if (!dataTx.transactions || dataTx.transactions.length === 0) {
        txContainer.innerHTML = '<p class="text-sm text-gray-500">No hay transacciones registradas.</p>';
      } else {
        txContainer.innerHTML = dataTx.transactions.map(tx => {
          const badgeColor = {
            pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
            funded: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            disputed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/20'
          }[tx.status] || 'bg-gray-800 text-gray-300';

          return \`
            <div class="bg-gray-950 border border-gray-800 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs text-gray-500">\${tx.id.substring(0, 8)}...</span>
                  <span class="px-2.5 py-0.5 text-xs rounded-full border \${badgeColor}">\${tx.status.toUpperCase()}</span>
                </div>
                <p class="text-sm font-medium text-gray-200">\${tx.description || 'Sin descripción'}</p>
                <p class="text-xs text-gray-400">Comprador: <span class="text-gray-200">\${tx.buyer_id}</span> | Vendedor: <span class="text-gray-200">\${tx.seller_id}</span></p>
              </div>
              <div class="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <span class="text-lg font-bold text-emerald-400 mr-2">$\${tx.amount}</span>
                \${tx.status === 'pending' ? \`<button onclick="payTx('\${tx.id}')" class="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3 py-2 rounded-lg font-medium">Acreditar Pago</button>\` : ''}
                \${tx.status === 'funded' ? \`
                  <button onclick="completeTx('\${tx.id}')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-2 rounded-lg font-medium">Liberar Fondos</button>
                  <button onclick="openDispute('\${tx.id}', '\${tx.buyer_id}')" class="bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-2 rounded-lg font-medium">Abrir Reclamo</button>
                \` : ''}
              </div>
            </div>
          \`;
        }).join('');
      }

      // Cargar Disputas
      const resDisp = await fetch(API + '/api/escrow/disputes/all');
      const dataDisp = await resDisp.json();
      const dispContainer = document.getElementById('disputeList');

      if (!dataDisp.disputes || dataDisp.disputes.length === 0) {
        dispContainer.innerHTML = '<p class="text-sm text-gray-500">No hay reclamos abiertos.</p>';
      } else {
        dispContainer.innerHTML = dataDisp.disputes.map(d => \`
          <div class="bg-gray-950 border border-amber-500/20 p-4 rounded-xl space-y-3">
            <div class="flex justify-between items-center text-xs text-gray-400">
              <span>Disputa ID: \${d.id.substring(0, 8)}...</span>
              <span class="text-amber-400 font-semibold">\${d.status.toUpperCase()}</span>
            </div>
            <p class="text-sm text-gray-200"><strong>Motivo:</strong> \${d.reason}</p>
            <p class="text-xs text-gray-400">Iniciado por: \${d.opened_by}</p>
            \${d.status === 'open' ? \`
              <div class="flex gap-2 pt-2">
                <button onclick="resolveDispute('\${d.id}', '\${d.transaction_id}', 'buyer')" class="bg-rose-600 hover:bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Reembolsar Comprador</button>
                <button onclick="resolveDispute('\${d.id}', '\${d.transaction_id}', 'seller')" class="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium">Liberar Vendedor</button>
              </div>
            \` : \`<p class="text-xs text-emerald-400">Resuelto a favor de: \${d.winner_role}</p>\`}
          </div>
        \`).join('');
      }
    }

    // Acciones
    document.getElementById('createForm').onsubmit = async (e) => {
      e.preventDefault();
      await fetch(API + '/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyer_id: document.getElementById('buyer_id').value,
          seller_id: document.getElementById('seller_id').value,
          amount: document.getElementById('amount').value,
          description: document.getElementById('description').value
        })
      });
      e.target.reset();
      loadData();
    };

    async function payTx(id) {
      await fetch(API + '/api/webhooks/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: id, payment_status: 'approved', payment_id: 'PAY_' + Date.now() })
      });
      loadData();
    }

    async function completeTx(id) {
      await fetch(API + '/api/escrow/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: id, status: 'completed' })
      });
      loadData();
    }

    async function openDispute(txId, buyerId) {
      const reason = prompt('Ingrese el motivo del reclamo:');
      if (!reason) return;
      await fetch(API + '/api/escrow/dispute/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: txId, opened_by: buyerId, reason })
      });
      loadData();
    }

    async function resolveDispute(disputeId, txId, winnerRole) {
      const notes = prompt('Notas de resolución administrativa:');
      await fetch(API + '/api/escrow/dispute/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dispute_id: disputeId, transaction_id: txId, winner_role: winnerRole, resolution_notes: notes || 'Resuelto por administrador' })
      });
      loadData();
    }

    loadData();
  </script>
</body>
</html>
  `);
});

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Listar todas las transacciones
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { data, error } = await supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Crear transacción
app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { buyer_id, seller_id, amount, description } = req.body;
    if (!buyer_id || !seller_id || !amount) {
      return res.status(400).json({ error: 'Parámetros incompletos' });
    }

    const { data, error } = await supabase
      .from('escrow_transactions')
      .insert([{ buyer_id, seller_id, amount: Number(amount), description, status: 'pending' }])
      .select();

    if (error) return res.status(400).json({ error: error.message });

    await logEvent(supabase, data[0].id, 'TRANSACTION_CREATED', { buyer_id, seller_id, amount });
    return res.status(201).json({ status: 'Creado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Cambiar estado manualmente
app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { transaction_id, status } = req.body;
    const { data, error } = await supabase
      .from('escrow_transactions')
      .update({ status })
      .eq('id', transaction_id)
      .select();

    if (error) return res.status(400).json({ error: error.message });

    await logEvent(supabase, transaction_id, 'STATUS_UPDATED', { new_status: status });
    return res.status(200).json({ status: 'Actualizado', transaction: data[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Webhook de Pasarela
app.post('/api/webhooks/payment', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { transaction_id, payment_status, payment_id } = req.body;
    if (['approved', 'completed', 'paid'].includes((payment_status || '').toLowerCase())) {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .update({ status: 'funded', payment_id: payment_id || null })
        .eq('id', transaction_id)
        .select();

      if (error) return res.status(400).json({ error: error.message });

      await logEvent(supabase, transaction_id, 'PAYMENT_RECEIVED', { payment_id, payment_status });
      return res.status(200).json({ status: 'OK', transaction: data[0] });
    }

    return res.status(200).json({ status: 'Ignorado' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Abrir disputa
app.post('/api/escrow/dispute/open', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { transaction_id, opened_by, reason } = req.body;
    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .update({ status: 'disputed' })
      .eq('id', transaction_id)
      .select();

    if (txError) return res.status(400).json({ error: txError.message });

    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .insert([{ transaction_id, opened_by, reason, status: 'open' }])
      .select();

    if (disputeError) return res.status(400).json({ error: disputeError.message });

    await logEvent(supabase, transaction_id, 'DISPUTE_OPENED', { opened_by, reason });
    return res.status(201).json({ status: 'Disputa Abierta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Listar disputas
app.get('/api/escrow/disputes/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { data, error } = await supabase.from('escrow_disputes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({ status: 'OK', disputes: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// Resolver disputa
app.post('/api/escrow/dispute/resolve', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });

    const { dispute_id, transaction_id, winner_role, resolution_notes } = req.body;
    const finalStatus = winner_role === 'buyer' ? 'cancelled' : 'completed';

    const { data: tx, error: txError } = await supabase
      .from('escrow_transactions')
      .update({ status: finalStatus })
      .eq('id', transaction_id)
      .select();

    if (txError) return res.status(400).json({ error: txError.message });

    const { data: dispute, error: disputeError } = await supabase
      .from('escrow_disputes')
      .update({ 
        status: 'resolved', 
        winner_role, 
        resolution_notes: resolution_notes || '',
        resolved_at: new Date().toISOString() 
      })
      .eq('id', dispute_id)
      .select();

    if (disputeError) return res.status(400).json({ error: disputeError.message });

    await logEvent(supabase, transaction_id, 'DISPUTE_RESOLVED', { winner_role, resolution_notes });
    return res.status(200).json({ status: 'Disputa Resuelta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
