import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Firestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname as _dirname, resolve as _resolve } from 'path';

dotenv.config();

// ── Firebase Admin SDK (server-side Firestore access) ─────────────────────────
const serviceAccountPath = _resolve(process.cwd(), 'serviceAccountKey.json');
let adminDb: Firestore | null = null;
try {
    if (!getApps().length) {
        const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
        initializeApp({ credential: cert(serviceAccount) });
    }
    adminDb = getFirestore();
    console.log('[Firebase Admin] Initialized successfully.');
} catch (e) {
    console.warn('[Firebase Admin] Could not initialize — deadline cron will be disabled.', e);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

import { spawn } from 'child_process';
import path from 'path';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';

// ── Rate Limiting (§3.9) ───────────────────────────────────────────────────────
// Protects endpoints from abusive traffic, preserving API quotas.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Apply rate limiting to all /api routes
app.use('/api/', apiLimiter);

// ── Background Job Queue / Scheduled Ingestion (§3.11) ───────────────────────
// Mirrors job-find's Asynq queue. Runs the heavy fetchJobsCron script off the 
// request path, ensuring users are never blocked by API syncs.
cron.schedule('0 */12 * * *', () => { // Run every 12 hours
    console.log('[Cron] Starting scheduled background job ingestion...');
    const ingestProcess = spawn('npm', ['run', 'cron:fetch-jobs'], { shell: true });

    ingestProcess.stdout.on('data', (data) => console.log(`[Ingest] ${data}`));
    ingestProcess.stderr.on('data', (data) => console.error(`[Ingest Error] ${data}`));
    ingestProcess.on('close', (code) => {
        console.log(`[Cron] Background ingestion finished with code ${code}`);
    });
});

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
    const raw = process.env.GROQ_API_KEYS || process.env.GROQ_API_KEY || '';
    const keys = raw.split(',').map(k => k.trim()).filter(Boolean);
    if (keys.length === 0) {
        console.warn('[Groq Fallback] No Groq keys configured in .env');
        return null;
    }

    const messages: { role: string; content: string }[] = [];
    const sysText = systemInstruction?.parts?.[0]?.text;
    if (sysText) messages.push({ role: 'system', content: sysText });

    // Extract user text from parts or structure
    let userText = '';
    if (Array.isArray(contents)) {
        for (const item of contents) {
            if (item?.parts && Array.isArray(item.parts)) {
                for (const part of item.parts) {
                    if (part?.text) userText += (userText ? '\n' : '') + part.text;
                }
            } else if (typeof item === 'string') {
                userText += (userText ? '\n' : '') + item;
            }
        }
    } else if (typeof contents === 'string') {
        userText = contents;
    }

    messages.push({ role: 'user', content: userText || 'Hello' });

    const isJson = generationConfig?.responseMimeType === 'application/json';
    const groqBody: Record<string, unknown> = {
        model: 'qwen/qwen3.8-27b',
        messages,
        temperature: generationConfig?.temperature ?? 0.3,
    };
    if (isJson) groqBody.response_format = { type: 'json_object' };

    // Try up to 3 keys from the pool
    const shuffled = [...keys].sort(() => 0.5 - Math.random());
    for (const key of shuffled.slice(0, 3)) {
        try {
            const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
                body: JSON.stringify(groqBody),
            });
            if (!r.ok) {
                const errDetail = await r.text();
                console.warn(`[Groq Fallback] Key HTTP ${r.status}:`, errDetail.slice(0, 150));
                continue;
            }
            const d = await r.json() as any;
            const text = d.choices?.[0]?.message?.content ?? '';
            console.log('[Groq Fallback] ✅ Response generated successfully via qwen/qwen3.8-27b');
            return { candidates: [{ content: { parts: [{ text }] } }] };
        } catch (err) {
            console.warn('[Groq Fallback] Fetch exception:', err);
        }
    }
    return null;
}

