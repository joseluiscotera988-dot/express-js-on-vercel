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

// =============================================================================
// INTERFAZ GRÁFICA EN LA RAÍZ (GET /)
// =============================================================================
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Central Operations</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen p-4 md:p-8 font-sans">
  <div class="max-w-5xl mx-auto space-y-6">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-2">
      <div>
        <h1 class="text-2xl font-bold text-emerald-400">🛡️ Escrow System Panel</h1>
        <p class="text-xs text-gray-400">Panel Operativo Completo: Transacciones, Pagos, Disputas y Auditoría</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">● EN LÍNEA</span>
        <button onclick="loadAll()" class="text-xs bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-lg border border-gray-700 text-gray-300">🔄 Recargar</button>
      </div>
    </div>

    <!-- 1. CREAR NUEVA ORDEN -->
    <div class="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-3 shadow-lg">
      <h2 class="text-sm font-semibold text-gray-200">➕ 1. Crear Orden de Escrow</h2>
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <input id="buyer" placeholder="ID Comprador" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white focus:border-emerald-500">
        <input id="seller" placeholder="ID Vendedor" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white focus:border-emerald-500">
        <input id="amount" type="number" placeholder="Monto ($)" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white focus:border-emerald-500">
        <input id="desc" placeholder="Descripción servicio/producto" class="bg-gray-800 p-2.5 text-sm rounded-lg border border-gray-700 outline-none text-white focus:border-emerald-500">
      </div>
      <button onclick="createTx()" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-semibold transition">Crear Transacción</button>
    </div>

    <!-- 2. TRANSACCIONES ACTIVAS -->
    <div class="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-3 shadow-lg">
      <h2 class="text-sm font-semibold text-gray-200">📋 2. Operaciones de Transacciones</h2>
      <div id="txList" class="space-y-3">Cargando transacciones...</div>
    </div>

    <!-- 3. PANEL DE DISPUTAS Y RECLAMOS -->
    <div class="bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-3 shadow-lg">
      <h2 class="text-sm font-semibold text-amber-400">⚖️ 3. Centro de Resoluciones (Disputas)</h2>
      <div id="disputeList" class="space-y-3">Cargando disputas...</div>
    </div>

    <!-- 4. VISOR DE AUDITORÍA Y LOGS -->
    <div id="logSection" class="hidden bg-gray-900 p-5 rounded-xl border border-gray-800 space-y-3 shadow-lg">
      <div class="flex justify-between items-center">
        <h2 class="text-sm font-semibold text-blue-400">📜 4. Historial de Auditoría (Logs)</h2>
        <button onclick="closeLogs()" class="text-xs text-gray-400 hover:text-white">✕ Cerrar</button>
      </div>
      <div id="logList" class="space-y-2 text-xs font-mono bg-gray-950 p-4 rounded-lg border border-gray-800 max-h-60 overflow-y-auto"></div>
    </div>

  </div>

  <script>
    async function loadAll() {
      await Promise.all([loadTx(), loadDisputes()]);
    }

    async function loadTx() {
      const container = document.getElementById('txList');
      try {
        const res = await fetch('/api/escrow/all');
        const data = await res.json();
        if (!data.transactions || data.transactions.length === 0) {
          container.innerHTML = '<p class="text-xs text-gray-500">No hay transacciones guardadas.</p>';
          return;
        }
        container.innerHTML = data.transactions.map(function(t) {
          var badge = 'bg-gray-800 text-gray-300';
          if (t.status === 'pending') badge = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
          if (t.status === 'funded') badge = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
          if (t.status === 'completed') badge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          if (t.status === 'disputed') badge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
          if (t.status === 'cancelled') badge = 'bg-gray-500/10 text-gray-400 border-gray-500/20';

          var actions = '<button onclick="viewLogs(\\\''+t.id+'\\\')" class="bg-gray-800 hover:bg-gray-700 text-xs px-2.5 py-1.5 rounded text-gray-300 border border-gray-700">Logs</button>';

          if (t.status === 'pending') {
            actions += '<button onclick="pay(\\\''+t.id+'\\\')" class="bg-blue-600 hover:bg-blue-500 text-xs px-3 py-1.5 rounded text-white font-medium ml-1">Simular Pago</button>';
            actions += '<button onclick="cancelTx(\\\''+t.id+'\\\')" class="bg-gray-700 hover:bg-gray-600 text-xs px-2.5 py-1.5 rounded text-white font-medium ml-1">Cancelar</button>';
          }
          if (t.status === 'funded') {
            actions += '<button onclick="complete(\\\''+t.id+'\\\')" class="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded text-white font-medium ml-1">Liberar Fondos</button>';
            actions += '<button onclick="openDispute(\\\''+t.id+'\\\', \\\''+t.buyer_id+'\\\')" class="bg-rose-600 hover:bg-rose-500 text-xs px-3 py-1.5 rounded text-white font-medium ml-1">Abrir Reclamo</button>';
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
            '<div class="flex items-center gap-1 flex-wrap">'+actions+'</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        container.innerHTML = '<p class="text-xs text-rose-400">Error al cargar datos.</p>';
      }
    }

    async function loadDisputes() {
      const container = document.getElementById('disputeList');
      try {
        const res = await fetch('/api/escrow/disputes/all');
        const data = await res.json();
        if (!data.disputes || data.disputes.length === 0) {
          container.innerHTML = '<p class="text-xs text-gray-500">No hay disputas registradas.</p>';
          return;
        }
        container.innerHTML = data.disputes.map(function(d) {
          var statusColor = d.status === 'open' ? 'text-amber-400' : 'text-emerald-400';
          var actions = '';
          if (d.status === 'open') {
            actions = '<div class="flex gap-2 mt-2">' +
              '<button onclick="resolveDispute(\\\''+d.id+'\\\', \\\''+d.transaction_id+'\\\', \\\''+'buyer'+'\\\')" class="bg-rose-600 hover:bg-rose-500 text-xs px-3 py-1 rounded text-white">Reembolsar Comprador</button>' +
              '<button onclick="resolveDispute(\\\''+d.id+'\\\', \\\''+d.transaction_id+'\\\', \\\''+'seller'+'\\\')" class="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1 rounded text-white">Pagar Vendedor</button>' +
            '</div>';
          } else {
            actions = '<p class="text-xs text-emerald-400 mt-1">Resuelto a favor de: <strong>'+d.winner_role+'</strong></p>';
          }

          return '<div class="bg-gray-950 p-3.5 rounded-xl border border-amber-500/20 space-y-1">' +
            '<div class="flex justify-between items-center text-xs text-gray-400">' +
              '<span>Disputa: '+d.id.substring(0,8)+'...</span>' +
              '<span class="font-bold '+statusColor+'">'+d.status.toUpperCase()+'</span>' +
            '</div>' +
            '<p class="text-xs text-gray-200"><strong>Motivo:</strong> '+d.reason+'</p>' +
            '<p class="text-xs text-gray-500">Iniciado por: '+d.opened_by+'</p>' +
            actions +
          '</div>';
        }).join('');
      } catch(e) {
        container.innerHTML = '<p class="text-xs text-rose-400">Error al cargar disputas.</p>';
      }
    }

    async function createTx() {
      var b = document.getElementById('buyer').value;
      var s = document.getElementById('seller').value;
      var a = document.getElementById('amount').value;
      var d = document.getElementById('desc').value;
      if (!b || !s || !a) { alert('Completar ID Comprador, ID Vendedor y Monto'); return; }
      await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ buyer_id: b, seller_id: s, amount: a, description: d })
      });
      document.getElementById('buyer').value = '';
      document.getElementById('seller').value = '';
      document.getElementById('amount').value = '';
      document.getElementById('desc').value = '';
      loadAll();
    }

    async function pay(id) {
      await fetch('/api/webhooks/payment', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, payment_status: 'approved', payment_id: 'PAY_' + Date.now() })
      });
      loadAll();
    }

    async function complete(id) {
      await fetch('/api/escrow/status', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, status: 'completed' })
      });
      loadAll();
    }

    async function cancelTx(id) {
      await fetch('/api/escrow/status', {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, status: 'cancelled' })
      });
      loadAll();
    }

    async function openDispute(id, buyerId) {
      var reason = prompt('Motivo de la disputa/reclamo:');
      if (!reason) return;
      await fetch('/api/escrow/dispute/open', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, opened_by: buyerId, reason: reason })
      });
      loadAll();
    }

    async function resolveDispute(disputeId, txId, winner) {
      var notes = prompt('Notas de resolución administrativa:');
      await fetch('/api/escrow/dispute/resolve', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ dispute_id: disputeId, transaction_id: txId, winner_role: winner, resolution_notes: notes || 'Resuelto desde panel' })
      });
      loadAll();
    }

    async function viewLogs(id) {
      const sec = document.getElementById('logSection');
      const container = document.getElementById('logList');
      sec.classList.remove('hidden');
      container.innerHTML = 'Cargando historial...';
      try {
        const res = await fetch('/api/escrow/logs/' + id);
        const data = await res.json();
        if (!data.logs || data.logs.length === 0) {
          container.innerHTML = '<p class="text-gray-500">Sin registros para esta orden.</p>';
          return;
        }
        container.innerHTML = data.logs.map(function(l) {
          return '<div class="border-b border-gray-800 pb-1 mb-1">' +
            '<span class="text-emerald-400">['+new Date(l.created_at).toLocaleTimeString()+']</span> ' +
            '<strong class="text-gray-200">'+l.event+'</strong> - ' +
            '<span class="text-gray-400">'+JSON.stringify(l.details || {})+'</span>' +
          '</div>';
        }).join('');
      } catch(e) {
        container.innerHTML = 'Error al cargar logs.';
      }
    }

    function closeLogs() {
      document.getElementById('logSection').classList.add('hidden');
    }

    loadAll();
  </script>
</body>
</html>
  `);
});

// =============================================================================
// API REST ENDPOINTS
// =============================================================================

app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
    const { data, error } = await supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.get('/api/escrow/:id', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
    const { id } = req.params;
    const { data, error } = await supabase.from('escrow_transactions').select('*').eq('id', id).single();
    if (error) return res.status(404).json({ error: 'Transacción no encontrada' });
    return res.status(200).json({ status: 'OK', transaction: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
    const { buyer_id, seller_id, amount, description } = req.body;
    if (!buyer_id || !seller_id || !amount) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
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

app.patch('/api/escrow/status', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
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

app.post('/api/webhooks/payment', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
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

app.post('/api/escrow/dispute/open', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
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

app.get('/api/escrow/disputes/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
    const { data, error } = await supabase.from('escrow_disputes').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'OK', disputes: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.post('/api/escrow/dispute/resolve', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Configuración de Supabase no encontrada' });
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

    a
