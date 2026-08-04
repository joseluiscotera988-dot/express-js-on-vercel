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
  } catch (e) {}
};

// 1. DASHBOARD EN LA RAÍZ (GET /)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen p-4 md:p-8 font-sans">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex justify-between items-center border-b border-gray-800 pb-4">
      <h1 class="text-xl font-bold text-emerald-400">🛡️ Escrow System Dashboard</h1>
      <span class="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">● Online</span>
    </div>

    <!-- CREAR TRANSACCIÓN -->
    <div class="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-4">
      <h2 class="text-sm font-semibold text-gray-300">➕ Crear Nueva Orden</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input id="buyer" placeholder="ID Comprador" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white">
        <input id="seller" placeholder="ID Vendedor" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white">
        <input id="amount" type="number" placeholder="Monto ($)" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white">
        <input id="desc" placeholder="Descripción" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white">
      </div>
      <button onclick="createTx()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-semibold transition">Crear Transacción</button>
    </div>

    <!-- LISTADO -->
    <div class="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-sm font-semibold text-gray-300">📋 Transacciones y Disputas</h2>
        <button onclick="loadData()" class="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300">🔄 Actualizar</button>
      </div>
      <div id="txList" class="space-y-3">Cargando datos...</div>
    </div>
  </div>

  <script>
    async function loadData() {
      const container = document.getElementById('txList');
      try {
        const res = await fetch('/api/escrow/all');
        const data = await res.json();
        if (!data.transactions || data.transactions.length === 0) {
          container.innerHTML = '<p class="text-xs text-gray-500">No hay transacciones registradas.</p>';
          return;
        }
        container.innerHTML = data.transactions.map(function(t) {
          var badge = 'bg-gray-800 text-gray-300';
          if (t.status === 'pending') badge = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
          if (t.status === 'funded') badge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          if (t.status === 'completed') badge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          if (t.status === 'disputed') badge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

          var actions = '';
          if (t.status === 'pending') {
            actions += '<button onclick="pay(\''+t.id+'\')" class="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1.5 rounded text-white font-medium">Acreditar Pago</button>';
          }
          if (t.status === 'funded') {
            actions += '<button onclick="complete(\''+t.id+'\')" class="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded text-white font-medium mr-1">Liberar</button>';
            actions += '<button onclick="dispute(\''+t.id+'\', \''+t.buyer_id+'\')" class="bg-rose-600 hover:bg-rose-500 text-xs px-3 py-1.5 rounded text-white font-medium">Reclamar</button>';
          }

          return '<div class="bg-gray-950 p-4 rounded-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">' +
            '<div>' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<span class="font-mono text-xs text-gray-500">'+t.id.substring(0,8)+'...</span>' +
                '<span class="text-xs px-2 py-0.5 rounded border '+badge+'">'+t.status.toUpperCase()+'</span>' +
              '</div>' +
              '<p class="text-sm font-medium text-gray-200">'+(t.description || 'Sin descripción')+'</p>' +
              '<p class="text-xs text-gray-500">Monto: <strong class="text-emerald-400">$'+t.amount+'</strong> | Comprador: '+t.buyer_id+' | Vendedor: '+t.seller_id+'</p>' +
            '</div>' +
            '<div class="flex items-center gap-2">'+actions+'</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        container.innerHTML = '<p class="text-xs text-rose-400">Error al cargar información.</p>';
      }
    }

    async function createTx() {
      var b = document.getElementById('buyer').value;
      var s = document.getElementById('seller').value;
      var a = document.getElementById('amount').value;
      var d = document.getElementById('desc').value;
      if (!b || !s || !a) { alert('Completar campos requeridos'); return; }
      await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ buyer_id: b, seller_id: s, amount: a, description: d })
      });
      document.getElementById('buyer').value = '';
      document.getElementById('seller').value = '';
      document.getElementById('amount').value = '';
      document.getElementById('desc').value = '';
      loadData();
    }

    async function pay(id) {
      await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, payment_status: 'approved' })
      });
      loadData();
    }

    async function complete(id) {
      await fetch('/api/escrow/status', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, status: 'completed' })
      });
      loadData();
    }

    async function dispute(id, buyerId) {
      var reason = prompt('Motivo del reclamo:');
      if (!reason) return;
      await fetch('/api/escrow/dispute/open', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, opened_by: buyerId, reason: reason })
      });
      loadData();
    }

    loadData();
  </script>
</body>
</html>
  `);
});

// 2. OBTENER TRANSACCIONES
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });
    const { data, error } = await supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 3. CREAR TRANSACCIÓN
app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });
    const { buyer_id, seller_id, amount, description } = req.body;
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

// 4. CAMBIAR ESTADO
app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });
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

// 5. WEBHOOK PAGO
app.post('/api/webhooks/payment', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });
    const { transaction_id, payment_status, payment_id } = req.body;
    if (['approved', 'completed', 'paid'].includes((payment_status || '').toLowerCase())) {
      const { data, error } = await supabase
        .from('escrow_transactions')
        .update({ status: 'funded', payment_id: payment_id || null })
        .eq('id', transaction_id)
        .select();
      if (error) return res.status(400).json({ error: error.message });
      await logEvent(supabase, transaction_id, 'PAYMENT_RECEIVED', { payment_id });
      return res.status(200).json({ status: 'OK', transaction: data[0] });
    }
    return res.status(200).json({ status: 'Ignorado' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// 6. ABRIR DISPUTA
app.post('/api/escrow/dispute/open', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración incompleta' });
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

export default app;
  
