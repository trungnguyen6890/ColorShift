import { ui } from "./ui.js";

export const auth = {
    token: null,
    profile: null,

    init() {
        // Exposed to global for GSI callback
        window.handleCredentialResponse = (response) => {
            this.token = response.credential;
            this.decodeAndStore(this.token);
            ui.showToast(`Welcome, ${this.profile.given_name || this.profile.name}!`);
            this.renderState();
        };

        // Initialize GSI programmatically to avoid HTML race conditions
        const initGSI = () => {
            if (window.google) {
                google.accounts.id.initialize({
                    client_id: "1030107560525-fgnr287prcuhqhn8pjmhq078ehrfg0to.apps.googleusercontent.com",
                    callback: window.handleCredentialResponse,
                    auto_select: false
                });
                google.accounts.id.renderButton(
                    document.querySelector(".g_id_signin"),
                    { theme: "outline", size: "large", type: "standard", shape: "pill", text: "signin_with" }
                );
            } else {
                setTimeout(initGSI, 100);
            }
        };
        initGSI();

        document.getElementById("logoutBtn").addEventListener("click", () => {
            if (window.google && this.profile && this.profile.email) {
                google.accounts.id.disableAutoSelect();
            }
            this.token = null;
            this.profile = null;
            this.renderState();
            ui.showToast("Logged out");
        });

        // Try load from sessionStorage purely for UX persist across reloads
        const saved = sessionStorage.getItem("gToken");
        if (saved) {
            this.token = saved;
            this.decodeAndStore(saved);
        }

        this.renderState();
    },

    decodeAndStore(token) {
        try {
            const base64Url = token.split(".")[1];
            let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            while (base64.length % 4) {
                base64 += "=";
            }
            const jsonPayload = decodeURIComponent(atob(base64).split("").map((c) => {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(""));
            this.profile = JSON.parse(jsonPayload);
            sessionStorage.setItem("gToken", token);
        } catch (e) {
            console.error("Token decode fail", e);
            this.profile = null;
            this.token = null;
        }
    },

    renderState() {
        const signinBtn = document.querySelector(".g_id_signin");
        const profileDiv = document.getElementById("userProfile");

        if (this.profile) {
            signinBtn.classList.add("hidden");
            profileDiv.classList.remove("hidden");
            profileDiv.style.display = "flex"; // Force flex display so it's not overridden by potential CSS
            document.getElementById("userName").textContent = this.profile.given_name || this.profile.name;
            document.getElementById("userAvatar").src = this.profile.picture || "";
        } else {
            signinBtn.classList.remove("hidden");
            profileDiv.classList.add("hidden");
            profileDiv.style.display = "none";
        }
    }
};
