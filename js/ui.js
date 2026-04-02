import * as API from "./api.js";

const LOCK_TIMEOUT = 3 * 60 * 1000;

export function print(items) {
    const anchor = document.getElementById("stockTable");
    anchor.innerHTML = "";

    const table = document.createElement("table");

    // Header
    const header = document.createElement("tr");
    const th1 = document.createElement("th");
    th1.textContent = "Product";
    const th2 = document.createElement("th");
    th2.textContent = "Qty";
    header.appendChild(th1);
    header.appendChild(th2);
    table.appendChild(header);

    items.forEach(item => {
        const row = document.createElement("tr");
        row.id = `row-${item.id}`;
        updateRowUI(row, item);
        table.appendChild(row);
    });

    anchor.appendChild(table);
}

// central function to update a row
export function updateRowUI(row, data) {
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

    // add/update cells
    if (!row.cells.length) {
        const product = document.createElement("td");
        product.textContent = data.product;
        const qty = document.createElement("td");
        qty.textContent = data.qty;
        row.appendChild(product);
        row.appendChild(qty);
    } else {
        row.cells[0].textContent = data.product;
        row.cells[1].textContent = data.qty;
    }
}

// attach click listener via event delegation
export function attachRowHighlight(supabase, userId) {
    const container = document.getElementById("stockTable");
    container.addEventListener("click", async e => {
        const row = e.target.closest("tr");
        if (!row || row.querySelector("th")) return;

        const rowId = row.id.split("-")[1];
        const now = Date.now();
        const timestamp = row.dataset.editingAt ? new Date(row.dataset.editingAt).getTime() : 0;
        const isExpired = now - timestamp > LOCK_TIMEOUT;

        // someone else editing
        if (row.dataset.editingBy && row.dataset.editingBy !== userId && !isExpired) return;

        // unlock if you already own
        if (row.dataset.editingBy === userId) {
            await supabase
                .from("testHouse")
                .update({ editing_by: null, editing_at: null })
                .eq("id", rowId);

            updateRowUI(row, { ...row.dataset, editing_by: null, editing_at: null });
            return;
        }

        // unlock previous row(s)
        await supabase
            .from("testHouse")
            .update({ editing_by: null, editing_at: null })
            .eq("editing_by", userId);

        // lock new row
        const nowISOString = new Date().toISOString();
        await supabase
            .from("testHouse")
            .update({ editing_by: userId, editing_at: nowISOString })
            .eq("id", rowId);

        updateRowUI(row, { ...row.dataset, editing_by: userId, editing_at: nowISOString });
    });
}

// cleanup expired locks visually
export function startLockCleanup() {
    setInterval(() => {
        document.querySelectorAll("#stockTable tr").forEach(row => {
            if (row.querySelector("th")) return;
            const data = { editing_by: row.dataset.editingBy, editing_at: row.dataset.editingAt };
            updateRowUI(row, data);
        });
    }, 5000); // every 5 seconds
}