import { audio } from "./audio.js";
import { ui } from "./ui.js";

const COLORS = ["#00f3ff", "#ff00ea", "#fffb00", "#10ff00"];

export class Game {
    constructor(canvas, onGameOver, storage) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.onGameOver = onGameOver;
        this.storage = storage;

        this.width = canvas.width;
        this.height = canvas.height;
        this.running = false;

        this.player = {
            x: this.width / 2,
            y: this.height - 150,
            radius: 20,
            colorIndex: 0
        };

        this.gates = [];
        this.particles = [];

        this.score = 0;
        this.combo = 0;
        this.baseSpeed = 3;
        this.speedMultiplier = 1;
        this.distance = 0;
        this.gatesPassed = 0;

        this.lastTime = 0;
        this.speedTimer = 0;

        this.bindEvents();
    }

    bindEvents() {
        this.handleTap = (e) => {
            if (!this.running) return;
            e.preventDefault();
            this.player.colorIndex = (this.player.colorIndex + 1) % COLORS.length;
            audio.playTap();
            this.spawnParticles(this.player.x, this.player.y, COLORS[this.player.colorIndex], 5);
        };
        this.handleKeyDown = (e) => {
            if (e.code === 'Space') {
                this.handleTap(e);
            }
        };
        this.canvas.addEventListener("touchstart", this.handleTap, { passive: false });
        this.canvas.addEventListener("mousedown", this.handleTap);
        document.addEventListener("keydown", this.handleKeyDown);
    }

    cleanup() {
        this.canvas.removeEventListener("touchstart", this.handleTap);
        this.canvas.removeEventListener("mousedown", this.handleTap);
        document.removeEventListener("keydown", this.handleKeyDown);
    }

    start() {
        this.running = true;
        this.score = 0;
        this.combo = 0;
        this.baseSpeed = 4;
        this.speedMultiplier = 1;
        this.distance = 0;
        this.gatesPassed = 0;
        this.speedTimer = 0;

        this.player.colorIndex = 0;
        this.gates = [];
        this.particles = [];

        this.spawnGate();
        this.lastTime = performance.now();
        requestAnimationFrame((t) => this.loop(t));
    }

    spawnGate() {
        const colorIdx = Math.floor(Math.random() * COLORS.length);
        this.gates.push({
            y: -50,
            height: 20,
            colorIndex: colorIdx,
            color: COLORS[colorIdx],
            passed: false
        });
    }

    spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color
            });
        }
    }

    gameOver() {
        this.running = false;
        audio.playExplosion();
        this.spawnParticles(this.player.x, this.player.y, COLORS[this.player.colorIndex], 50);

        // Final draw to show explosion
        this.draw();

        setTimeout(() => {
            this.onGameOver({
                score: Math.floor(this.score),
                gatesPassed: this.gatesPassed,
                comboMax: this.combo
            });
        }, 1000);
    }

    loop(timestamp) {
        if (!this.running) return;
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        // Speed up every 10 seconds
        this.speedTimer += dt;
        if (this.speedTimer > 10) {
            this.speedMultiplier += 0.2;
            this.speedTimer = 0;
        }

        const currentSpeed = this.baseSpeed * this.speedMultiplier;
        this.distance += currentSpeed;
        this.score += currentSpeed * 0.1 * (1 + this.combo * 0.1);

        // Update gates
        for (let i = this.gates.length - 1; i >= 0; i--) {
            let gate = this.gates[i];
            gate.y += currentSpeed * 60 * dt;

            // Collision check
            if (!gate.passed && gate.y + gate.height > this.player.y - this.player.radius && gate.y < this.player.y + this.player.radius) {
                if (this.player.colorIndex === gate.colorIndex) {
                    gate.passed = true;
                    this.combo++;
                    this.gatesPassed++;
                    this.score += 100 * this.combo;
                    audio.playPass(this.combo);
                    this.spawnParticles(this.player.x, gate.y, gate.color, 15);
                    this.storage.addFlux(1);
                } else {
                    this.gameOver();
                    return;
                }
            }

            if (gate.y > this.height) {
                this.gates.splice(i, 1);
            }
        }

        // Spawn new gates
        if (this.gates.length === 0 || this.gates[this.gates.length - 1].y > 300) {
            this.spawnGate();
        }

        // Particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt * 2;
            if (p.life <= 0) this.particles.splice(i, 1);
        }

        ui.updateHUD(this.score, this.combo);
    }

    draw() {
        // Background
        this.ctx.fillStyle = "rgba(10, 10, 20, 0.3)"; // Trail effect
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Gates
        this.gates.forEach(gate => {
            this.ctx.fillStyle = gate.color;
            this.ctx.shadowColor = gate.color;
            this.ctx.shadowBlur = 15;
            this.ctx.fillRect(0, gate.y, this.width, gate.height);
            this.ctx.shadowBlur = 0;
        });

        // Player
        if (this.running) {
            const playerColor = COLORS[this.player.colorIndex];
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = playerColor;
            this.ctx.shadowColor = playerColor;
            this.ctx.shadowBlur = 20;
            this.ctx.fill();

            // core
            this.ctx.beginPath();
            this.ctx.arc(this.player.x, this.player.y, this.player.radius * 0.5, 0, Math.PI * 2);
            this.ctx.fillStyle = "#fff";
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }

        // Particles
        this.particles.forEach(p => {
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1.0;
    }
}
