import * as API from "./api.js"

export function print(items) {
    const LOCK_TIMEOUT = 3 * 60 * 1000;
    const now = Date.now();

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

        const timestamp = item.editing_at ? new Date(item.editing_at).getTime() : 0;
        const isExpired = now - timestamp > LOCK_TIMEOUT;

        // store dataset
        row.dataset.editingBy = (!isExpired && item.editing_by) ? item.editing_by : "";
        row.dataset.editingAt = item.editing_at || "";

        const product = document.createElement("td");
        product.textContent = item.product;

        const qty = document.createElement("td");
        qty.textContent = item.qty;

        row.appendChild(product);
        row.appendChild(qty);

        // highlight only if NOT expired
        if (item.editing_by && !isExpired) {
            row.classList.add("editing");
        }

        table.appendChild(row);
    });

    anchor.appendChild(table);
}

export function attachRowHighlight(supabase, userId) {
    const LOCK_TIMEOUT = 3 * 60 * 1000;
    const table = document.querySelector("#stockTable table");
    if (!table) return;

    table.querySelectorAll("tr").forEach(row => {
        if (row.querySelector("th")) return;

        row.addEventListener("click", async () => {
            const rowId = row.id.split("-")[1];

            const timestamp = row.dataset.editingAt ? new Date(row.dataset.editingAt).getTime() : 0;
            const isExpired = Date.now() - timestamp > LOCK_TIMEOUT;

            if (row.dataset.editingBy && row.dataset.editingBy !== userId && !isExpired) return;

            // UNLOCK
            if (row.dataset.editingBy === userId) {
                await supabase
                    .from("testHouse")
                    .update({ editing_by: null, editing_at: null })
                    .eq("id", rowId);

                row.dataset.editingBy = "";
                row.dataset.editingAt = "";
                row.classList.remove("editing");

                return;
            }

            // UNLOCK previous
            await supabase
                .from("testHouse")
                .update({ editing_by: null, editing_at: null })
                .eq("editing_by", userId);

            // 🔁 LOCK new
            await supabase
                .from("testHouse")
                .update({
                    editing_by: userId,
                    editing_at: new Date().toISOString()
                })
                .eq("id", rowId);

            // optimistic update
            row.dataset.editingBy = userId;
            row.dataset.editingAt = new Date().toISOString();
            row.classList.add("editing");
        });
    });
}