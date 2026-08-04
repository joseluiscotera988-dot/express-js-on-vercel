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

app.post('/api/escrow/create', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });
    const { buyer_id, seller_id, amount, description } = req.body;
    if (!buyer_id || !seller_id || !amount) return res.status(400).json({ error: 'Faltan datos' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });
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
    if (!supabase) return res.status(500).json({ error: 'Falta configurar Supabase' });
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
      
