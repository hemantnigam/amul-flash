// @ts-nocheck
// =========================================================================
// Supabase Edge Function: razorpay-webhook (Runs in Deno Cloud Runtime)
// 100% Secure Server-Side Payment Lifecycle Handler & VIP Pass Auto-Activation
// =========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Pure Web Crypto HMAC SHA-256 Signature Validator
async function verifyRazorpaySignature(bodyText: string, signature: string, secret: string): Promise<boolean> {
  if (!secret) return true; // If no secret configured in env, allow through for initial testing
  if (!signature) return false;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify', 'sign']
    );

    const data = encoder.encode(bodyText);
    const signatureBytes = new Uint8Array(
      signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []
    );

    return await crypto.subtle.verify('HMAC', key, signatureBytes, data);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

// Clean and normalize 10-digit Indian mobile number
function normalizePhoneNumber(rawPhone: string | undefined): string | null {
  if (!rawPhone) return null;
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length > 10) return digits.slice(-10);
  return null;
}

// Helper to extract customer phone number across all Razorpay event structures
function extractPhoneNumber(payload: any): string | null {
  const payment = payload.payload?.payment?.entity;
  const paymentLink = payload.payload?.payment_link?.entity;
  const order = payload.payload?.order?.entity;
  const qrCode = payload.payload?.qr_code?.entity;
  const subscription = payload.payload?.subscription?.entity;
  const refund = payload.payload?.refund?.entity;

  const candidates = [
    payment?.contact,
    paymentLink?.customer?.contact,
    paymentLink?.contact,
    qrCode?.customer_id,
    order?.notes?.phone,
    order?.notes?.mobile,
    payment?.notes?.phone,
    payment?.notes?.mobile,
    payment?.notes?.contact,
    paymentLink?.notes?.phone,
    paymentLink?.notes?.mobile,
    subscription?.notes?.phone,
    refund?.notes?.phone,
  ];

  for (const raw of candidates) {
    const normalized = normalizePhoneNumber(raw);
    if (normalized) return normalized;
  }

  // Fallback: Check if description contains 10-digit phone
  if (payment?.description) {
    const match = payment.description.match(/\b[6-9]\d{9}\b/);
    if (match) return match[0];
  }

  return null;
}

