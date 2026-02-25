import { Game } from "./game.js";
import { ui } from "./ui.js";
import { audio } from "./audio.js";
import { storage } from "./storage.js";
import { share } from "./share.js";
import { auth } from "./auth.js";
import { api } from "./api.js";
import { daily } from "./daily.js";
import { shop } from "./shop.js";

document.addEventListener("DOMContentLoaded", () => {
    // Canvas setup
    const canvas = document.getElementById("gameCanvas");

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // Init subsystems
    storage.init();
    auth.init();
    ui.bindCloseButtons();
    shop.skins = shop.skins || []; // safe guard
    shop.init(storage);

    // Initial HUD
    ui.updateHUD(0, 0, storage.data.flux);

    // Daily reset check implicitly done here by fetching missions
    daily.getMissions();

    let gameInstance = null;
    let currentMode = "global"; // "global" or "daily"

    // Handlers
    const onGameOver = async (stats) => {
        ui.setHUD(false);
        const isNewBest = storage.updateBestScore(stats.score);

        ui.displays.finalScore.textContent = stats.score;
        ui.displays.bestScore.textContent = storage.data.bestScore;

        const completedMissions = daily.evaluate(stats, storage);
        if (completedMissions > 0) {
            setTimeout(() => ui.showToast(`Completed ${completedMissions} daily mission(s)!`, 3000), 1000);
        }

        // Show game over screen IMMEDIATELY so it's not a black screen
        ui.showScreen("gameOver");

        const noticeBox = document.getElementById("submitNotice");
        noticeBox.textContent = "";

        if (auth.token) {
            noticeBox.className = "notice subtle";
            noticeBox.textContent = `Submitting to ${currentMode} leaderboard...`;

            const reqStats = {
                score: stats.score,
                duration: 60, // approximate duration sent for cheat check
                comboMax: stats.comboMax,
                gatesPassed: stats.gatesPassed
            };

            const dateKey = currentMode === "daily" ? daily.getDateKey() : undefined;

            const res = await api.submitScore(auth.token, currentMode, { ...reqStats, dateKey });
            if (res && res.success) {
                noticeBox.textContent = `Rank updated! Top score: ${res.scoreSaved}`;
                noticeBox.style.color = "var(--neon-cyan)";
            } else {
                noticeBox.textContent = "Score submitted (error parsing response).";
                noticeBox.style.color = "var(--neon-yellow)";
            }
        } else {
            noticeBox.className = "notice subtle";
            noticeBox.textContent = "Sign in with Google to post your score.";
            noticeBox.style.color = "var(--text-muted)";
        }
    };

    // Audio BGM Setup
    const bgMusic = document.getElementById("bgMusic");
    if (bgMusic) bgMusic.volume = 0.3;

    // Buttons
    document.getElementById("playBtn").addEventListener("click", () => {
        audio.init();
        if (bgMusic) bgMusic.play().catch(e => console.log("Audio play blocked", e));

        currentMode = "global";
        ui.showScreen("none"); // This hides everything, which is what we want for gameplay
        ui.setHUD(true);
        if (gameInstance) {
            gameInstance.running = false; // Force stop any old loop just in case
            gameInstance.cleanup();
        }
        gameInstance = new Game(canvas, onGameOver, storage);
        gameInstance.start();
    });

    document.getElementById("dailyParamsBtn").addEventListener("click", () => {
        audio.init();
        if (bgMusic) bgMusic.play().catch(e => console.log("Audio play blocked", e));

        currentMode = "daily";
        ui.showScreen("none");
        ui.setHUD(true);
        if (gameInstance) {
            gameInstance.running = false;
            gameInstance.cleanup();
        }
        gameInstance = new Game(canvas, onGameOver, storage);
        gameInstance.start();
        ui.showToast("Daily Challenge Mode Started!");
    });

    document.getElementById("retryBtn").addEventListener("click", () => {
        ui.showScreen("none");
        ui.setHUD(true);
        if (gameInstance) {
            gameInstance.running = false;
            gameInstance.cleanup();
        }
        gameInstance = new Game(canvas, onGameOver, storage);
        gameInstance.start();
    });

    document.getElementById("gameOverLbBtn").addEventListener("click", () => {
        ui.showScreen("leaderboard");
        loadLeaderboard("global");
    });

    document.getElementById("menuBtn").addEventListener("click", () => {
        if (bgMusic) bgMusic.pause(); // Optional: pause on menu return, or let it play
        ui.showScreen("mainMenu");
    });

    document.getElementById("shareBtn").addEventListener("click", () => {
        if (gameInstance) {
            share.shareScore(gameInstance.score, canvas);
        }
    });

    // Leaderboard setup
    const tabGlobal = document.getElementById("tabGlobal");
    const tabDaily = document.getElementById("tabDaily");
    const lbList = document.getElementById("leaderboardList");

    async function loadLeaderboard(mode) {
        lbList.innerHTML = "<li class=\"loading\">Loading...</li>";
        tabGlobal.classList.toggle("active", mode === "global");
        tabDaily.classList.toggle("active", mode === "daily");

        const dateKey = mode === "daily" ? daily.getDateKey() : undefined;
        let data = await api.getLeaderboard(mode, 10, dateKey);

        lbList.innerHTML = "";

        // Edge case structure
        if (data && data.scores) data = data.scores;
        else if (data && Array.isArray(data.data)) data = data.data;

        if (!Array.isArray(data) || data.length === 0) {
            lbList.innerHTML = "<li>No scores yet!</li>";
            return;
        }

        data.forEach((entry, idx) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <span class="rank">#${idx + 1}</span>
                <span class="name">${entry.name}</span>
                <span class="score">${entry.score}</span>
            `;
            lbList.appendChild(li);
        });
    }

    document.getElementById("leaderboardBtn").addEventListener("click", () => {
        ui.showScreen("leaderboard");
        loadLeaderboard("global");
    });

    tabGlobal.addEventListener("click", () => loadLeaderboard("global"));
    tabDaily.addEventListener("click", () => loadLeaderboard("daily"));

    document.getElementById("shopBtn").addEventListener("click", () => {
        shop.render();
        ui.showScreen("shop");
    });

    // Simple idle animation loop if not running
    function idleLoop() {
        if (!gameInstance || !gameInstance.running) {
            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Random sparks
            if (Math.random() < 0.05) {
                ctx.fillStyle = ["#00f3ff", "#ff00ea", "#fffb00"][Math.floor(Math.random() * 3)];
                ctx.beginPath();
                ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        requestAnimationFrame(idleLoop);
    }
    idleLoop();
});