async function groqStreamFallback(
    contents: any[],
    generationConfig: any,
    systemInstruction: any,
    res: express.Response
): Promise<boolean> {
    const groqKey = getGroqKey();
    if (!groqKey) return false;

    const messages: { role: string; content: string }[] = [];
    const sysText = systemInstruction?.parts?.[0]?.text;
    if (sysText) messages.push({ role: 'system', content: sysText });
    const userText = contents?.[0]?.parts?.[0]?.text || '';
    messages.push({ role: 'user', content: userText });

    const groqBody = {
        model: 'qwen/qwen3.8-27b',
        messages,
        temperature: generationConfig?.temperature ?? 0.3,
        stream: true,
    };

    try {
        const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
            body: JSON.stringify(groqBody),
        });

        if (!upstream.ok || !upstream.body) return false;

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(raw);
                    const token = parsed.choices?.[0]?.delta?.content;
                    if (token) {
                        res.write(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text: token }] } }] })}\n\n`);
                    }
                } catch {
                    // skip malformed
                }
            }
        }
        res.write('data: [DONE]\n\n');
        res.end();
        return true;
    } catch (e) {
        console.warn('[Groq Stream Fallback Error]', e);
        return false;
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

    let { model = 'gemini-2.5-flash', contents, generationConfig, systemInstruction } = req.body;
    if (!contents) return res.status(400).json({ error: 'Missing `contents` in request body.' });
    if (!model || model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash') {
        model = 'gemini-2.5-flash';
    }

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
    let { model = 'gemini-2.5-flash', contents, generationConfig, systemInstruction } = req.body;
    if (!contents) return res.status(400).json({ error: 'Missing contents.' });
    if (!model || model === 'gemini-2.0-flash' || model === 'gemini-1.5-flash') {
        model = 'gemini-2.5-flash';
    }

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
            console.warn(`[Gemini Stream] Upstream status ${upstream.status} - attempting Groq stream fallback`);
            const groqOk = await groqStreamFallback(contents, generationConfig, systemInstruction, res);
            if (groqOk) return;

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
        console.warn('[Gemini Stream Proxy] Exception - attempting Groq stream fallback:', err);
        const groqOk = await groqStreamFallback(contents, generationConfig, systemInstruction, res);
        if (groqOk) return;

        res.write(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`);
        res.end();
    }
});

// ── Twilio Helpers & Account Info Cache ─────────────────────────────────────
interface TwilioAccountInfo {
    accountType: string;
    balance: string;
    activeNumber: string;
    verifiedNumbers: string[];
    lastFetched: number;
}
let twilioAccountCache: TwilioAccountInfo | null = null;

async function getTwilioAccountInfo(force = false): Promise<TwilioAccountInfo | null> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return null;

    if (!force && twilioAccountCache && (Date.now() - twilioAccountCache.lastFetched < 300_000)) {
        return twilioAccountCache;
    }

    try {
        const auth = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const [accRes, balRes, callersRes] = await Promise.all([
            fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, { headers: { Authorization: auth } }),
            fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`, { headers: { Authorization: auth } }),
            fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/OutgoingCallerIds.json`, { headers: { Authorization: auth } }),
        ]);

        const accData = await accRes.json() as any;
        const balData = await balRes.json() as any;
        const callersData = await callersRes.json() as any;

        const verified: string[] = (callersData.outgoing_caller_ids || []).map((c: any) => c.phone_number);
        const activeNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_SMS_FROM || '+15173000357';

        twilioAccountCache = {
            accountType: accData.type || 'Trial',
            balance: balData.balance ? `${balData.balance} ${balData.currency}` : 'Active',
            activeNumber,
            verifiedNumbers: verified.length > 0 ? verified : ['+918299565476', '+918294854966'],
            lastFetched: Date.now(),
        };
        return twilioAccountCache;
    } catch (err) {
        console.warn('[Twilio] Failed to fetch account info:', err);
        return twilioAccountCache || {
            accountType: 'Trial',
            balance: 'Active',
            activeNumber: process.env.TWILIO_PHONE_NUMBER || '+15173000357',
            verifiedNumbers: ['+918299565476', '+918294854966'],
            lastFetched: Date.now(),
        };
    }
}

