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

export async function onRequestGet({ request, env }) {
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Missing or invalid token" }), { status: 401 });
        }

        const token = authHeader.split(" ")[1];
        const clientId = env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID_LOCAL";

        const payload = await verifyGoogleToken(token, clientId);
        if (!payload) {
            return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });
        }

        // Token is valid! Return the user profile
        return new Response(JSON.stringify({
            success: true,
            user: {
                name: payload.name,
                given_name: payload.given_name,
                email: payload.email,
                picture: payload.picture
            }
        }), {
            headers: { "Content-Type": "application/json" }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Server Error", details: err.message }), { status: 500 });
    }
}
