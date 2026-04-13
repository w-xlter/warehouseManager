import * as API from "./api.js"

/** 
 * Renders a table of items inside the "stockTable" element.
 * 
 * @param {Array} items - Array of item objects to render.
 * @param {string} tableId - Optional table identifier (used for inline row submissions).
 * Updates the DOM with both an inline row for new entries and the existing data rows.
 */
export function render(items, tableId) {
  const anchor = document.getElementById("stockTable");
  anchor.innerHTML = ""; // clear previous content

  const table = document.createElement("table");

  // Append an inline row for user input (add new item)
  table.appendChild(createRow(null, { isInline: true, tableId: "debee654-6588-4377-a8d5-1bc5c786fbc5" }));

  // Append each data row
  items.forEach(item => {
    console.log("creating rows", item)
    table.appendChild(createRow(item));
  });

  anchor.appendChild(table);
}

/** 
 * Creates a single table row element.
 * Supports both display mode (existing data) and inline input mode (for adding new items).
 * 
 * @param {Object|null} data - Item data for display mode; null for inline row.
 * @param {Object} options - Configuration options.
 * @param {boolean} options.isInline - True if row is for inline input.
 * @param {string} options.tableId - Table identifier for submitting new rows.
 */
function createRow(data, { isInline = false, tableId } = {}) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const qtyCell = document.createElement("td");

    if (isInline) {
        // INPUT MODE: row with input fields for adding a new item
        const productInput = document.createElement("input");
        const qtyInput = document.createElement("input");
        
        productInput.placeholder = "Product...";
        qtyInput.placeholder = "Qty...";
        qtyInput.type = "number";
        row.dataset.type = "inline";
        nameCell.className = "input";
        qtyCell.className = "input";
        nameCell.appendChild(productInput);
        
        qtyCell.appendChild(qtyInput);

        // Handles submission when user presses Enter on quantity input
        async function submit() {
            const product = productInput.value.trim();
            const qty = parseInt(qtyInput.value);

            if (!product || isNaN(qty)) return; // ignore invalid input

            // Temporarily render the new row optimistically
            const tempRow = createRow({ product, qty });
            row.parentNode.insertBefore(tempRow, row.nextSibling);

            // Clear input fields
            productInput.value = "";
            qtyInput.value = "";
            productInput.focus();

            console.log(product, qty);

            // Persist new row via API
            const { data: real, error } = await API.insertRow("testhouse", {
                product: product,
                qty: qty,
                table_id: tableId
            });

            if (error || !real) {
                console.error("Insert failed", error, "data:",data);
                tempRow.remove();
                return;
            }

            // Replace optimistic row with server-confirmed row
            const realRow = createRow(real);
            tempRow.replaceWith(realRow);
        }

        // Navigate between input fields on Enter
        productInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") qtyInput.focus();
        });

        qtyInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") submit();
        });

        productInput.focus();

    } else {
        // DISPLAY MODE: show existing data
        row.id = `row-${data.id}`;
        nameCell.textContent = data.product;
        qtyCell.appendChild(createQuantityCell(data.qty));
    }

    row.appendChild(nameCell);
    row.appendChild(qtyCell);

    return row;
}

// --- Quantity Editing & Increment/Decrement Handling ---

const tableContainer = document.getElementById("stockTable");

// Handles clicks inside the table to enable inline quantity editing or increment/decrement buttons
tableContainer.addEventListener("click", async (e) => {
    console.log(e)
    console.log("GETTING EDITED");
    const cell = e.target.closest("td");
    const row = cell.closest("tr");

    // Skip invalid cells (non-table data cells or header)
    if (!row || !cell || cell.cellIndex !==1){
        console.log("invalid cell", e, e.target);
        return;
    }

    // Handle plus/minus buttons
    if (e.target.classList.contains("qty-btn")) {
        await additionAndSubtraction(e, cell, row);
        return; // prevent further editing logic
    }

    // Convert cell into editable input field
    const oldValue = parseInt(cell.querySelector("span").innerText);
    const input = document.createElement("input");
    input.type = "number";
    input.value = oldValue;
    input.style.width = "80%";
    cell.textContent = "";
    cell.appendChild(input);
    input.focus();

    // Commit changes on blur
    input.addEventListener("blur", async () => {
        const newValue = parseInt(input.value);
        if (!isNaN(newValue) && newValue !== oldValue){
            // Optimistic update
            cell.innerHTML = "";
            cell.appendChild(createQuantityCell(newValue));
            const { data, error } = await API.updateRowById("testhouse", parseInt(row.id.replace("row-", "")), {qty: newValue})
            if (error){
                console.log("db change failed, rolling back", error)
                cell.innerHTML = "";
                cell.appendChild(createQuantityCell(oldValue));
            }
        } else {
            // Invalid input, revert
            console.log("invalid value");
            cell.innerHTML = "";
            cell.appendChild(createQuantityCell(oldValue));
        }
    });

    // Commit or revert changes on Enter/Escape
    input.addEventListener("keydown", async (event) => {
        if (event.key === "Enter"){
            input.blur();
        }
        if (event.key === "Escape"){
            cell.innerHTML = "";
            console.log(oldValue);
            cell.appendChild(createQuantityCell(oldValue));
        }
    });
});

