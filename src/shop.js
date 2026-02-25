import { ui } from "./ui.js";

export const shop = {
    skins: [
        { id: "default", name: "Classic Core", price: 0, color: "#fff" },
        { id: "ghost", name: "Phantom", price: 500, color: "rgba(255,255,255,0.5)" },
        { id: "gold", name: "Aurelia", price: 1500, color: "#ffd700" },
        { id: "dark", name: "Void Matter", price: 2500, color: "#111" }
    ],

    init(storage) {
        this.storage = storage;
        this.render();

        ui.screens.shop.addEventListener("click", (e) => {
            const btn = e.target.closest(".skin-item");
            if (!btn) return;
            const id = btn.dataset.id;
            this.handlePurchaseOrEquip(id);
        });
    },

    render() {
        const grid = document.getElementById("shopGrid");
        grid.innerHTML = "";

        const owned = this.storage.data.skins;
        const active = this.storage.data.activeSkin;

        this.skins.forEach(skin => {
            const isOwned = owned.includes(skin.id);
            const isEquipped = active === skin.id;

            const div = document.createElement("div");
            div.className = `skin-item ${isOwned ? "owned" : ""} ${isEquipped ? "equipped" : ""}`;
            div.dataset.id = skin.id;

            div.innerHTML = `
                <div class="skin-color" style="background: ${skin.color}"></div>
                <div class="skin-name">${skin.name}</div>
                <div class="skin-price">${isOwned ? (isEquipped ? "EQUIPPED" : "OWNED") : `✧ ${skin.price}`}</div>
            `;
            grid.appendChild(div);
        });

        ui.updateHUD(0, 0, this.storage.data.flux);
    },

    handlePurchaseOrEquip(id) {
        const skin = this.skins.find(s => s.id === id);
        if (!skin) return;

        const owned = this.storage.data.skins;
        if (owned.includes(id)) {
            // Equip
            this.storage.data.activeSkin = id;
            this.storage.save();
            this.render();
            ui.showToast(`Equipped ${skin.name}`);
        } else {
            // Purchase
            if (this.storage.data.flux >= skin.price) {
                this.storage.addFlux(-skin.price);
                this.storage.data.skins.push(id);
                this.storage.data.activeSkin = id; // Auto equip
                this.storage.save();
                this.render();
                ui.showToast(`Purchased ${skin.name}!`);
            } else {
                ui.showToast("Not enough Flux :(", 2000);
            }
        }
    }
};
