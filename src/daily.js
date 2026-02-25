export const daily = {
    getDateKey() {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    },

    getMissions() {
        // Deterministic daily missions based on date
        const key = this.getDateKey();
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            hash = ((hash << 5) - hash) + key.charCodeAt(i);
            hash |= 0;
        }
        const rng = () => {
            hash = Math.sin(hash) * 10000;
            return hash - Math.floor(hash);
        };

        const targets = [
            Math.floor(rng() * 50) + 10,
            Math.floor(rng() * 1000) + 500,
            Math.floor(rng() * 20) + 5
        ];

        return [
            { desc: `Pass ${targets[0]} gates in one run`, target: targets[0], type: "gates", reward: 50 },
            { desc: `Score ${targets[1]} points in one run`, target: targets[1], type: "score", reward: 100 },
            { desc: `Reach combo x${targets[2]}`, target: targets[2], type: "combo", reward: 75 }
        ];
    },

    evaluate(stats, storage) {
        const today = this.getDateKey();
        if (storage.data.lastDaily !== today) {
            // New day
            storage.data.dailyMissionsCompleted = [false, false, false];
            storage.data.lastDaily = today;
            storage.save();
        }

        const missions = this.getMissions();
        const completed = storage.data.dailyMissionsCompleted || [false, false, false];
        let newlyCompleted = 0;

        missions.forEach((m, idx) => {
            if (completed[idx]) return;
            let success = false;
            if (m.type === "gates" && stats.gatesPassed >= m.target) success = true;
            if (m.type === "score" && stats.score >= m.target) success = true;
            if (m.type === "combo" && stats.comboMax >= m.target) success = true;

            if (success) {
                completed[idx] = true;
                storage.addFlux(m.reward);
                newlyCompleted++;
            }
        });

        storage.data.dailyMissionsCompleted = completed;
        storage.save();
        return newlyCompleted;
    }
};