// Creates a div containing quantity with plus/minus buttons for consistent layout
function createQuantityCell(quantity){
    const quantityContainer = document.createElement("div");
    quantityContainer.style.display = "flex";
    quantityContainer.style.alignItems = "center"; // vertical centering
    quantityContainer.style.justifyContent = "center"; // horizontal centering
    quantityContainer.style.gap = "8px";
    quantityContainer.style.height = "100%"; // ensures div fills td vertically

    const minusBtn = document.createElement("button");
    minusBtn.textContent = "-";
    minusBtn.className = "qty-btn"; 

    const qtyNumber = document.createElement("span");
    qtyNumber.textContent = quantity;

    const plusBtn = document.createElement("button");
    plusBtn.textContent = "+";
    plusBtn.className = "qty-btn";

    quantityContainer.appendChild(minusBtn);
    quantityContainer.appendChild(qtyNumber);
    quantityContainer.appendChild(plusBtn);

    return quantityContainer;
}

// --- Modal Utility for User Input ---
/**
 * Creates and opens a fully dynamic modal.
 *
 * DESIGN PRINCIPLE:
 * - This modal is intentionally stupid
 * - It does NOT manage layout or form logic
 * - It only handles:
 *    - rendering container
 *    - mounting user-provided content
 *    - actions (buttons)
 *    - close lifecycle
 *    - keyboard + overlay dismissal
 *
 * Everything inside the modal is fully controlled by the caller.
 */
export function openModal({
    title = null,
    content = null,          // HTMLElement | HTMLElement[] | string | null
    actions = [],            // optional footer buttons
    onKeydown = null,       // custom keyboard handler hook
    closeOnOverlay = true,
    closeOnEscape = true
    } = {}) {

    return new Promise((resolve) => {

        // =========================================================
        // 1. CREATE BASE STRUCTURE
        // =========================================================

        // Dark overlay behind modal (click-to-close surface)
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        // Main modal container
        const modal = document.createElement("div");
        modal.className = "modal";

        // =========================================================
        // 2. OPTIONAL TITLE
        // =========================================================
        // If provided, render a simple header element
        if (title) {
        const titleEl = document.createElement("h3");
        titleEl.textContent = title;
        modal.appendChild(titleEl);
        }

        // =========================================================
        // 3. CONTENT RENDERING (USER CONTROLLED)
        // =========================================================
        /**
         * Content can be:
         * - HTMLElement       -> appended directly
         * - HTMLElement[]     -> appended in order
         * - string            -> converted to <p>
         */
        if (Array.isArray(content)) {
        content.forEach(el => el && modal.appendChild(el));

        } else if (content instanceof HTMLElement) {
        modal.appendChild(content);

        } else if (typeof content === "string") {
        const p = document.createElement("p");
        p.textContent = content;
        modal.appendChild(p);
        }

        // =========================================================
        // 4. ACTION FOOTER (BUTTONS)
        // =========================================================
        /**
         * actions format:
         * [
         *   {
         *     label: "Confirm",
         *     className: "confirm",
         *     onClick: () => value
         *   }
         * ]
         */
        if (actions.length) {
        const actionsContainer = document.createElement("div");
        actionsContainer.className = "modal-actions";

        actions.forEach(({ label, className = "", onClick }) => {
            const btn = document.createElement("button");
            btn.textContent = label;
            btn.className = `modal-btn ${className}`;

            // Each button can optionally return a value
            // If return !== false → modal closes
            btn.onclick = async () => {
            const result = await onClick?.();
            if (result !== false) close(result);
            };

            actionsContainer.appendChild(btn);
        });

        modal.appendChild(actionsContainer);
        }

        // Mount modal into DOM
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // =========================================================
        // 5. CLOSE HANDLER (SINGLE SOURCE OF TRUTH)
        // =========================================================
        function close(value) {
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("keydown", handleKeydown);
        overlay.remove();
        resolve(value);
        }

        // =========================================================
        // 6. KEYBOARD HANDLING (GLOBAL MODAL SHORTCUTS)
        // =========================================================
        /**
         * Priority order:
         * 1. custom onKeydown hook (user-defined logic)
         * 2. Escape key default close behavior
         */
        function handleKeydown(e) {

        // Allow user-defined keyboard logic
        if (onKeydown) {
            const result = onKeydown(e, { close });

            // If handler returns false → block default behavior
            if (result === false) return;
        }

        // Default Escape behavior
        if (closeOnEscape && e.key === "Escape") {
            close(null);
        }
        }

        document.addEventListener("keydown", handleKeydown);

        // =========================================================
        // 7. OVERLAY CLICK TO CLOSE
        // =========================================================
        overlay.onclick = (e) => {
        if (closeOnOverlay && e.target === overlay) {
            close(null);
        }
        };

        // =========================================================
        // 8. LEGACY ESCAPE HANDLER (REDUNDANT)
        // =========================================================
        /**
         * NOTE:
         * This duplicates Escape handling already in handleKeydown.
         * It is kept intentionally bcz i don't really want to fuck around with this function anymore
         */
        function onKey(e) {
        if (closeOnEscape && e.key === "Escape") {
            close(null);
        }
        }

        document.addEventListener("keydown", onKey);
    });
}

