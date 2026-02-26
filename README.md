# Color Shift Reactor

A hyper-casual web game with social leaderboards, built on Cloudflare Pages + KV.
Uses Vanilla HTML/CSS/JS + Canvas, with Google Identity Services for authentication.

## Local Dev Requirements

1. **Install dependencies:**
   ```bash
   npm i hi
   ```

2. **Set up environment variables:**
   Create a `.dev.vars` file in the root directory (do not commit this file):
   ```
   GOOGLE_CLIENT_ID="your-google-client-id"
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   This uses `wrangler pages dev .` to serve static files and emulate Cloudflare Pages Functions locally.

4. **Lint and Check:**
   ```bash
   npm run lint
   npm run check
   ```

## Cloudflare Pages Auto-Deploy Instructions

1. **Push to GitHub**
   Create a GitHub repository and push this codebase to it.

2. **Connect Cloudflare**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) -> Workers & Pages -> Overview -> Create
   - Switch to the **Pages** tab and click **Connect to Git**
   - Select your GitHub repository for this project.

3. **Build Settings**
   - **Framework preset:** `None`
   - **Build command:** `npm run check` (optional verification)
   - **Build output directory:** `/` (or `.` if supported, keeping it root)

4. **Create KV Namespace**
   - Go to Cloudflare Dashboard -> Workers & Pages -> KV
   - Create a namespace and note its name.
   - Go back to your Pages project -> Settings -> Functions -> KV namespace bindings
   - Add a binding with:
     - **Variable name:** `LB_KV`
     - **KV namespace:** Select the namespace you created.

5. **Set Environment Variables**
   - Go to your Pages project -> Settings -> Environment variables
   - Add a Production/Preview variable:
     - **Variable name:** `GOOGLE_CLIENT_ID`
     - **Value:** Your Google OAuth Client ID.

6. **Google OAuth Authorized Origins**
   - In your Google Cloud Console (APIs & Services -> Credentials)...
   - Under your Web application Client ID, add your Cloudflare Pages URL (e.g., `https://your-project.pages.dev`) to both **Authorized JavaScript origins** and **Authorized redirect URIs**.
   - Don't forget to add `http://localhost:8788` for local wrangler development!

7. **Deploy and Test**
   - Trigger a deployment in Cloudflare Pages.
   - Open the URL, play the game, login with Google, and test leaderboard submission.

## Troubleshooting

- **If Google login fails:**
  - Check that the `GOOGLE_CLIENT_ID` is correct.
  - Check that you are testing on an origin (Domain/URL) that is whitelisted in Google Cloud Console as an Authorized JavaScript Origin.

- **If submit-score fails:**
  - Check that the Pages Function has the correct environment variable (`GOOGLE_CLIENT_ID`).
  - Verify that the KV namespace binding is named exactly `LB_KV` in the Cloudflare dashboard.

## Project Structure
- `/src` - Frontend vanilla JS code
- `/functions/api` - Cloudflare Pages serverless functions
- `/scripts` - CI automated test scripts
- `index.html` & `style.css` - Game visuals relying on Canvas + modern glassmorphism UI.
