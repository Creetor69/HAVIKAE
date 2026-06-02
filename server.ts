import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Admin Route: Generate Product Data with Gemini
app.post("/api/admin/generate-product", async (req, res) => {
    try {
        const { url, name } = req.body;
        if (!url && !name) return res.status(400).json({ error: "URL or Name required" });

        console.log(`Generating product data for: ${url || name}`);

        let context = "";
        if (url) {
            try {
                const fetchRes = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' }
                });
                if (fetchRes.ok) {
                    const html = await fetchRes.text();
                    context = html.slice(0, 10000);
                }
            } catch (e) {
                console.error("Scraping failed, falling back to name only", e);
            }
        }

        const prompt = `Generate a detailed product JSON for an e-commerce site specializing in traditional South Indian food (Havikar).
        Product Name/URL: ${url || name}
        Context: ${context}
        
        The JSON MUST follow this structure:
        {
            "name": "string",
            "tagline": "string (short catchy phrase)",
            "description": "string (multiline, storytelling style)",
            "spice_level": "None" | "Mild" | "Medium" | "Hot",
            "is_vegan": boolean,
            "benefits": "string (newline separated benefits)",
            "how_to_use": "string",
            "ingredients": ["string", "string"],
            "meta_title": "string",
            "meta_description": "string",
            "meta_keywords": "string (comma separated)",
            "gst_rate": number (usually 5 or 12),
            "variants": [
                { "net_weight": "string", "price": number, "mrp": number, "stock_quantity": number }
            ]
        }
        
        If it's a spice blend or snack, be very detailed about the taste and tradition.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        tagline: { type: Type.STRING },
                        description: { type: Type.STRING },
                        spice_level: { type: Type.STRING },
                        is_vegan: { type: Type.BOOLEAN },
                        benefits: { type: Type.STRING },
                        how_to_use: { type: Type.STRING },
                        ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
                        meta_title: { type: Type.STRING },
                        meta_description: { type: Type.STRING },
                        meta_keywords: { type: Type.STRING },
                        gst_rate: { type: Type.NUMBER },
                        variants: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    net_weight: { type: Type.STRING },
                                    price: { type: Type.NUMBER },
                                    mrp: { type: Type.NUMBER },
                                    stock_quantity: { type: Type.NUMBER }
                                }
                            }
                        }
                    }
                }
            }
        });

        const data = JSON.parse(response.text);
        res.json(data);

    } catch (error: any) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Proxy for metadata extraction
app.post("/api/admin/fetch-metadata", async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });

        const hostname = new URL(url).hostname;
        const fetchRes = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36' }
        });
        
        if (!fetchRes.ok) throw new Error("Failed to fetch site");
        const html = await fetchRes.text();

        const getMeta = (prop: string) => {
            const regex = new RegExp(`<meta[^>]+(?:property|name)=["'](?:og:)?${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
            return html.match(regex)?.[1] || null;
        };

        const result = {
            title: getMeta('title') || html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || hostname,
            description: getMeta('description') || '',
            image: getMeta('image') || '',
            source: getMeta('site_name') || hostname,
            url: url,
            video: getMeta('video') || getMeta('video:secure_url') || null
        };

        res.json(result);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// Proxy route for offline WhatsApp sending
app.post("/api/offline/send-whatsapp", async (req, res) => {
    try {
        const { phoneId, token, payload } = req.body;
        if (!phoneId || !token || !payload) {
            return res.status(400).json({ error: "phoneId, token, and payload are required arguments." });
        }

        console.log(`[PROXY OFFLINE] Sending Meta WhatsApp message via ${phoneId}`);
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const data = await metaRes.json();
        if (metaRes.ok) {
            return res.json(data);
        } else {
            console.error("[PROXY OFFLINE] Meta rejection:", data);
            return res.status(metaRes.status).json({ error: data?.error || { message: "Failed during Facebook API response" } });
        }
    } catch (err: any) {
        console.error("[PROXY OFFLINE] Network error:", err);
        return res.status(500).json({ error: { message: err.message } });
    }
});

// Website (Online) Orders WhatsApp Triggers
app.post("/api/online/send-whatsapp-order", async (req, res) => {
    try {
        const { order, userName, userMobile } = req.body;
        if (!order) {
            return res.status(400).json({ error: "order parameter is required." });
        }

        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1066359256570178';
        const token = process.env.WHATSAPP_ACCESS_TOKEN || 'EAA3srEndgnwBRuR8l2uyJpNQg61bicvde6X8XZBvZBBfcIvbiJnaH8hKM5oUbzJxxkO5mc3JnoFQvOWKPO53gElRlrshpZCAYb2tZATTjzDLGlZClZBlqtTYCetVsCFXTmIPZBbw3CDrZCMHaKrMSTsWPVec6sUIJbZCiZByhDncRo76B7E89nDDUiAC3tvVZCI5AVZCZCQZDZD';
        const templateName = process.env.WHATSAPP_TEMPLATE_NAME || 'hav_orders';

        console.log(`[ONLINE WHATSAPP] Constructing website order WhatsApp template trigger for order ${order.order_number || order.id}`);

        // Helper to cleanly sanitize numbers to standard Meta (E.164 without plus) e.g. 91xxxxxxxxxx
        const cleanAndFormatMobile = (num: string) => {
            const sanitized = num.replace(/\D/g, '');
            if (sanitized.length < 10) return null;
            return sanitized.startsWith('91') || sanitized.length > 10 ? sanitized : '91' + sanitized;
        };

        const targetNumbers: string[] = [];

        // 1. Customer's phone number
        const customerNum = cleanAndFormatMobile(userMobile || order.shipping_address?.phone_number || '');
        if (customerNum) {
            targetNumbers.push(customerNum);
        }

        // 2. Alert Number 1: 8296925577
        const alert1 = cleanAndFormatMobile('8296925577');
        if (alert1 && !targetNumbers.includes(alert1)) {
            targetNumbers.push(alert1);
        }

        // 3. Alert Number 2: 9845024156
        const alert2 = cleanAndFormatMobile('9845024156');
        if (alert2 && !targetNumbers.includes(alert2)) {
            targetNumbers.push(alert2);
        }

        console.log(`[ONLINE WHATSAPP] Selected destination recipient phone numbers:`, targetNumbers);

        const isPaid = order.payment_id || order.payment_method === 'Razorpay' || order.status === 'Payment Received' || order.payment_status === 'Paid Full';
        const displayPaymentStatus = isPaid
            ? "Paid securely! 💳 Thank you"
            : `Payment due: ₹${order.total}`;

        const customerNameStr = userName || order.shipping_address?.name || 'Customer';
        const orderRefStr = order.order_number || order.id.split('-')[1]?.toUpperCase() || 'ORDER';
        const billAmtStr = `₹${order.total}`;

        const results = [];

        for (const recipient of targetNumbers) {
            const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: recipient,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: "en"
                    },
                    components: [
                        {
                            type: "body",
                            parameters: [
                                { type: "text", text: customerNameStr },
                                { type: "text", text: orderRefStr },
                                { type: "text", text: billAmtStr },
                                { type: "text", text: displayPaymentStatus }
                            ]
                        }
                    ]
                }
            };

            try {
                console.log(`[ONLINE WHATSAPP] Dispatching template request to Facebook Graph API for recipient ${recipient}`);
                const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();
                results.push({ recipient, success: response.ok, data });
            } catch (err: any) {
                console.error(`[ONLINE WHATSAPP] Error sending to ${recipient}:`, err.message);
                results.push({ recipient, success: false, error: err.message });
            }
        }

        return res.json({ success: true, results });

    } catch (err: any) {
        console.error("[ONLINE WHATSAPP] Server route failure:", err);
        return res.status(500).json({ error: err.message });
    }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
