import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

import { spawn } from 'child_process';
import path from 'path';

// ── Health Check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'CapAble Enterprise API is running optimally.',
        timestamp: new Date().toISOString(),
    });
});

// ── Serper API Proxy (SECURITY: Hide API key from client) ─────────────────────
app.post('/api/jobs/search', async (req, res) => {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'SERPER_API_KEY not configured on server' });
    }

    try {
        const response = await fetch('https://google.serper.dev/search', {
            method: 'POST',
            headers: {
                'X-API-KEY': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            throw new Error(`Serper API error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Serper proxy error:', error);
        res.status(500).json({ error: 'Failed to fetch jobs from Serper' });
    }
});

// ── Mail Trigger (Replaces Firebase Extension) ─────────────────────────────────
app.post('/api/mail', async (req, res) => {
    const { to, subject, html } = req.body;
    if (!to || !subject || !html) return res.status(400).json({ error: 'Missing email parameters' });

    // Note: To use this in production, set SMTP_HOST, SMTP_USER, SMTP_PASS in .env
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: Number(process.env.SMTP_PORT) || 587,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"CapAble" <noreply@capable.ai>',
            to,
            subject,
            html,
        });
        res.status(200).json({ success: true, messageId: info.messageId });
    } catch (error) {
        console.error('Mail error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// ── Python NLP Resume Parser ───────────────────────────────────────────────────
app.post('/api/parse-resume', (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'No resume text provided' });

    const scriptPath = path.join(process.cwd(), 'scripts', 'nlp_parser.py');
    const pythonProcess = spawn('python', [scriptPath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => { dataString += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorString += data.toString(); });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error('Python script error:', errorString);
            return res.status(500).json({ error: 'Python parser failed' });
        }
        try {
            res.json(JSON.parse(dataString));
        } catch {
            res.status(500).json({ error: 'Invalid JSON from Python parser' });
        }
    });

    pythonProcess.stdin.write(text);
    pythonProcess.stdin.end();
});

// ── Gemini API Proxy (SECURITY: All keys server-side only) ────────────────────
// Simple per-IP in-memory rate limiter (120 req/min)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function getGeminiKey(): string {
    const raw = process.env.GEMINI_API_KEY || '';
    const keys = raw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return '';
    return keys[Math.floor(Math.random() * keys.length)];
}

function getGroqKey(): string {
    const raw = process.env.GROQ_API_KEYS || '';
    const keys = raw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) return '';
    return keys[Math.floor(Math.random() * keys.length)];
}

async function groqFallback(
    contents: any[],
    generationConfig: any,
    systemInstruction: any
): Promise<Record<string, unknown> | null> {
    const groqKey = getGroqKey();
    if (!groqKey) return null;

    const messages: { role: string; content: string }[] = [];
    const sysText = systemInstruction?.parts?.[0]?.text;
    if (sysText) messages.push({ role: 'system', content: sysText });
    const userText = contents?.[0]?.parts?.[0]?.text || '';
    messages.push({ role: 'user', content: userText });

    const isJson = generationConfig?.responseMimeType === 'application/json';
    const groqBody: Record<string, unknown> = {
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: generationConfig?.temperature ?? 0.3,
    };
    if (isJson) groqBody.response_format = { type: 'json_object' };

    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify(groqBody),
        });
        if (!r.ok) return null;
        const d = await r.json() as any;
        const text = d.choices?.[0]?.message?.content ?? '';
        // Wrap in Gemini-compatible response shape so client code works unchanged
        return { candidates: [{ content: { parts: [{ text }] } }] };
    } catch {
        return null;
    }
}

async function omniRouteFallback(
    contents: any[],
    generationConfig: any,
    systemInstruction: any,
    stream: boolean = false
): Promise<any> {
    const messages: { role: string; content: string }[] = [];
    const sysText = systemInstruction?.parts?.[0]?.text;
    if (sysText) messages.push({ role: 'system', content: sysText });
    const userText = contents?.[0]?.parts?.[0]?.text || '';
    messages.push({ role: 'user', content: userText });

    const isJson = generationConfig?.responseMimeType === 'application/json';
    const body: Record<string, unknown> = {
        model: 'auto',
        messages,
        temperature: generationConfig?.temperature ?? 0.3,
        stream,
    };
    if (isJson && !stream) body.response_format = { type: 'json_object' };

    try {
        const r = await fetch('http://localhost:20128/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!r.ok) return null;
        if (stream) return r; // Return raw fetch Response to stream directly

        const d = await r.json() as any;
        const text = d.choices?.[0]?.message?.content ?? '';
        return { candidates: [{ content: { parts: [{ text }] } }] };
    } catch {
        return null; // Gateway probably offline
    }
}

async function freeLlmApiFallback(
    contents: any[],
    generationConfig: any,
    systemInstruction: any,
    stream: boolean = false
): Promise<any> {
    const messages: { role: string; content: string }[] = [];
    const sysText = systemInstruction?.parts?.[0]?.text;
    if (sysText) messages.push({ role: 'system', content: sysText });
    const userText = contents?.[0]?.parts?.[0]?.text || '';
    messages.push({ role: 'user', content: userText });

    const isJson = generationConfig?.responseMimeType === 'application/json';
    const body: Record<string, unknown> = {
        model: 'auto',
        messages,
        temperature: generationConfig?.temperature ?? 0.3,
        stream,
    };
    if (isJson && !stream) body.response_format = { type: 'json_object' };

    try {
        const apiKey = process.env.FREELLMAPI_KEY || 'freellmapi-your-unified-key';
        const r = await fetch('http://localhost:3001/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body),
        });
        if (!r.ok) return null;
        if (stream) return r; // Return raw fetch Response to stream directly

        const d = await r.json() as any;
        const text = d.choices?.[0]?.message?.content ?? '';
        return { candidates: [{ content: { parts: [{ text }] } }] };
    } catch {
        return null; // Gateway probably offline
    }
}

async function geminiWeb2ApiFallback(
    contents: any[],
    generationConfig: any,
    systemInstruction: any,
    stream: boolean = false
): Promise<any> {
    const messages: { role: string; content: string }[] = [];
    const sysText = systemInstruction?.parts?.[0]?.text;
    if (sysText) messages.push({ role: 'system', content: sysText });
    const userText = contents?.[0]?.parts?.[0]?.text || '';
    messages.push({ role: 'user', content: userText });

    const isJson = generationConfig?.responseMimeType === 'application/json';
    const body: Record<string, unknown> = {
        model: 'gemini-3.6-flash',
        messages,
        temperature: generationConfig?.temperature ?? 0.3,
        stream,
    };
    if (isJson && !stream) body.response_format = { type: 'json_object' };

    try {
        const apiKey = process.env.GEMINI_WEB2API_KEY || 'sk-your-key';
        const r = await fetch('http://localhost:8081/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body),
        });
        if (!r.ok) return null;
        if (stream) return r;

        const d = await r.json() as any;
        const text = d.choices?.[0]?.message?.content ?? '';
        return { candidates: [{ content: { parts: [{ text }] } }] };
    } catch {
        return null; // Gateway probably offline
    }
}

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateMap.get(ip);
    if (!entry || now >= entry.resetAt) {
        rateMap.set(ip, { count: 1, resetAt: now + 60_000 });
        return true;
    }
    if (entry.count >= 120) return false;
    entry.count++;
    return true;
}

app.post('/api/gemini', async (req, res) => {
    const ip = (req.ip || req.socket.remoteAddress || 'unknown');
    if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
    }

    const { model = 'gemini-2.5-flash', contents, generationConfig, systemInstruction } = req.body;
    if (!contents) return res.status(400).json({ error: 'Missing `contents` in request body.' });

    // 1. Try OmniRoute Gateway First (Free & Unlimited if running)
    const omniRes = await omniRouteFallback(contents, generationConfig, systemInstruction, false);
    if (omniRes) return res.status(200).json(omniRes);

    // 2. Try FreeLLMAPI Gateway Second
    const freeLlmRes = await freeLlmApiFallback(contents, generationConfig, systemInstruction, false);
    if (freeLlmRes) return res.status(200).json(freeLlmRes);

    // 3. Try Gemini Web2API (Local Web Proxy)
    const web2ApiRes = await geminiWeb2ApiFallback(contents, generationConfig, systemInstruction, false);
    if (web2ApiRes) return res.status(200).json(web2ApiRes);

    // 4. Try Gemini Official API
    const apiKey = getGeminiKey();
    if (apiKey) {
        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload: Record<string, unknown> = { contents };
            if (generationConfig) payload.generationConfig = generationConfig;
            if (systemInstruction) payload.systemInstruction = systemInstruction;

            const upstream = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (upstream.ok) {
                const data = await upstream.json();
                return res.status(200).json(data);
            }
            console.warn(`[Gemini] ${upstream.status} — falling back to Groq`);
        } catch (err) {
            console.warn('[Gemini] Network error — falling back to Groq:', err);
        }
    }

    // Groq fallback
    const fallback = await groqFallback(contents, generationConfig, systemInstruction);
    if (fallback) return res.status(200).json(fallback);

    res.status(503).json({ error: 'All AI backends unavailable. Check server .env keys.' });
});

// ── Gemini Streaming Proxy ─────────────────────────────────────────────────────
app.post('/api/gemini/stream', async (req, res) => {
    const { model = 'gemini-2.0-flash', contents, generationConfig, systemInstruction } = req.body;
    if (!contents) return res.status(400).json({ error: 'Missing contents.' });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // 1. Try OmniRoute Gateway First (Free & Unlimited if running)
    try {
        const omniStreamRes = await omniRouteFallback(contents, generationConfig, systemInstruction, true) as Response | null;
        if (omniStreamRes && omniStreamRes.ok && omniStreamRes.body) {
            const reader = omniStreamRes.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(decoder.decode(value, { stream: true }));
            }
            res.end();
            return;
        }
    } catch (err) {
        console.warn('[OmniRoute Stream] Failed to connect', err);
    }

    // 2. Try FreeLLMAPI Gateway Second
    try {
        const freeLlmStreamRes = await freeLlmApiFallback(contents, generationConfig, systemInstruction, true) as Response | null;
        if (freeLlmStreamRes && freeLlmStreamRes.ok && freeLlmStreamRes.body) {
            const reader = freeLlmStreamRes.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(decoder.decode(value, { stream: true }));
            }
            res.end();
            return;
        }
    } catch (err) {
        console.warn('[FreeLLMAPI Stream] Failed to connect', err);
    }

    // 3. Try Gemini Web2API
    try {
        const web2ApiStreamRes = await geminiWeb2ApiFallback(contents, generationConfig, systemInstruction, true) as Response | null;
        if (web2ApiStreamRes && web2ApiStreamRes.ok && web2ApiStreamRes.body) {
            const reader = web2ApiStreamRes.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(decoder.decode(value, { stream: true }));
            }
            res.end();
            return;
        }
    } catch (err) {
        console.warn('[Gemini Web2API Stream] Failed to connect, falling back to Official Gemini API', err);
    }

    const apiKey = getGeminiKey();
    if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: 'All AI backends unavailable. Check server .env keys.' })}\n\n`);
        res.end();
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const payload: Record<string, unknown> = { contents };
    if (generationConfig) payload.generationConfig = generationConfig;
    if (systemInstruction) payload.systemInstruction = systemInstruction;

    try {
        const upstream = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!upstream.ok || !upstream.body) {
            const errText = await upstream.text();
            res.write(`data: ${JSON.stringify({ error: errText })}\n\n`);
            res.end();
            return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
    } catch (err) {
        console.error('[Gemini Stream Proxy]', err);
        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
    }
});

// ── Twilio WhatsApp Notifications ─────────────────────────────────────────────
app.post('/api/notify/whatsapp', async (req, res) => {
    const { to, message } = req.body;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromWA     = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
        return res.status(503).json({ error: 'Twilio credentials not configured. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env' });
    }
    if (!to || !message) return res.status(400).json({ error: 'Missing `to` or `message`.' });

    try {
        const toFormatted = to.startsWith('whatsapp:') ? to : `whatsapp:+91${to.replace(/\D/g, '').slice(-10)}`;
        const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: fromWA, To: toFormatted, Body: message }).toString(),
        });
        const data = await r.json() as Record<string, unknown>;
        if (!r.ok) return res.status(r.status).json({ error: 'Twilio error', detail: data });
        res.json({ success: true, sid: (data).sid });
    } catch (err) {
        console.error('[Twilio WhatsApp]', err);
        res.status(500).json({ error: 'Failed to send WhatsApp message.' });
    }
});