function normalizeE164(phone: string): string {
    const trimmed = (phone || '').trim();
    if (trimmed.startsWith('+')) return trimmed;
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10) return `+91${digits}`;
    return `+${digits}`;
}

// ── Twilio Account Status & Verified Numbers ──────────────────────────────────
app.get('/api/twilio/status', async (_req, res) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_SMS_FROM || '+15173000357';

    if (!accountSid || !authToken) {
        return res.status(200).json({
            configured: false,
            error: 'Twilio credentials not configured in .env',
        });
    }

    const info = await getTwilioAccountInfo();
    res.json({
        configured: true,
        accountSid: `${accountSid.slice(0, 6)}...${accountSid.slice(-4)}`,
        accountType: info?.accountType || 'Trial',
        balance: info?.balance || 'Active',
        activeNumber: info?.activeNumber || fromNumber,
        verifiedNumbers: info?.verifiedNumbers || ['+918299565476', '+918294854966'],
        primaryVerifiedNumber: info?.verifiedNumbers[0] || '+918299565476',
        isTrial: (info?.accountType || 'Trial').toLowerCase() === 'trial',
        trialNotice: 'Twilio Free Trial accounts only dispatch live voice calls and SMS to verified outgoing caller IDs.',
        capabilities: {
            voice: true,
            sms: true,
            inlineTwiml: true,
        },
    });
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
    const fromSMS    = process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER || '+15173000357';

    if (!accountSid || !authToken || !fromSMS) {
        return res.status(503).json({ error: 'Twilio SMS credentials not configured.' });
    }
    if (!to || !message) return res.status(400).json({ error: 'Missing `to` or `message`.' });

    try {
        const info = await getTwilioAccountInfo();
        const verifiedNumbers = info?.verifiedNumbers || ['+918299565476', '+918294854966'];
        const primaryVerified = verifiedNumbers[0] || '+918299565476';

        const targetFormatted = normalizeE164(to);
        let actualRecipient = targetFormatted;
        let redirected = false;

        if (info?.accountType === 'Trial' && !verifiedNumbers.includes(targetFormatted)) {
            actualRecipient = primaryVerified;
            redirected = true;
            console.warn(`[Twilio SMS] Trial Account: ${targetFormatted} is unverified. Routing to ${actualRecipient}.`);
        }

        const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
            method: 'POST',
            headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ From: fromSMS, To: actualRecipient, Body: message }).toString(),
        });
        const data = await r.json() as Record<string, unknown>;
        if (!r.ok) return res.status(r.status).json({ error: 'Twilio SMS error', detail: data });
        res.json({
            success: true,
            sid: data.sid,
            to: targetFormatted,
            routedTo: actualRecipient,
            redirected,
        });
    } catch (err) {
        console.error('[Twilio SMS]', err);
        res.status(500).json({ error: 'Failed to send SMS.' });
    }
});

// ── Twilio / WhatsApp Co-Founder Match Notification ─────────────────────────
app.post('/api/notify/cofounder-match', async (req, res) => {
    const { to, founderName, applicantName, ventureTitle, roleOffered, action } = req.body;
    if (!to || !ventureTitle) return res.status(400).json({ error: 'Missing `to` or `ventureTitle`.' });

    const isMatch = action === 'accepted';
    const message = isMatch
        ? `🤝 *CapAble Ventures — Co-Founder Match Confirmed!*\n\nHi ${applicantName || 'Founder'}! Great news: *${founderName || 'The Founder'}* has accepted your collaboration request for *${ventureTitle}* as *${roleOffered || 'Co-Founder'}*.\n\nLog in to your CapAble workspace to coordinate next steps: ${process.env.APP_URL || 'http://localhost:5173'}/candidate/opportunities?tab=startups\n\n_Reply STOP to unsubscribe_`
        : `🚀 *CapAble Ventures — New Co-Founder Request*\n\nHi ${founderName || 'Founder'}! *${applicantName || 'A candidate'}* wants to join *${ventureTitle}* as *${roleOffered || 'Co-Founder'}*.\n\nReview their pitch in your Applications tab.\n\n_Reply STOP to unsubscribe_`;

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromWA     = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
        console.log(`[Twilio Mock Co-Founder Match] To: ${to} | Message: ${message.slice(0, 80)}...`);
        return res.json({ success: true, simulated: true, message });
    }

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
        console.error('[Twilio Co-founder Match]', err);
        res.status(500).json({ error: 'Failed to send co-founder notification.' });
    }
});