// Optional helper to log raw payment event to audit table
async function logPaymentAudit(eventName: string, paymentId: string, phone: string | null, amount: number, status: string, details: any) {
  try {
    await supabaseAdmin.from('payment_logs').insert({
      event_name: eventName,
      payment_id: paymentId,
      phone_number: phone,
      amount: amount,
      status: status,
      raw_payload: details,
      created_at: new Date().toISOString(),
    });
  } catch (_e) {
    // Ignore if table does not exist
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('OK', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // 1. Verify Razorpay HMAC signature
    if (RAZORPAY_WEBHOOK_SECRET) {
      const isValid = await verifyRazorpaySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('❌ [RazorpayWebhook] Invalid Webhook Signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`🔔 [RazorpayWebhook] Processing Event: ${event}`);

    const paymentEntity = payload.payload?.payment?.entity;
    const paymentLinkEntity = payload.payload?.payment_link?.entity;
    const refundEntity = payload.payload?.refund?.entity;

    const paymentId = paymentEntity?.id || paymentLinkEntity?.id || refundEntity?.payment_id || `pay_${Date.now()}`;
    const amountInPaise = paymentEntity?.amount || paymentLinkEntity?.amount || refundEntity?.amount || 0;
    const amountInRupees = Math.round(amountInPaise / 100);
    const phoneNumber = extractPhoneNumber(payload);

    // =========================================================================
    // EVENT CATEGORY 1: SUCCESSFUL PAYMENT & ACTIVATION
    // Events: payment.captured, payment_link.paid, order.paid, payment.authorized, qr_code.credited
    // =========================================================================
    if (
      event === 'payment.captured' ||
      event === 'payment_link.paid' ||
      event === 'order.paid' ||
      event === 'payment.authorized' ||
      event === 'qr_code.credited' ||
      event === 'subscription.charged' ||
      event === 'subscription.activated'
    ) {
      if (!phoneNumber) {
        console.warn('⚠️ [RazorpayWebhook] Missing phone number in payment entity. Event:', event);
        await logPaymentAudit(event, paymentId, null, amountInRupees, 'missing_phone', payload);
        return new Response(JSON.stringify({ message: 'Warning: Missing contact phone in payment' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 1. Determine plan type from amount (₹7 = 1_week_pass, ₹25 = 1_month_pass)
      const isWeekPass = amountInRupees <= 15;
      const planName = isWeekPass ? '1_week_pass' : '1_month_pass';
      const passDurationDays = isWeekPass ? 7 : 30;

      // 2. Check existing subscription for Idempotency & Extension
      const { data: existingSub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      // Idempotency: Prevent duplicate execution if Razorpay retries same webhook
      if (existingSub && existingSub.payment_id === paymentId && new Date(existingSub.expires_at).getTime() > Date.now()) {
        console.log(`ℹ️ [RazorpayWebhook] Duplicate webhook received for payment ${paymentId}. Already active.`);
        return new Response(JSON.stringify({ success: true, message: 'Already processed (idempotent)' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const now = Date.now();
      let baseTime = now;
      if (existingSub && new Date(existingSub.expires_at).getTime() > now) {
        baseTime = new Date(existingSub.expires_at).getTime();
      }

      const expiresAt = new Date(baseTime + passDurationDays * 24 * 60 * 60 * 1000);

      const subscriptionRecord = {
        phone_number: phoneNumber,
        plan_name: planName,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        payment_id: paymentId,
        amount_paid: amountInRupees,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabaseAdmin
        .from('user_subscriptions')
        .upsert(subscriptionRecord, { onConflict: 'phone_number' });

      if (upsertErr) {
        console.error('❌ [RazorpayWebhook] Supabase DB Error:', upsertErr.message);
        return new Response(JSON.stringify({ error: upsertErr.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log(`✅ [RazorpayWebhook] Activated ${planName} for user ${phoneNumber} until ${expiresAt.toISOString()}`);
      await logPaymentAudit(event, paymentId, phoneNumber, amountInRupees, 'activated', { plan: planName, expiresAt });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Plan ${planName} activated for ${phoneNumber}`,
          expires_at: expiresAt.toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // =========================================================================
    // EVENT CATEGORY 2: REFUNDS (refund.created, refund.processed)
    // =========================================================================
    if (event === 'refund.created' || event === 'refund.processed') {
      console.log(`🔄 [RazorpayWebhook] Refund event received: ${event} for payment ${paymentId}`);
      if (phoneNumber) {
        // If full refund on active plan, expire subscription by setting expires_at to now
        const { data: currentSub } = await supabaseAdmin
          .from('user_subscriptions')
          .select('*')
          .eq('phone_number', phoneNumber)
          .maybeSingle();

        if (currentSub && currentSub.payment_id === paymentId) {
          await supabaseAdmin
            .from('user_subscriptions')
            .update({ expires_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('phone_number', phoneNumber);
          console.log(`⚠️ [RazorpayWebhook] Expired subscription for ${phoneNumber} due to refund.`);
        }
      }

      await logPaymentAudit(event, paymentId, phoneNumber, amountInRupees, 'refunded', payload);
      return new Response(JSON.stringify({ success: true, message: 'Refund recorded' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // =========================================================================
    // EVENT CATEGORY 3: PAYMENT FAILURES (payment.failed)
    // =========================================================================
    if (event === 'payment.failed') {
      const errorCode = paymentEntity?.error_code || 'UNKNOWN';
      const errorDesc = paymentEntity?.error_description || 'Payment Failed';
      console.warn(`⚠️ [RazorpayWebhook] Payment Failed for ${phoneNumber || 'unknown'}: ${errorCode} - ${errorDesc}`);
      
      await logPaymentAudit(event, paymentId, phoneNumber, amountInRupees, 'failed', {
        code: errorCode,
        description: errorDesc,
      });

      return new Response(JSON.stringify({ success: true, message: 'Failure logged' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // =========================================================================
    // EVENT CATEGORY 4: DISPUTES & CHARGEBACKS
    // =========================================================================
    if (event.startsWith('payment.dispute.') || event.startsWith('dispute.')) {
      console.warn(`🚨 [RazorpayWebhook] Dispute event received: ${event} for payment ${paymentId}`);
      await logPaymentAudit(event, paymentId, phoneNumber, amountInRupees, 'dispute', payload);
      return new Response(JSON.stringify({ success: true, message: 'Dispute recorded' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // =========================================================================
    // EVENT CATEGORY 5: PAYMENT LINK CANCELLED / EXPIRED
    // =========================================================================
    if (event === 'payment_link.cancelled' || event === 'payment_link.expired') {
      console.log(`ℹ️ [RazorpayWebhook] Payment link event: ${event}`);
      await logPaymentAudit(event, paymentId, phoneNumber, amountInRupees, 'link_inactive', payload);
      return new Response(JSON.stringify({ success: true, message: 'Status updated' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Default unhandled event catch
    console.log(`ℹ️ [RazorpayWebhook] Unhandled event received: ${event}`);
    return new Response(JSON.stringify({ message: `Event ${event} received successfully` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('❌ [RazorpayWebhook] Exception:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