// ── Twilio SMS ─────────────────────────────────────────────────────────────────
app.post('/api/notify/sms', async (req, res) => {
    const { to, message } = req.body;
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromSMS    = process.env.TWILIO_SMS_FROM;

    if (!accountSid || !authToken || !fromSMS) {
        return res.status(503).json({ error: 'Twilio SMS credentials not configured.' });
    }
    try {
        const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: fromSMS, To: to, Body: message }).toString(),
        });
        const data = await r.json() as Record<string, unknown>;
        if (!r.ok) return res.status(r.status).json({ error: 'Twilio SMS error', detail: data });
        res.json({ success: true, sid: (data).sid });
    } catch (err) {
        console.error('[Twilio SMS]', err);
        res.status(500).json({ error: 'Failed to send SMS.' });
    }
});

// ── VAPID Public Key for Push Notifications ───────────────────────────────────
app.get('/api/push/vapid-key', (_req, res) => {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    if (!publicKey) return res.status(503).json({ error: 'VAPID_PUBLIC_KEY not set in .env' });
    res.json({ publicKey });
});

// ── Analytics ─────────────────────────────────────────────────────────────────
app.get('/api/analytics', (_req, res) => {
    res.json({ activeUsers: 10452, jobsProcessed: 4500, serverLoad: '24%' });
});

// Start Server
app.listen(PORT, () => {
    console.log(`[Server]: CapAble Backend is running at http://localhost:${PORT}`);
    console.log(`[Server]: Gemini proxy: POST /api/gemini`);
    console.log(`[Server]: WhatsApp:     POST /api/notify/whatsapp`);
    console.log(`[Server]: SMS:          POST /api/notify/sms`);
});
