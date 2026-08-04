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
// FRONTEND INTERACTIVO (CSS + JS NATIVO EMBEBIDO)
// =============================================================================
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Manager Pro</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f1f5f9; padding: 16px; margin: 0; }
    .container { max-width: 650px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 12px; }
    h2 { font-size: 18px; color: #10b981; margin: 0; }
    .card { background: #131c2e; border: 1px solid #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 16px; }
    h3 { font-size: 14px; margin-top: 0; color: #cbd5e1; margin-bottom: 12px; }
    input, select { background: #090d16; border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 8px; font-size: 13px; outline: none; }
    button { background: #059669; color: #fff; font-weight: bold; border: none; padding: 10px; border-radius: 8px; width: 100%; cursor: pointer; font-size: 13px; transition: background 0.2s; }
    button:hover { background: #10b981; }
    .btn-sm { width: auto; padding: 6px 10px; font-size: 11px; margin-right: 4px; }
    .btn-blue { background: #2563eb; } .btn-blue:hover { background: #3b82f6; }
    .btn-red { background: #dc2626; } .btn-red:hover { background: #ef4444; }
    .btn-gray { background: #334155; } .btn-gray:hover { background: #475569; }
    .item { background: #090d16; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; margin-top: 8px; }
    .flex { display: flex; justify-content: space-between; align-items: center; }
    .flex-wrap { display: flex; flex-wrap: wrap; gap: 4px; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #334155; text-transform: uppercase; font-weight: bold; display: inline-block; }
    .badge-pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
    .badge-funded { background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); }
    .badge-completed { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-disputed { background: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .fee-info { font-size: 11px; color: #94a3b8; margin-bottom: 8px; }
    .filter-bar { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 8px; }
    .error-box { background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; color: #f87171; padding: 10px; border-radius: 8px; font-size: 12px; font-mono: true; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>🛡️ Escrow System Pro</h2>
      <button class="btn-sm btn-gray" onclick="loadAll()">🔄 Actualizar</button>
    </div>

    <!-- CREAR ORDEN -->
    <div class="card">
      <h3>➕ Crear Nueva Orden de Escrow</h3>
      <input id="buyer" placeholder="ID Comprador (ej: cliente_01)">
      <input id="seller" placeholder="ID Vendedor (ej: vendedora_99)">
      <input id="amount" type="number" placeholder="Monto ($)" oninput="calcFee()">
      <div id="feeBox" class="fee-info">Plataforma retiene 3% de comisión.</div>
      <input id="desc" placeholder="Descripción del producto o servicio">
      <button onclick="createTx()">Crear Transacción Retenida</button>
    </div>

    <!-- LISTADO CON FILTROS -->
    <div class="card">
      <h3>📋 Transacciones Registradas</h3>
      <input id="searchInput" placeholder="🔍 Buscar por ID o descripción..." oninput="filterTx()">
      <div class="filter-bar">
        <button class="btn-sm btn-gray" onclick="setFilter('all')">Todas</button>
        <button class="btn-sm btn-gray" onclick="setFilter('pending')">Pendientes</button>
        <button class="btn-sm btn-gray" onclick="setFilter('funded')">Retenidas</button>
        <button class="btn-sm btn-gray" onclick="setFilter('completed')">Completadas</button>
        <button class="btn-sm btn-gray" onclick="setFilter('disputed')">Disputadas</button>
      </div>
      <div id="txList">Cargando datos...</div>
    </div>

    <!-- DISPUTAS -->
    <div class="card">
      <h3 style="color:#f59e0b;">⚖️ Centro de Disputas</h3>
      <div id="disputeList">Cargando disputas...</div>
    </div>
  </div>

  <script>
    let rawTransactions = [];
    let currentFilter = 'all';

    function calcFee() {
      const val = parseFloat(document.getElementById('amount').value);
      const box = document.getElementById('feeBox');
      if (isNaN(val) || val <= 0) {
        box.innerHTML = 'Plataforma retiene 3% de comisión.';
        return;
      }
      const fee = (val * 0.03).toFixed(2);
      const net = (val - fee).toFixed(2);
      box.innerHTML = 'Monto total: <strong>$' + val + '</strong> | Comisión (3%): <span style="color:#f59e0b;">$' + fee + '</span> | Neto a vendedor: <span style="color:#10b981;">$' + net + '</span>';
    }

    async function loadAll() {
      await Promise.all([loadTx(), loadDisputes()]);
    }

    async function loadTx() {
      const el = document.getElementById('txList');
      try {
        const r = await fetch('/api/escrow/all');
        const d = await r.json();
        
        if (!r.ok || d.error) {
          el.innerHTML = '<div class="error-box">⚠️ Error de Base de Datos: ' + (d.error || 'No se pudo conectar') + '</div>';
          return;
        }

        rawTransactions = d.transactions || [];
        filterTx();
      } catch(e) {
        el.innerHTML = '<div class="error-box">⚠️ Error de red al consultar el servidor.</div>';
      }
    }

    function setFilter(filter) {
      currentFilter = filter;
      filterTx();
    }

    function filterTx() {
      const el = document.getElementById('txList');
      const search = (document.getElementById('searchInput').value || '').toLowerCase();

      let list = rawTransactions.filter(t => {
        const matchesStatus = currentFilter === 'all' || t.status === currentFilter;
        const matchesSearch = (t.description || '').toLowerCase().includes(search) || 
                              (t.buyer_id || '').toLowerCase().includes(search) || 
                              (t.seller_id || '').toLowerCase().includes(search) ||
                              (t.id || '').toLowerCase().includes(search);
        return matchesStatus && matchesSearch;
      });

      if (!list.length) {
        el.innerHTML = '<p style="color:#64748b; font-size:12px;">No hay transacciones que coincidan.</p>';
        return;
      }

      el.innerHTML = list.map(t => {
        let badgeClass = 'badge-' + t.status;
        let btns = '';

        if (t.status === 'pending') {
          btns += '<button class="btn-sm btn-blue" onclick="pay(\\\'' + t.id + '\\\')">Simular Pago</button>';
        }
        if (t.status === 'funded') {
          btns += '<button class="btn-sm" onclick="complete(\\\'' + t.id + '\\\')">Liberar Fondos</button>';
          btns += '<button class="btn-sm btn-red" onclick="dispute(\\\'' + t.id + '\\\', \\\'' + t.buyer_id + '\\\')">Reclamar</button>';
        }

        const fee = (t.amount * 0.03).toFixed(2);
        const net = (t.amount - fee).toFixed(2);

        return '<div class="item flex">' +
          '<div>' +
            '<span class="badge ' + badgeClass + '">' + t.status + '</span> ' +
            '<small style="color:#64748b;">ID: ' + t.id.substring(0,8) + '...</small><br>' +
            '<strong style="font-size:14px; color:#f1f5f9;">' + (t.description || 'Sin descripción') + '</strong><br>' +
            '<span style="color:#10b981; font-weight:bold;">$' + t.amount + '</span> ' +
            '<small style="color:#94a3b8;">(Neto vendedor: $' + net + ')</small><br>' +
            '<small style="color:#64748b;">Comprador: ' + t.buyer_id + ' | Vendedor: ' + t.seller_id + '</small>' +
          '</div>' +
          '<div class="flex-wrap">' + btns + '</div>' +
        '</div>';
      }).join('');
    }

    async function loadDisputes() {
      const el = document.getElementById('disputeList');
      try {
        const r = await fetch('/api/escrow/disputes/all');
        const d = await r.json();

        if (!r.ok || d.error) {
          el.innerHTML = '<div class="error-box">⚠️ ' + (d.error || 'Error al obtener disputas') + '</div>';
          return;
        }

        if (!d.disputes || !d.disputes.length) {
          el.innerHTML = '<p style="color:#64748b; font-size:12px;">Sin disputas abiertas.</p>';
          return;
        }

        el.innerHTML = d.disputes.map(dp => {
          let btns = '';
          if (dp.status === 'open') {
            btns = '<button class="btn-sm btn-red" onclick="resolve(\\\'' + dp.id + '\\\', \\\'' + dp.transaction_id + '\\\', \\\'buyer\\\')">Reembolsar Comprador</button>' +
                   '<button class="btn-sm" onclick="resolve(\\\'' + dp.id + '\\\', \\\'' + dp.transaction_id + '\\\', \\\'seller\\\')">Pagar Vendedor</button>';
          } else {
            btns = '<span style="color:#10b981; font-size:11px; font-weight:bold;">Resuelto a favor de: ' + dp.winner_role + '</span>';
          }
          return '<div class="item flex">' +
            '<div>' +
              '<strong style="color:#f59e0b;">' + dp.reason + '</strong><br>' +
              '<small style="color:#64748b;">Iniciado por: ' + dp.opened_by + '</small>' +
            '</div>' +
            '<div>' + btns + '</div>' +
          '</div>';
        }).join('');
      } catch(e) {
        el.innerHTML = '<div class="error-box">⚠️ Error al cargar la lista de disputas.</div>';
      }
    }

    async function createTx() {
      const b = document.getElementById('buyer').value;
      const s = document.getElementById('seller').value;
      const a = document.getElementById('amount').value;
      const d = document.getElementById('desc').value;
      if (!b || !s || !a) return alert('Completar Comprador, Vendedor y Monto');
      
      const r = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ buyer_id: b, seller_id: s, amount: a, description: d })
      });
      const res = await r.json();
      if (!r.ok || res.error) {
        alert('Error al crear: ' + (res.error || 'Desconocido'));
        return;
      }

      document.getElementById('buyer').value = '';
      document.getElementById('seller').value = '';
      document.getElementById('amount').value = '';
      document.getElementById('desc').value = '';
      document.getElementById('feeBox').innerHTML = 'Plataforma retiene 3% de comisión.';
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

    async function dispute(id, buyerId) {
      const reason = prompt('Motivo del reclamo:');
      if (!reason) return;
      await fetch('/api/escrow/dispute/open', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ transaction_id: id, opened_by: buyerId, reason: reason })
      });
      loadAll();
    }

    async function resolve(disputeId, txId, winner) {
      await fetch('/api/escrow/dispute/resolve', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ dispute_id: disputeId, transaction_id: txId, winner_role: winner, resolution_notes: 'Resuelto por administrador' })
      });
      loadAll();
    }

    loadAll();
  </script>
</body>
</html>
  `);
});

// =============================================================================
// API ENDPOINTS
// =============================================================================

app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas en Vercel.' });
    const { data, error } = await supabase.from('escrow_transactions').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ status: 'OK', transactions: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas en Vercel.' });
    const { buyer_id, seller_id, amount, description } = req.body;
    if (!buyer_id || !seller_id || !amount) return res.status(400).json({ error: 'Comprador, vendedor y monto son obligatorios.' });
    
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
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas.' });
    const { transaction_id, status } = req.body;
    const { data, error } = await supabase.from('escrow_transactions').update({ status }).eq('id', transaction_id).select();
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
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas.' });
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
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas.' });
    const { transaction_id, opened_by, reason } = req.body;
    const { data: tx, error: txError } = await supabase.from('escrow_transactions').update({ status: 'disputed' }).eq('id', transaction_id).select();
    if (txError) return res.status(400).json({ error: txError.message });
    const { data: dispute, error: disputeError } = await supabase.from('escrow_disputes').insert([{ transaction_id, opened_by, reason, status: 'open' }]).select();
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
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas.' });
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
    if (!supabase) return res.status(500).json({ error: 'Variables SUPABASE_URL o SUPABASE_KEY no configuradas.' });
    const { dispute_id, transaction_id, winner_role, resolution_notes } = req.body;
    const finalStatus = winner_role === 'buyer' ? 'cancelled' : 'completed';
    const { data: tx, error: txError } = await supabase.from('escrow_transactions').update({ status: finalStatus }).eq('id', transaction_id).select();
    if (txError) return res.status(400).json({ error: txError.message });
    const { data: dispute, error: disputeError } = await supabase.from('escrow_disputes').update({ status: 'resolved', winner_role, resolution_notes: resolution_notes || '', resolved_at: new Date().toISOString() }).eq('id', dispute_id).select();
    if (disputeError) return res.status(400).json({ error: disputeError.message });
    await logEvent(supabase, transaction_id, 'DISPUTE_RESOLVED', { winner_role, resolution_notes });
    return res.status(200).json({ status: 'Disputa Resuelta', transaction: tx[0], dispute: dispute[0] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default app;
  
