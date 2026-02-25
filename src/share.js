import { ui } from "./ui.js";

export const share = {
    async shareScore(score, canvas) {
        const url = window.location.href.split('?')[0];

        if (navigator.share) {
            try {
                await navigator.share({
                    title: "Color Shift Reactor",
                    url: url
                });
                ui.showToast("Shared via device!");
                return;
            } catch (e) {
                console.log("Share API failed or cancelled", e);
            }
        }

        try {
            await navigator.clipboard.writeText(url);
            ui.showToast("Score link copied to clipboard!");
        } catch (e) {
            ui.showToast("Sharing not supported on this device.");
        }
    }
};
