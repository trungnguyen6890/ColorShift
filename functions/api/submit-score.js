function base64urlDecode(str) {
    str = str.replace(/-/g, "+").replace(/_/g, "/");
    while (str.length % 4) {
        str += "=";
    }
    return atob(str);
}

function decodePayload(jwtParts) {
    try {
        const decoded = base64urlDecode(jwtParts[1]);
        return JSON.parse(decodeURIComponent(escape(decoded)));
    } catch (e) {
        return JSON.parse(base64urlDecode(jwtParts[1]));
    }
}

let cachedJwks = null;
let jwksExp = 0;

async function verifyGoogleToken(token, clientId) {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64urlDecode(parts[0]));
    const payload = decodePayload(parts);

    if (payload.aud !== clientId && clientId !== "MOCK_CLIENT_ID_LOCAL") return null;
    if (payload.exp < Date.now() / 1000) return null;
    if (payload.iss !== "accounts.google.com" && payload.iss !== "https://accounts.google.com") return null;

    if (!cachedJwks || Date.now() > jwksExp) {
        const res = await fetch("https://www.googleapis.com/oauth2/v3/certs");
        cachedJwks = await res.json();
        jwksExp = Date.now() + 1000 * 60 * 60;
    }

    const keyData = cachedJwks.keys.find(k => k.kid === header.kid);
    if (!keyData) return null;

    const cryptoKey = await crypto.subtle.importKey(
        "jwk",
        keyData,
        { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } },
        false,
        ["verify"]
    );

    const encoder = new TextEncoder();
    const data = encoder.encode(parts[0] + "." + parts[1]);

    const sigB64 = parts[2].replace(/-/g, "+").replace(/_/g, "/");
    const sigRaw = atob(sigB64);
    const signature = new Uint8Array(sigRaw.length);
    for (let i = 0; i < sigRaw.length; i++) {
        signature[i] = sigRaw.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        signature,
        data
    );

    return isValid ? payload : null;
}

export async function onRequestPost({ request, env }) {
    try {
        const body = await request.json();
        const { token, mode, score, duration, comboMax, gatesPassed, dateKey } = body;

        if (!token || typeof score !== "number") {
            return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
        }

        if (score < 0 || score > 1000000) return new Response(JSON.stringify({ error: "Cheater detected" }), { status: 400 });
        if (comboMax > gatesPassed) return new Response(JSON.stringify({ error: "Impossible combo" }), { status: 400 });
        const maxScorePerSec = 5000;
        if (duration && (score / duration > maxScorePerSec)) return new Response(JSON.stringify({ error: "Speedhack detected" }), { status: 400 });

        const clientId = env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID_LOCAL";
        const payload = await verifyGoogleToken(token, clientId);
        if (!payload) {
            return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
        }

        const kvKey = mode === "daily" ? "leaderboard_daily_" + dateKey : "leaderboard_global";

        let lbData = await env.LB_KV.get(kvKey, "json");
        if (!lbData || !Array.isArray(lbData)) {
            lbData = [];
        }

        const name = payload.given_name || payload.name || "Player";
        const email = payload.email;

        // Deduplicate
        const existingIdx = lbData.findIndex(e => e.email === email);
        if (existingIdx >= 0) {
            if (score > lbData[existingIdx].score) {
                lbData[existingIdx].score = score;
            }
        } else {
            lbData.push({ name, email, score });
        }

        lbData.sort((a, b) => b.score - a.score);
        if (lbData.length > 50) lbData = lbData.slice(0, 50);

        await env.LB_KV.put(kvKey, JSON.stringify(lbData));

        return new Response(JSON.stringify({ success: true, scoreSaved: score }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Server Error", details: err.message }), { status: 500 });
    }
}