export async function loginModal(){
    const emailField = document.createElement("input");
    const passwordField = document.createElement("input");
    emailField.className = "modal-input";
    passwordField.className = "modal-input";
    emailField.placeholder = "enter email";
    passwordField.placeholder = "enter password";

    const result = await openModal({
        title: "login or register",
        content: [
            emailField,
            passwordField,
        ],
        actions: [
            {
                label: "login",
                className: "confirm",
                onClick: () => {
                    const email = emailField.value;
                    const password = passwordField.value;
                    const action = "login";
                    return {email, password, action}
                }
            },
            {
                label: "register",
                className: "confirm",
                onClick: () => {
                    const email = emailField.value;
                    const password = passwordField.value;
                    const action = "register"
                    return {email, password, action}
                }
            }
        ],
        onKeydown: (e, { close }) => {
            if (e.key === "Enter") {
                const email = emailField.value;
                const password = passwordField.value;
                close({email, password});
                return false; 
            }
        },
    })
    return result
}



export function togglePopover(session) {
    const popover = document.getElementById("user-popover");
    const emailEl = document.getElementById("user-email");
    if (!session) return;
    emailEl.textContent = session.user.email;
    popover.classList.toggle("hidden");
}

// close when clicking outside
document.addEventListener("click", (e) => {
    const popover = document.getElementById("user-popover");
    if (!popover.contains(e.target) && !e.target.closest("#profile-btn")) {
        popover.classList.add("hidden");
    }
});

// Handles addition or subtraction via modal input triggered by plus/minus buttons
async function additionAndSubtraction (e, cell, row){
    const oldValue = parseInt(cell.querySelector("span").textContent);
    const isPlus = e.target.textContent === "+";

    const modalrow = document.createElement("div");
    modalrow.className = "modal-row";

    const label = document.createElement("label");
    label.textContent = `${oldValue} +`;
    

    const input = document.createElement("input");
    input.type = "number";
    input.className = "modal-input";

    modalrow.append(label, input);

    const amount = await openModal({
        content: modalrow,
        actions: [
        {
            label: "confirm",
            className: "confirm",
            onClick: () => {
            const value = parseInt(input.value);
            return isNaN(value) ? false : value;
            }
        },
        {
            label: "cancel",
            className: "cancel",
            onClick: () => null
        }
        ],
         onKeydown: (e, { close }) => {
            if (e.key === "Enter") {
            const value = parseInt(input.value);
            console.log("i hear ya"),
            close(isNaN(value) ? null : value);
            return false; // stop default handling
            }
        },
    });


    if (amount === null || isNaN(amount)) return;

    const newValue = isPlus ? oldValue + amount : oldValue - amount;

    // Optimistic UI update
    console.log("optimistic update by AS")
    cell.innerHTML = "";
    cell.appendChild(createQuantityCell(newValue));

    // Persist change to DB
    const { data, error } = await API.updateRowById("testhouse", parseInt(row.id.replace("row-", "")), { qty: newValue })
    if (error){
        console.log("db change failed, rolling back", error)
        cell.innerHTML = "";
        cell.appendChild(createQuantityCell(oldValue));
    }
}

