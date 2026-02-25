export async function onRequestGet({ request, env }) {
    try {
        const url = new URL(request.url);
        const mode = url.searchParams.get("mode") || "global";
        const limitStr = url.searchParams.get("limit") || "10";
        const dateKey = url.searchParams.get("dateKey"); // e.g., 2026-02-25

        const limit = parseInt(limitStr, 10);
        if (isNaN(limit) || limit <= 0 || limit > 50) {
            return new Response(JSON.stringify({ error: "Invalid limit" }), { status: 400 });
        }

        const kvKey = mode === "daily" ? `leaderboard_daily_${dateKey}` : "leaderboard_global";

        let lbData = await env.LB_KV.get(kvKey, "json");
        if (!lbData || !Array.isArray(lbData)) {
            lbData = [];
        }

        // Return only the top 'limit' and strip emails for privacy
        const result = lbData.slice(0, limit).map(entry => ({
            name: entry.name,
            score: entry.score
        }));

        return new Response(JSON.stringify({ data: result }), {
            headers: {
                "Content-Type": "application/json",
                // Allowed to be cached heavily at the edge to reduce load, except we want fresh for the player
                "Cache-Control": mode === "daily" ? "max-age=60" : "max-age=300"
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({ error: "Server Error", details: err.message }), { status: 500 });
    }
}
