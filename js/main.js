import * as UI from "./ui.js";
import * as API from "./api.js";

// simulate a user ID (replace with auth user ID in production)
const USER_ID = "user_" + Math.floor(Math.random() * 1000);
const LOCK_TIMEOUT = 3 * 60 * 1000; // 3 minutes

function updateRowUI(row, data) {
    const now = Date.now();
    const timestamp = data.editing_at ? new Date(data.editing_at).getTime() : 0;
    const isExpired = now - timestamp > LOCK_TIMEOUT;

    row.dataset.editingBy = (!isExpired && data.editing_by) ? data.editing_by : "";
    row.dataset.editingAt = data.editing_at || "";

    if (data.editing_by && !isExpired) {
        row.classList.add("editing");
    } else {
        row.classList.remove("editing");
    }
}

async function init() {
    const items = await API.getItems();
    UI.print(items);
    UI.attachRowHighlight(API.supabase, USER_ID);
    UI.startLockCleanup();

    // subscribe to realtime updates
    API.supabase
        .channel("public:testHouse")
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "testHouse" },
            payload => {
                const row = document.querySelector(`#row-${payload.new.id}`);
                if (!row) return;

                updateRowUI(row, payload.new);
            }
        )
        .subscribe();
}

document.addEventListener("DOMContentLoaded", init);