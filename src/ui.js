export const ui = {
    screens: {
        mainMenu: document.getElementById("mainMenu"),
        gameOver: document.getElementById("gameOverScreen"),
        leaderboard: document.getElementById("leaderboardScreen"),
        shop: document.getElementById("shopScreen")
    },
    displays: {
        hud: document.getElementById("hud"),
        score: document.getElementById("scoreDisplay"),
        multiplier: document.getElementById("multiplierDisplay"),
        finalScore: document.getElementById("finalScoreDisplay"),
        bestScore: document.getElementById("bestScoreDisplay"),
        flux: document.getElementById("fluxDisplay"),
        shopFlux: document.getElementById("shopFlux")
    },
    toastEl: document.getElementById("toast"),
    toastTimeout: null,
    previousScreen: null,

    showScreen(screenName) {
        if (screenName === "leaderboard" || screenName === "shop") {
            // Find currently active screen to return to later
            const activeScreen = Object.keys(this.screens).find(key =>
                this.screens[key] && this.screens[key].classList.contains("active")
            );
            if (activeScreen && activeScreen !== "leaderboard" && activeScreen !== "shop") {
                this.previousScreen = activeScreen;
            }
        }

        Object.values(this.screens).forEach(s => s.classList.remove("active"));
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add("active");
        }
    },

    setHUD(visible) {
        if (visible) this.displays.hud.classList.remove("hidden");
        else this.displays.hud.classList.add("hidden");
    },

    updateHUD(score, multiplier, flux) {
        this.displays.score.textContent = Math.floor(score);
        this.displays.multiplier.textContent = `x${multiplier}`;
        if (flux !== undefined) {
            this.displays.flux.textContent = flux;
            this.displays.shopFlux.textContent = flux;
        }
    },

    showToast(message, duration = 3000) {
        this.toastEl.textContent = message;
        this.toastEl.classList.remove("hidden");
        if (this.toastTimeout) clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            this.toastEl.classList.add("hidden");
        }, duration);
    },

    bindCloseButtons() {
        document.querySelectorAll(".close-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                this.showScreen(this.previousScreen || "mainMenu");
            });
        });
    }
};