// Updates the authentication UI to show current user status
export function updateAuthUI(session) {
    const status = document.getElementById("status");
    const loginBtn = document.getElementById("login-modal-btn");
    if (session) {
        loginBtn.textContent = "profile";
    } else {
        loginBtn.textContent = "login";
    }
}

// --- Payload Handling from Database / Backend ---

export function handlePayload(payload){
    const currentContainer = document.getElementById("stockTable");
    const currentTable = currentContainer.querySelector("table");

    if (!currentTable) {
        console.log("no table found?", currentTable, currentContainer)
        return;
    }

    const {eventType, new: newRow, old } = payload 
    const rowId = newRow?.id || old?.id
    const existingRow = document.getElementById(`row-${rowId}`)

    if (eventType === "INSERT") {
        // New row added
        if (existingRow){
            console.log("row updated optimistically, ignoring payload info");
            return;
        }
        console.log("payload", payload.new)
        currentTable.appendChild(createRow(payload.new))
    } else if (eventType === "UPDATE") {
        // Existing row updated
        if (existingRow){
            existingRow.cells[0].textContent = newRow.product;
            const newDiv = createQuantityCell(newRow.qty);
            const newCell = document.createElement("td");
            newCell.style.verticalAlign = "middle";
            newCell.appendChild(newDiv)
            existingRow.replaceChild(newCell, existingRow.cells[1]);
        }
    } else if (eventType == "DELETE"){
        // Remove row
        if (existingRow) {
            existingRow.remove()
        }
    }
}

// --- Sidebar Navigation Setup ---

const menuBtn = document.getElementById("menu-btn");
const sidebar = document.getElementById("sidebar");

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("open");
});
document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
        sidebar.classList.remove("open");
    }
});

// Creates a menu section with buttons
function createMenuSection(title, items) {
    const section = document.createElement("div");
    section.className = "menu-section";

    const header = document.createElement("h3");
    header.textContent = title;

    section.appendChild(header);

    items.forEach(item => {
        const btn = document.createElement("button");
        btn.textContent = item.label;
        btn.onclick = item.onClick;
        section.appendChild(btn);
    });

    return section;
}

// Append sections to sidebar
sidebar.appendChild(
  createMenuSection("General", [
    { label: "Dashboard", onClick: () => console.log("go dashboard") },
    { label: "Stock", onClick: () => console.log("go stock") }
  ])
);

sidebar.appendChild(
  createMenuSection("Admin", [
    { label: "Users", onClick: () => console.log("manage users") }
  ])
);

// --- Modal for Editing Row Name / Deleting Row ---

tableContainer.addEventListener("click", async (e) => {
    const cell = e.target.closest("td");
    const row = e.target.closest("tr");

    if (!row || !cell) return;

    // Skip inline row or non-name cells
    if (row.dataset.type === "inline") return;
    if (cell.cellIndex !== 0) return;
    if (e.target.tagName === "BUTTON") return;

    const rowId = parseInt(row.id.replace("row-", ""));
    const currentName = cell.textContent;

    openEditModal({ rowId, currentName, row });
});

function openEditModal({ rowId, currentName, row }) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const input = document.createElement("input");
    input.value = currentName;

    const saveBtn = document.createElement("button");
    saveBtn.className = "modal-btn confirm"
    saveBtn.textContent = "Save";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.className = "modal-btn delete"

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "modal-btn cancel"
    cancelBtn.textContent = "Cancel";
    
    const modalActions = document.createElement("div");
    modalActions.className = "modal-actions";

    modalActions.appendChild(saveBtn);
    modalActions.appendChild(cancelBtn);
    modalActions.appendChild(deleteBtn);

    modal.append(input, modalActions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    input.focus();

    // Save handler
    saveBtn.onclick = async () => {
        const newName = input.value.trim();
        if (!newName) return;

        // Optimistic UI update
        row.cells[0].textContent = newName;

        const { error } = await API.updateRowById("testhouse", rowId, { product: newName });

        if (error) {
            console.log("update failed", error);
            row.cells[0].textContent = currentName; // rollback
        }

        overlay.remove();
    };

    // Delete handler
    deleteBtn.onclick = async () => {
        row.remove(); // optimistic removal

        const { error } = await API.deleteRowById("testhouse", rowId);

        if (error){
            console.log("delete failed", error);
            document.querySelector("table").appendChild(row); // rollback
        }

        overlay.remove();
    };

    // Cancel handler
    cancelBtn.onclick = () => overlay.remove();

    // Close modal on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
}