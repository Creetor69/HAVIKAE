// @ts-nocheck
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

declare const Deno: any;

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbysJ4toCnp6RrcpWMVBNd1OmIBC5-yOBlSlqLpn-FnQ-VlLMbUHE0v-vsym24WmLllz/exec';

function escapeMarkdownV2(text: string): string {
  if (!text) return '';
  const charsToEscape = ['_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'];
  let escapedText = text.toString();
  for (const char of charsToEscape) {
    escapedText = escapedText.replace(new RegExp('\\' + char, 'g'), '\\' + char);
  }
  return escapedText;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*', 
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      } 
    });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const payload = await req.json();
    console.log('Received payload:', JSON.stringify(payload, null, 2));
    
    // Support both direct calls (payload) and DB triggers (payload.record)
    // For DB triggers, payload.type will be 'INSERT' or 'UPDATE'
    const isUpdate = payload.type === 'UPDATE';
    const oldRecord = payload.old_record;
    const newOrder = payload.record || payload; 
    
    if (!newOrder || !newOrder.user_id) {
        console.error('Invalid order data received:', newOrder);
        return new Response(JSON.stringify({ error: 'Invalid order data' }), { status: 400 });
    }

    // Determine if this is a "Shipped" notification trigger
    // Trigger if:
    // 1. Explicitly requested via payload.type === 'order_shipped'
    // 2. Database update where status changed from something else to 'Shipped'
    const isShippedTrigger = 
      payload.type === 'order_shipped' || 
      (isUpdate && oldRecord?.status !== 'Shipped' && newOrder.status === 'Shipped');

    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const chatId = Deno.env.get('TELEGRAM_CHAT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Fetch user profile for better email/name data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name, mobile')
      .eq('id', newOrder.user_id)
      .single();

    if (profileError) {
        console.warn('Could not fetch profile for user:', newOrder.user_id, profileError.message);
    }

    const customerName = profile?.name || newOrder.shipping_address?.name || 'Customer';
    const customerEmail = profile?.email || 'havikar@bhatco.com';
    const customerPhone = newOrder.shipping_address?.phone_number || newOrder.shipping_address?.mobile || profile?.mobile || 'Not provided';

    console.log(`Processing Order #${newOrder.order_number} for ${customerName} (${customerEmail}). Trigger Type: ${isShippedTrigger ? 'Shipped' : 'New Order'}`);

    // 1. Telegram Notification (Admin Only) - Only for New Orders
    if (!isShippedTrigger && botToken && chatId) {
        try {
            const addressParts = [
              newOrder.shipping_address?.address_line_1,
              newOrder.shipping_address?.address_line_2,
              `${newOrder.shipping_address?.city}, ${newOrder.shipping_address?.state} - ${newOrder.shipping_address?.postal_code}`,
            ];
            const formattedAddress = addressParts.filter(Boolean).map(escapeMarkdownV2).join('\n');
            const itemsList = (newOrder.items || [])
              .map(item => `\\- ${escapeMarkdownV2(item.name)} x ${item.quantity}`)
              .join('\n');

            const messageBody = `
*New Order Received on Havikar!* 🎉

*Order ID:* \`#${newOrder.order_number}\`
*Customer:* ${escapeMarkdownV2(customerName)}
*Phone:* ${escapeMarkdownV2(customerPhone)}

*Address:*
${formattedAddress}

*Items:*
${itemsList}

*Total: ₹${(newOrder.total || 0).toFixed(2).replace('.', '\\.')}*
*Payment:* ${escapeMarkdownV2(newOrder.payment_method || 'N/A')}
            `.trim();

            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: messageBody, parse_mode: 'MarkdownV2' }),
            });
            
            if (!tgRes.ok) {
                const tgErrData = await tgRes.text();
                console.error('Telegram API error:', tgErrData);
            }
        } catch (tgErr) {
            console.error('Telegram notification failed:', tgErr.message);
        }
    }

    // 2. Email Notification (Admin + Customer) via Google Script
    try {
      const shipping = newOrder.shipping_address || {};
      const emailPayload = {
        type: isShippedTrigger ? 'order_shipped' : 'new_order',
        orderNumber: newOrder.order_number,
        customerName: customerName,
        customerEmail: customerEmail,
        phone: customerPhone,
        // Address components
        addressLine1: shipping.address_line_1 || '',
        addressLine2: shipping.address_line_2 || '',
        city: shipping.city || '',
        state: shipping.state || '',
        pincode: shipping.postal_code || '',
        // Full address for fallback
        address: `${shipping.address_line_1}${shipping.address_line_2 ? ', ' + shipping.address_line_2 : ''}\n${shipping.city}, ${shipping.state} - ${shipping.postal_code}`,
        
        paymentMethod: newOrder.payment_method || 'N/A',
        couponCode: newOrder.coupon_code || 'None',
        
        // Financials
        total: newOrder.total || 0,
        discountAmount: (newOrder.discount_amount || 0) + (newOrder.points_redeemed || 0),
        shippingCharge: newOrder.shipping_amount || 0,
        subtotal: (newOrder.total || 0) - (newOrder.shipping_amount || 0) + (newOrder.discount_amount || 0) + (newOrder.points_redeemed || 0),
        
        items: newOrder.items || [],
        
        // Shipped specific fields
        shipDate: newOrder.shipped_at ? new Date(newOrder.shipped_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        courierName: newOrder.courier_name || 'Our Delivery Partner',
        trackingId: newOrder.tracking_id || newOrder.tracking_number || 'N/A',
        trackingLink: newOrder.tracking_link || '#',
        estimatedDays: '3-5'
      };

      console.log(`Sending ${emailPayload.type} email payload to Google Script...`);
      const emailRes = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });
      
      const emailResText = await emailRes.text();
      console.log('Google Script response:', emailResText);
      
      if (!emailRes.ok) {
          console.error('Google Script returned error status:', emailRes.status);
      }
    } catch (emailErr) {
      console.error('Email trigger failed:', emailErr.message);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 200,
    });

  } catch (error) {
    console.error('CRITICAL ERROR in order-alert:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      status: 500,
    });
  }
})
