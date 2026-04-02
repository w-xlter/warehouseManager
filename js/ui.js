import * as API from "./api.js"

export function print(items) {
    const anchor = document.getElementById("stockTable");
    anchor.innerHTML = ""; // clear table

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
        row.dataset.editingBy = item.editing_by || "";

        const product = document.createElement("td");
        product.textContent = item.product;
        const qty = document.createElement("td");
        qty.textContent = item.qty;

        row.appendChild(product);
        row.appendChild(qty);

        if (item.editing_by) {
            row.classList.add("editing");
        }

        table.appendChild(row);
    });

    anchor.appendChild(table);
}

// attach click listener for editing
export function attachRowHighlight(supabase, userId) {
    const table = document.querySelector("#stockTable table");
    if (!table) return;

    table.querySelectorAll("tr").forEach(row => {
        // skip header row
        if (row.querySelector("th")) return;

        row.addEventListener("click", async () => {
            if (row.dataset.editingBy && row.dataset.editingBy !== userId) return;

            const rowId = row.id.split("-")[1];
            await supabase
                .from("testHouse")
                .update({ editing_by: null })
                .eq("editing_by", userId);
            // lock the row in Supabase
            await supabase
                .from("testHouse")
                .update({ editing_by: userId })
                .eq("id", rowId);
        });
    });
}