import * as UI from "./ui.js";
import * as API from "./api.js";

// simulate a user ID (replace with auth user ID in production)
const USER_ID = "user_" + Math.floor(Math.random() * 1000);

async function init() {
    const items = await API.getItems();
    UI.print(items);
    UI.attachRowHighlight(API.supabase, USER_ID);
    UI.startLockCleanup();
    // subscribe to changes
    API.supabase
        .channel("public:testHouse")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "testHouse" },
            payload => {
                const row = document.querySelector(`#row-${payload.new.id}`);
                if (!row) return;

                if (payload.new.editing_by) {
                    row.classList.add("editing");
                    row.dataset.editingBy = payload.new.editing_by;
                } else {
                    row.classList.remove("editing");
                    row.dataset.editingBy = "";
                }
            }
        )
        .subscribe();
}

document.addEventListener("DOMContentLoaded", init);