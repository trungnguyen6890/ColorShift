const fs = require("fs");
const path = require("path");

const REQUIRED_FILES = [
    "index.html",
    "style.css",
    "src/main.js",
    "src/game.js",
    "src/ui.js",
    "src/audio.js",
    "src/storage.js",
    "src/share.js",
    "src/api.js",
    "src/auth.js",
    "src/daily.js",
    "src/shop.js",
    "functions/api/submit-score.js",
    "functions/api/leaderboard.js",
    "functions/api/me.js",
    "package.json",
    "wrangler.toml",
    ".github/workflows/ci.yml"
];

let allPassed = true;

for (const p of REQUIRED_FILES) {
    const fullPath = path.join(process.cwd(), p);
    if (!fs.existsSync(fullPath)) {
        console.error(`Missing required file: ${p}`);
        allPassed = false;
    }
}

if (!allPassed) {
    process.exit(1);
}

console.log("All required files exist. Basic check passed.");
process.exit(0);
