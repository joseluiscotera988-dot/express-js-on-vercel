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

// VISTA PRINCIPAL (CSS NATIVO SIN DEPENDENCIAS EXTERNAS)
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Escrow Panel</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #090d16; color: #f1f5f9; padding: 16px; margin: 0; }
    .container { max-width: 600px; margin: 0 auto; }
    .card { background: #131c2e; border: 1px solid #1e293b; padding: 16px; border-radius: 12px; margin-bottom: 16px; }
    h2 { font-size: 18px; color: #10b981; margin-top: 0; }
    h3 { font-size: 14px; margin-top: 0; color: #cbd5e1; }
    input { background: #090d16; border: 1px solid #334155; color: #fff; padding: 10px; border-radius: 8px; width: 100%; margin-bottom: 8px; font-size: 14px; outline: none; }
    button { background: #059669; color: #fff; font-weight: bold; border: none; padding: 10px; border-radius: 8px; width: 100%; cursor: pointer; font-size: 14px; }
    .btn-blue { background: #2563eb; }
    .btn-red { background: #dc2626; }
    .item { background: #090d16; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; margin-top: 8px; }
    .flex { display: flex; justify-content: space-between; align-items: center; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #334155; text-transform: uppercase; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <h2>🛡️ Escrow System Dashboard</h2>

    <div class="card">
      <h3>➕ Crear Nueva Orden</h3>
      <input id="buyer" placeholder="ID Comprador">
      <input id="seller" placeholder="ID Vendedor">
      <input id="amount" type="number" placeholder="Monto ($)">
      <input id="desc" placeholder="Descripción">
      <button onclick="createTx()">Crear Transacción</button>
    </div>

    <div class="card">
      <div class="flex">
        <h3>📋 Transacciones</h3>
        <button style="width:auto; padding: 6px 12px; background:#1e293b;" onclick="loadAll()">🔄 Actualizar</button>
      </div>
      <div id="txList">Cargando...</div>
    </div>

    <div class="card">
      <h3 style="color:#f59e0b;">⚖️ Disputas</h3>
      <div id="disputeList">Cargando...</div>
    </div>
  </div>

  <script>
    async function loadAll() {
      loadTx();
      loadDisputes();
    }

    async function loadTx() {
      const el = document.getElementById('txList');
      try {
        const r = await fetch('/api/escrow/all');
        const d = await r.json();
        if (!d.transactions || !d.transactions.length) {
          el.innerHTML = '<p style="color:#64748b; font-size:12px;">Sin transacciones.</p>';
          return;
        }
        el.innerHTML = d.transactions.map(t => {
          let btns = '';
          if (t.status === 'pending') btns += '<button class="btn-blue" style="width:auto; padding:6px 10px;" onclick="pay(\\\'' + t.id + '\\\')">Pagar</button>';
          if (t.status === 'funded') {
            btns += '<button style="width:auto; padding:6px 10px;" onclick="complete(\\\'' + t.id + '\\\')">Liberar</button> ';
            btns += '<button class="btn-red" style="width:auto; padding:6px 10px;" onclick="dispute(\\\'' + t.id + '\\\', \\\'' + t.buyer_id + '\\\')">Reclamar</button>';
          }
          return '<div class="item flex">' +
            '<div>' +
              '<span class="badge">' + t.status + '</span><br>' +
              '<strong style="font-size:14px;">' + (t.description || 'Sin desc') + '</strong> <span style="color:#10b981;">$' + t.amount + '</span><br>' +
              '<small style="color:#64748b;">C: ' + t.buyer_id + ' | V: ' + t.seller_id + '</small>' +
            '</div>' +
            '<div>' + btns + '</div>' +
          '</div>';
        }).join('');
      } catch(e) { el.innerHTML = 'Error al cargar.'; }
    }

    async function loadDisputes() {
      const el = document.getElementById('disputeList');
      try {
        const r = await fetch('/api/escrow/disputes/all');
        const d = await r.json();
        if (!d.disputes || !d.disputes.length) {
          el.innerHTML = '<p style="color:#64748b; font-size:12px;">Sin disputas.</p>';
          return;
        }
        el.innerHTML = d.disputes.map(dp => {
          let btns = '';
          if (dp.status === 'open') {
            btns = '<button class="btn-red" style="width:auto; padding:6px 10px;" onclick="resolve(\\\'' + dp.id + '\\\', \\\'' + dp.transaction_id + '\\\', \\\'buyer\\\')">Comprador</button> ' +
                   '<button style="width:auto; padding:6px 10px;" onclick="resolve(\\\'' + dp.id + '\\\', \\\'' + dp.transaction_id + '\\\', \\\'seller\\\')">Vendedor</button>';
          } else {
            btns = '<span style="color:#10b981;">Ganador: ' + dp.winner_role + '</span>';
          }
          return '<div class="item flex">' +
            '<div><strong>' + dp.reason + '</strong><br><small style="color:#64748b;">Por: ' + dp.opened_by + '</small></div>' +
            '<div>' + btns + '</div>' +
          '</div>';
        }).join('');
      } catch(e) { el.innerHTML = 'Error al cargar disputas.'; }
    }

    async function createTx() {
      const b = document.getElementById('buyer').value;
      const s = document.getElementById('seller').value;
      const a = document.getElementById('amount').value;
      const d = document.getElementById('desc').value;
      if (!b || !s || !a) return alert('Completar datos obligatorios');
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
        body: JSON.stringify({ transaction_id: id, payment_status: 'approved' })
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
        body: JSON.stringify({ dispute_id: disputeId, transaction_id: txId, winner_role: winner, resolution_notes: 'Resuelto por admin' })
      });
      loadAll();
    }

    loadAll();
  </script>
</body>
</html>
  `);
});

// RUTAS API REST
app.get('/api/escrow/all', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
    const { buyer_id, seller_id, amount, description } = req.body;
    if (!buyer_id || !seller_id || !amount) return res.status(400).json({ error: 'Faltan campos' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta Supabase' });
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
