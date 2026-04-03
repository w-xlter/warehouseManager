import * as API from "./api.js";

/**
 * Lock timeout in milliseconds.
 * After this duration, a row is considered "stale" and can be edited by others.
 * 3 minutes = 180,000 ms
 */
const LOCK_TIMEOUT = 3 * 60 * 1000;

/**
 * Renders the entire table from a list of items.
 *
 * This is a full re-render:
 * - Clears previous DOM content
 * - Recreates table structure
 * - Delegates row rendering to updateRowUI()
 *
 * @param {Array} items - Array of objects from Supabase (id, product, qty, editing_by, editing_at)
 */
export function print(items) {
    const anchor = document.getElementById("stockTable");

    // Clear previous table (important to avoid duplicate tables)
    anchor.innerHTML = "";

    const table = document.createElement("table");

    /**
     * TABLE HEADER CREATION
     * Static structure: defines columns.
     */
    const header = document.createElement("tr");

    const th1 = document.createElement("th");
    th1.textContent = "Product";

    const th2 = document.createElement("th");
    th2.textContent = "Qty";

    header.appendChild(th1);
    header.appendChild(th2);
    table.appendChild(header);

    /**
     * ROW RENDERING
     * Each item is mapped to a <tr>.
     * updateRowUI handles both:
     * - content (product, qty)
     * - state (editing / not editing)
     */
    items.forEach(item => {
        const row = document.createElement("tr");

        // Row ID is critical for:
        // - mapping realtime updates
        // - identifying rows in click handlers
        row.id = `row-${item.id}`;

        updateRowUI(row, item);
        table.appendChild(row);
    });

    anchor.appendChild(table);
}

/**
 * Core UI update function (single source of truth for row state).
 *
 * Responsibilities:
 * - Determine if a lock is expired
 * - Apply visual state (yellow highlight)
 * - Store metadata in dataset
 * - Ensure table cells are populated correctly
 *
 * IMPORTANT:
 * This function must always receive FULL data (product, qty, editing_by, editing_at).
 * Passing partial data (e.g. only dataset) will erase cell content.
 *
 * @param {HTMLTableRowElement} row
 * @param {Object} data
 */
export function updateRowUI(row, data) {
    const now = Date.now();

    /**
     * Convert editing timestamp to milliseconds.
     * If null, treat as 0 (never locked).
     */
    const timestamp = data.editing_at
        ? new Date(data.editing_at).getTime()
        : 0;

    /**
     * A lock is expired if:
     * current time - last update time > timeout
     */
    const isExpired = now - timestamp > LOCK_TIMEOUT;

    /**
     * Store state in DOM dataset for quick access (no DB call needed).
     * dataset values are ALWAYS strings.
     */
    row.dataset.editingBy =
        (!isExpired && data.editing_by) ? data.editing_by : "";

    row.dataset.editingAt = data.editing_at || "";

    /**
     * VISUAL STATE
     * Apply/remove "editing" class based on lock validity.
     */
    if (data.editing_by && !isExpired) {
        row.classList.add("editing");
    } else {
        row.classList.remove("editing");
    }

    /**
     * CELL MANAGEMENT
     *
     * Two scenarios:
     * 1. First render → create cells
     * 2. Subsequent updates → update existing cells
     *
     * This prevents DOM duplication and ensures consistent structure.
     */
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

/**
 * Attaches click handling using EVENT DELEGATION.
 *
 * Why delegation:
 * - Rows are dynamically created/replaced
 * - Avoids re-attaching listeners after every render
 *
 * Behavior:
 * - Click → lock row
 * - Click again (same user) → unlock
 * - Prevent editing if locked by another user (unless expired)
 *
 * @param {SupabaseClient} supabase
 * @param {string} userId
 */
export function attachRowHighlight(supabase, userId) {
    const container = document.getElementById("stockTable");

    container.addEventListener("click", async e => {
        /**
         * Find closest row from click target.
         * Handles clicks on <td> or nested elements.
         */
        const row = e.target.closest("tr");

        // Ignore clicks outside rows or on header
        if (!row || row.querySelector("th")) return;

        const rowId = row.id.split("-")[1];

        /**
         * Recompute expiration dynamically (never trust cached values)
         */
        const now = Date.now();
        const timestamp = row.dataset.editingAt
            ? new Date(row.dataset.editingAt).getTime()
            : 0;

        const isExpired = now - timestamp > LOCK_TIMEOUT;

        /**
         * BLOCK CONDITION:
         * Another user owns the lock AND it is still valid.
         */
        if (
            row.dataset.editingBy &&
            row.dataset.editingBy !== userId &&
            !isExpired
        ) return;

        /**
         * UNLOCK CASE:
         * Same user clicks the same row again.
         */
        if (row.dataset.editingBy === userId) {
            await supabase
                .from("testHouse")
                .update({ editing_by: null, editing_at: null })
                .eq("id", rowId);

            // ⚠️ NOTE:
            // This is a simplified local update.
            // It lacks product/qty → can cause empty cells if misused.
            updateRowUI(row, {
                ...row.dataset,
                editing_by: null,
                editing_at: null
            });

            return;
        }

        /**
         * STEP 1: Unlock any rows previously owned by this user
         */
        await supabase
            .from("testHouse")
            .update({ editing_by: null, editing_at: null })
            .eq("editing_by", userId);

        /**
         * STEP 2: Lock current row
         */
        const nowISOString = new Date().toISOString();

        await supabase
            .from("testHouse")
            .update({
                editing_by: userId,
                editing_at: nowISOString
            })
            .eq("id", rowId);

        /**
         * OPTIMISTIC UI UPDATE
         * Immediate feedback before realtime sync arrives.
         */
        updateRowUI(row, {
            ...row.dataset,
            editing_by: userId,
            editing_at: nowISOString
        });
    });
}

/**
 * Periodic cleanup of expired locks (UI-only).
 *
 * Important:
 * - Does NOT modify database
 * - Only updates visual state
 * - Prevents "stuck" yellow rows
 *
 * Runs every 5 seconds.
 *
 * @param {Array} items - original dataset used for rendering
 */
export function startLockCleanup(items) {
    setInterval(() => {
        const now = Date.now();

        document.querySelectorAll("#stockTable tr").forEach(row => {
            // Skip header row
            if (row.querySelector("th")) return;

            /**
             * Extract row ID and find corresponding item
             */
            const id = parseInt(row.id.split("-")[1]);
            const item = items.find(it => it.id === id);
            if (!item) return;

            const timestamp = item.editing_at
                ? new Date(item.editing_at).getTime()
                : 0;

            const isExpired = now - timestamp > LOCK_TIMEOUT;

            /**
             * If expired → treat as unlocked (UI only)
             */
            const updatedItem = {
                ...item,
                editing_by: (isExpired ? null : item.editing_by)
            };

            updateRowUI(row, updatedItem);
        });
    }, 5000);
}