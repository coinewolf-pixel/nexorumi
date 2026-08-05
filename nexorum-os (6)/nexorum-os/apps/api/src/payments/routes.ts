import { Hono } from 'hono';
import { createClient } from '@supabase/supabase-js';
import { NexorumPaymentService, getTokenPrice, calculateDepositAmount } from './nowpayments';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  NEXORUM_CACHE: KVNamespace;
  NOWPAYMENTS_API_KEY: string;
  NOWPAYMENTS_IPN_SECRET: string;
}

const payments = new Hono<{ Bindings: Env }>();

function getSupabase(c: any) {
  return createClient(c.env.SUPABASE_URL, c.env.SUPABASE_SERVICE_KEY);
}

function getPaymentService(c: any) {
  return new NexorumPaymentService(c.env.NOWPAYMENTS_API_KEY, c.env.NOWPAYMENTS_IPN_SECRET, false);
}

payments.post('/deposit', async (c) => {
  const { userId, tokenType, tokenAmount, payCurrency } = await c.req.json();
  if (!userId || !tokenType || !tokenAmount || !payCurrency) {
    return c.json({ error: 'Missing required fields' }, 400);
  }

  const service = getPaymentService(c);
  const origin = c.req.header('origin') || 'https://nexorum-web.pages.dev';

  try {
    const { payment, record } = await service.createDeposit(
      userId, tokenType, tokenAmount, payCurrency,
      `${origin}/api/payments/ipn`,
      `${origin}/wallet?success=1`,
      `${origin}/wallet?cancel=1`,
    );

    const supabase = getSupabase(c);
    await supabase.from('payments').insert(record);

    return c.json({
      paymentId: payment.paymentId,
      payAddress: payment.payAddress,
      payAmount: payment.payAmount,
      payCurrency: payment.payCurrency,
      expirationDate: payment.expirationEstimateDate,
      orderId: record.orderId,
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(payment.payAddress)}`,
    });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

payments.get('/status/:paymentId', async (c) => {
  const paymentId = c.req.param('paymentId');
  const service = getPaymentService(c);
  try {
    const status = await service.nowpayments.getPaymentStatus(paymentId);
    return c.json(status);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

payments.post('/ipn', async (c) => {
  const payload = await c.req.json();
  const signature = c.req.header('x-nowpayments-sig') || '';
  const service = getPaymentService(c);

  if (!service.nowpayments.verifyIPN(JSON.stringify(payload), signature)) {
    return c.json({ error: 'Invalid signature' }, 403);
  }

  const result = await service.handleIPN(payload);

  if (result) {
    const supabase = getSupabase(c);
    await supabase.from('payments').update({
      status: payload.payment_status,
      updated_at: new Date().toISOString(),
      completed_at: payload.payment_status === 'finished' ? new Date().toISOString() : null,
    }).eq('payment_id', payload.payment_id);

    if (payload.payment_status === 'finished') {
      const { data: wallet } = await supabase.from('wallets')
        .select('*').eq('user_id', result.userId).eq('token_type', result.tokenType).single();

      if (wallet) {
        await supabase.from('wallets').update({
          balance: wallet.balance + result.tokenAmount,
          updated_at: new Date().toISOString(),
        }).eq('id', wallet.id);
      } else {
        await supabase.from('wallets').insert({
          user_id: result.userId, token_type: result.tokenType, balance: result.tokenAmount,
        });
      }

      await supabase.from('transactions').insert({
        user_id: result.userId, type: 'earn', token_type: result.tokenType,
        amount: result.tokenAmount, balance_after: (wallet?.balance || 0) + result.tokenAmount,
        metadata: { source: 'deposit', payment_id: payload.payment_id },
      });
    }

    return c.json({ success: true, credited: result.tokenAmount });
  }

  return c.json({ success: false });
});

payments.get('/currencies', async (c) => {
  const service = getPaymentService(c);
  try {
    const currencies = await service.getCurrencies();
    return c.json({ currencies });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

payments.get('/prices', (c) => {
  return c.json({ nexo: getTokenPrice('nexo'), hunt: getTokenPrice('hunt'), race: getTokenPrice('race'), fish: getTokenPrice('fish'), farm: getTokenPrice('farm'), surv: getTokenPrice('surv'), usd: 1 });
});

payments.get('/calculate', (c) => {
  const usdAmount = parseFloat(c.req.query('usd') || '0');
  const tokenType = c.req.query('token') || 'nexo';
  return c.json({ usd: usdAmount, token: tokenType, amount: calculateDepositAmount(usdAmount, tokenType) });
});

payments.get('/history/:userId', async (c) => {
  const userId = c.req.param('userId');
  const supabase = getSupabase(c);
  const { data, error } = await supabase.from('payments').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

export default payments;
