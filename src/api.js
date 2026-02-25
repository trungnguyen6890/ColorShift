import { ui } from "./ui.js";

export const api = {
    async submitScore(idToken, mode, stats) {
        try {
            const res = await fetch("/api/submit-score", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: idToken, mode, ...stats })
            });
            if (!res.ok) throw new Error("Server error");
            return await res.json();
        } catch (e) {
            console.error(e);
            ui.showToast("Failed to submit score", 2000);
            return null;
        }
    },

    async getLeaderboard(mode, limit = 10, dateKey = "") {
        try {
            const url = `/api/leaderboard?mode=${mode}&limit=${limit}${dateKey ? "&dateKey=" + dateKey : ""}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Server error");
            return await res.json();
        } catch (e) {
            console.error(e);
            ui.showToast(`Failed to load ${mode} leaderboard`, 2000);
            return [];
        }
    }
};