// ── Twilio / WhatsApp Incubation Status Notification ─────────────────────────
app.post('/api/notify/incubation-status', async (req, res) => {
    const { to, applicantName, ventureTitle, institutionName, status, feedback } = req.body;
    if (!to || !ventureTitle || !status) return res.status(400).json({ error: 'Missing `to`, `ventureTitle`, or `status`.' });

    const message = [
        `🏛️ *CapAble Incubation Update*`,
        ``,
        `Hi ${applicantName || 'Founder'},`,
        `Your pitch for *${ventureTitle}* at *${institutionName || 'the Incubation Center'}* has updated:`,
        ``,
        `📋 *Status:* ${status.toUpperCase()}`,
        feedback ? `💬 *Feedback:* ${feedback}` : '',
        ``,
        `View complete feedback on CapAble: ${process.env.APP_URL || 'http://localhost:5173'}/candidate/applications?tab=incubation`,
        ``,
        `_Reply STOP to unsubscribe_`,
    ].filter(Boolean).join('\n');

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromWA     = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
        console.log(`[Twilio Mock Incubation Status] To: ${to} | Status: ${status}`);
        return res.json({ success: true, simulated: true, message });
    }

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
        console.error('[Twilio Incubation Notification]', err);
        res.status(500).json({ error: 'Failed to send incubation status notification.' });
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

// ── Live Ecosystem Firestore Endpoints (Direct Cloud Data Access) ────────────
app.get('/api/mentors', async (_req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const snap = await adminDb.collection('mentors').limit(50).get();
        const mentors: any[] = [];
        snap.forEach(d => mentors.push({ uid: d.id, ...d.data() }));
        res.json(mentors);
    } catch (e: any) {
        console.error('[API /api/mentors]', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/ventures', async (_req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const snap = await adminDb.collection('ventures').limit(50).get();
        const ventures: any[] = [];
        snap.forEach(d => ventures.push({ id: d.id, ...d.data() }));
        res.json(ventures);
    } catch (e: any) {
        console.error('[API /api/ventures]', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/incubation/programs', async (_req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const snap = await adminDb.collection('incubationPrograms').limit(50).get();
        const programs: any[] = [];
        snap.forEach(d => programs.push({ id: d.id, ...d.data() }));
        res.json(programs);
    } catch (e: any) {
        console.error('[API /api/incubation/programs]', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/incubation/applications', async (req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    const { instCode, uid } = req.query;
    try {
        let q: FirebaseFirestore.Query = adminDb.collection('incubationApplications');
        if (instCode) q = q.where('institutionCode', '==', String(instCode));
        if (uid) q = q.where('applicantUid', '==', String(uid));
        const snap = await q.limit(50).get();
        const apps: any[] = [];
        snap.forEach(d => apps.push({ id: d.id, ...d.data() }));
        res.json(apps);
    } catch (e: any) {
        console.error('[API /api/incubation/applications]', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/academic-projects', async (_req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const snap = await adminDb.collection('academicProjects').get();
        if (snap.empty) {
            const defaults = [
                {
                    title: 'AI-based Resume Scorer',
                    type: 'CAPSTONE PROJECT',
                    description: 'Deep neural parser and LLM embedding matcher for enterprise candidate benchmarking.',
                    assignedTo: 'Rishabh Verma (CSE), ALEX (Full Stack)',
                    mentees: ['Rishabh Verma (CSE)', 'ALEX (Full Stack)'],
                    status: 'In Progress',
                    allocatedBy: 'Deven Goyal (Faculty Mentor)',
                    deadline: '2026-11-30',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    title: 'Smart Campus IoT Network',
                    type: 'SEMESTER PROJECT',
                    description: 'LoRaWAN gateway mesh network for dynamic lab occupancy and environmental telemetry.',
                    assignedTo: 'Naveen (Backend), Priya (AI)',
                    mentees: ['Naveen (Backend)', 'Priya (AI)'],
                    status: 'In Progress',
                    allocatedBy: 'Deven Goyal (Faculty Mentor)',
                    deadline: '2026-12-15',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
                {
                    title: 'Blockchain Identity Verification',
                    type: 'RESEARCH PROJECT',
                    description: 'Zero-knowledge proofs for sovereign student degree verification and credential audits.',
                    assignedTo: 'Aditya Singh (Systems), Ansh Kumar (DevOps)',
                    mentees: ['Aditya Singh (Systems)', 'Ansh Kumar (DevOps)'],
                    status: 'Under Review',
                    allocatedBy: 'Deven Goyal (Faculty Mentor)',
                    deadline: '2027-01-15',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                }
            ];
            const batch = adminDb.batch();
            const seeded: any[] = [];
            for (const d of defaults) {
                const docRef = adminDb.collection('academicProjects').doc();
                batch.set(docRef, d);
                seeded.push({ id: docRef.id, ...d });
            }
            await batch.commit();
            return res.json(seeded);
        }
        const projs: any[] = [];
        snap.forEach(d => projs.push({ id: d.id, ...d.data() }));
        res.json(projs);
    } catch (e: any) {
        console.error('[API /api/academic-projects]', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/academic-projects', async (req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const ref = await adminDb.collection('academicProjects').add({
            ...req.body,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        res.json({ success: true, id: ref.id });
    } catch (e: any) {
        console.error('[API POST /api/academic-projects]', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/academic-projects/:id/allocate', async (req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const { id } = req.params;
        const { menteeName } = req.body;
        const docRef = adminDb.collection('academicProjects').doc(id);
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: 'Project not found' });
        
        const data = doc.data() || {};
        let mentees: string[] = Array.isArray(data.mentees) ? data.mentees.filter((m: string) => m !== 'Unallocated') : [];
        if (menteeName && !mentees.includes(menteeName)) {
            mentees.push(menteeName);
        }
        await docRef.update({
            mentees,
            assignedTo: mentees.join(', '),
            status: mentees.length > 0 ? 'In Progress' : 'Open',
            updatedAt: new Date().toISOString(),
        });
        res.json({ success: true, mentees, assignedTo: mentees.join(', ') });
    } catch (e: any) {
        console.error('[API allocate academic-project]', e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/mentor-sessions', async (req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const { candidateUid, mentorUid } = req.query;
        let q: FirebaseFirestore.Query = adminDb.collection('mentorSessions');
        if (candidateUid) q = q.where('candidateUid', '==', String(candidateUid));
        if (mentorUid) q = q.where('mentorUid', '==', String(mentorUid));
        const snap = await q.limit(50).get();
        const sessions: any[] = [];
        snap.forEach(d => sessions.push({ id: d.id, ...d.data() }));
        res.json(sessions);
    } catch (e: any) {
        console.error('[API GET /api/mentor-sessions]', e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/mentor-sessions', async (req, res) => {
    if (!adminDb) return res.status(503).json({ error: 'Database offline' });
    try {
        const ref = await adminDb.collection('mentorSessions').add({
            ...req.body,
            createdAt: new Date().toISOString(),
        });
        res.json({ success: true, id: ref.id });
    } catch (e: any) {
        console.error('[API /api/mentor-sessions]', e);
        res.status(500).json({ error: e.message });
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ── TWILIO DEADLINE REMINDER CALL SYSTEM ─────────────────────────────────────
// Architecture:
//   1. When a candidate saves a job with a deadline, Firestore gets a doc in
//      'deadlineAlerts' collection with { phone, deadline, title, company, callSent: false }
//   2. This cron runs every minute, finds alerts where deadline is ~3 hours away
//      and callSent === false, then fires a Twilio Voice Call with TwiML speech.
//   3. After calling, marks callSent: true + callScheduledAt so no duplicates.
// ═══════════════════════════════════════════════════════════════════════════════

/** Make a Twilio Voice call with inline TwiML spoken message */
async function makeTwilioVoiceCall(to: string, message: string): Promise<{ sid: string; to: string; routedTo: string; redirected: boolean } | null> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_SMS_FROM || '+15173000357';

    if (!accountSid || !authToken || !fromNumber) {
        console.warn('[Twilio Voice] Credentials missing — skipping call.');
        return null;
    }

    const info = await getTwilioAccountInfo();
    const verifiedNumbers = info?.verifiedNumbers || ['+918299565476', '+918294854966'];
    const primaryVerified = verifiedNumbers[0] || '+918299565476';

    const targetFormatted = normalizeE164(to || primaryVerified);
    let actualRecipient = targetFormatted;
    let redirected = false;

    if (info?.accountType === 'Trial' && !verifiedNumbers.includes(targetFormatted)) {
        actualRecipient = primaryVerified;
        redirected = true;
        console.warn(`[Twilio Voice] Trial Account: ${targetFormatted} is unverified. Routing to ${actualRecipient} so call connects.`);
    }

    // Build inline TwiML: Twilio will speak this text when candidate picks up
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-IN">
    Hello! This is CapAble, your smart campus placement and entrepreneurship assistant.
    This is an automated priority voice reminder.
    ${message}
    Please do not miss this opportunity. Log in to your CapAble portal to review and apply right now.
    Goodbye and best of luck from the CapAble team!
  </Say>
  <Pause length="1"/>
</Response>`;

    const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    try {
        const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${creds}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                From: fromNumber,
                To: actualRecipient,
                Twiml: twiml,
            }).toString(),
        });
        const data = await r.json() as Record<string, unknown>;
        if (!r.ok) {
            console.error('[Twilio Voice] Call failed:', data);
            return null;
        }
        console.log(`[Twilio Voice] Call initiated to ${actualRecipient} (requested: ${to}) — SID: ${data.sid}`);
        return {
            sid: data.sid as string,
            to: targetFormatted,
            routedTo: actualRecipient,
            redirected,
        };
    } catch (e) {
        console.error('[Twilio Voice] Exception:', e);
        return null;
    }
}

// In-memory TwiML cache keyed by token (fallback)
const twilioTwimlCache = new Map<string, string>();

// ── TwiML fallback endpoint ──────────────────────────────────────────────────
app.get('/api/twiml/:token', (req, res) => {
    const twiml = twilioTwimlCache.get(req.params.token);
    if (!twiml) {
        res.set('Content-Type', 'text/xml');
        res.send(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, this call script has expired.</Say></Response>`);
        return;
    }
    res.set('Content-Type', 'text/xml');
    res.send(twiml);
});

// ── Manual trigger endpoint (for testing & direct alerts) ───────────────────
app.post('/api/notify/call', async (req, res) => {
    const { to, jobTitle, company, deadline, customMessage } = req.body;
    const accountInfo = await getTwilioAccountInfo();
    const primaryVerified = accountInfo?.verifiedNumbers[0] || '+918299565476';
    const targetTo = (!to || to === 'me' || to === 'default') ? primaryVerified : to;

    const deadlineStr = deadline ? new Date(deadline).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) : 'in 3 hours';
    const message = customMessage || `Your application deadline for ${jobTitle || 'Saved Opportunity'} at ${company || 'the partner company'} is closing ${deadlineStr}.`;

    const result = await makeTwilioVoiceCall(targetTo, message);
    if (!result) return res.status(503).json({ error: 'Call failed — check Twilio account status or balance.' });
    res.json({
        success: true,
        sid: result.sid,
        to: result.to,
        routedTo: result.routedTo,
        redirected: result.redirected,
        trialNotice: result.redirected ? `Note: Dispatched to verified trial number ${result.routedTo} because ${result.to} is unverified.` : undefined,
        message,
    });
});

// ── Deadline Cron — runs every minute ────────────────────────────────────────
cron.schedule('* * * * *', async () => {
    if (!adminDb) return; // Firebase Admin not initialized

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    if (!accountSid || !authToken) return; // No Twilio creds

    const nowMs = Date.now();
    const threeHoursMs = 3 * 60 * 60 * 1000;  // 3 hours in ms
    const windowMs = 60 * 1000;               // ±1 minute window

    try {
        // Query all pending alerts
        const snap = await adminDb
            .collection('deadlineAlerts')
            .where('callSent', '==', false)
            .get();

        if (snap.empty) return;

        const toCall: Array<{ ref: FirebaseFirestore.DocumentReference; data: FirebaseFirestore.DocumentData }> = [];

        snap.forEach(docSnap => {
            const data = docSnap.data();
            if (!data.deadline || !data.candidatePhone) return;

            const deadlineMs = new Date(data.deadline).getTime();
            if (isNaN(deadlineMs)) return;

            const diff = deadlineMs - nowMs;
            // Fire if deadline is between 2h59m and 3h01m from now
            if (diff >= threeHoursMs - windowMs && diff <= threeHoursMs + windowMs) {
                toCall.push({ ref: docSnap.ref, data });
            }
        });

        console.log(`[Deadline Cron] ${snap.size} pending alerts checked, ${toCall.length} calls to fire.`);

        for (const { ref, data } of toCall) {
            const deadlineStr = new Date(data.deadline).toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short',
            });
            const message = `The job is ${data.title} at ${data.company}. The application deadline is ${deadlineStr}, which is in 3 hours.`;

            const callResult = await makeTwilioVoiceCall(data.candidatePhone, message);
            const sid = callResult?.sid || null;
            const targetRecipient = callResult?.routedTo || data.candidatePhone;

            // Also send SMS backup
            const smsBody = `⏰ CapAble Reminder: Your saved job "${data.title}" at ${data.company} closes in 3 hours (${deadlineStr}). Log in to apply now!`;
            try {
                const creds = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
                await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
                    method: 'POST',
                    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        From: process.env.TWILIO_SMS_FROM || process.env.TWILIO_PHONE_NUMBER || '+15173000357',
                        To: targetRecipient,
                        Body: smsBody,
                    }).toString(),
                });
                console.log(`[Deadline Cron] SMS backup sent to ${targetRecipient}`);
            } catch (smsErr) {
                console.warn('[Deadline Cron] SMS backup failed:', smsErr);
            }

            // Mark as called
            await ref.update({
                callSent: true,
                callScheduledAt: FieldValue.serverTimestamp(),
                twilioCallSid: sid || 'sms-only',
                routedTo: targetRecipient,
            });
            console.log(`[Deadline Cron] ✅ Called ${targetRecipient} for "${data.title}"`);
        }
    } catch (e) {
        console.error('[Deadline Cron] Error:', e);
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`[Server]: CapAble Backend is running at http://localhost:${PORT}`);
    console.log(`[Server]: Gemini proxy:  POST /api/gemini`);
    console.log(`[Server]: WhatsApp:      POST /api/notify/whatsapp`);
    console.log(`[Server]: SMS:           POST /api/notify/sms`);
    console.log(`[Server]: Voice Call:    POST /api/notify/call`);
    console.log(`[Server]: Deadline Cron: runs every minute — checks for 3h-before deadlines`);
    console.log(`[Server]: Firebase Admin: ${adminDb ? 'CONNECTED' : 'OFFLINE (deadline cron disabled)'}`);
});
