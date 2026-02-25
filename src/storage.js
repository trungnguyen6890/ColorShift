export const storage = {
    data: {
        flux: 0,
        bestScore: 0,
        skins: ["default"],
        activeSkin: "default",
        dailyStreak: 0,
        lastDaily: null,
        sound: true
    },

    init() {
        const saved = localStorage.getItem("colorshift_save");
        if (saved) {
            try {
                this.data = { ...this.data, ...JSON.parse(saved) };
            } catch (e) {
                console.error("Save data corrupted", e);
            }
        }
        this.save();
    },

    save() {
        localStorage.setItem("colorshift_save", JSON.stringify(this.data));
    },

    addFlux(amount) {
        this.data.flux += amount;
        this.save();
    },

    updateBestScore(score) {
        if (score > this.data.bestScore) {
            this.data.bestScore = score;
            this.save();
            return true;
        }
        return false;
    }
};
