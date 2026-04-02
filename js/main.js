import * as UI from "./ui.js";
import * as API from "./api.js";

const USER_ID = "user_" + Math.floor(Math.random() * 1000);

async function init() {
    const items = await API.getItems();
    console.log("Items:", items);
    UI.print(items);
    UI.attachRowHighlight(API.supabase, USER_ID);
    UI.startLockCleanup();

    // realtime
    const channel = API.supabase
        .channel("public:testHouse")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "testHouse" },
            payload => {
                const row = document.querySelector(`#row-${payload.new.id}`);
                if (!row) return;

                UI.updateRowUI(row, payload.new);
            }
        );

    await channel.subscribe();
}

document.addEventListener("DOMContentLoaded", init);