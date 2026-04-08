import * as API from "./api.js"

/*
renders a teable of items inside "stockTable"

- Takes an array of items as an imout
- updates the DOM
*/
export function render(items, tableId) {
  const anchor = document.getElementById("stockTable");
  anchor.innerHTML = "";

  const table = document.createElement("table");

  // inline row
  table.appendChild(createRow(null, { isInline: true, tableId: "debee654-6588-4377-a8d5-1bc5c786fbc5" }));

  // data rows
  items.forEach(item => {
    console.log("creating rows", item)
    table.appendChild(createRow(item));
  });

  anchor.appendChild(table);
}

function createRow(data, { isInline = false, tableId } = {}) {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    const qtyCell = document.createElement("td");

    if (isInline) {
    // INPUT MODE
    const productInput = document.createElement("input");
    const qtyInput = document.createElement("input");

    productInput.placeholder = "Product...";
    qtyInput.placeholder = "Qty...";
    qtyInput.type = "number";

    nameCell.appendChild(productInput);
    qtyCell.appendChild(qtyInput);

    async function submit() {
        const product = productInput.value.trim();
        const qty = parseInt(qtyInput.value);

        if (!product || isNaN(qty)) return;

        const tempRow = createRow({ product, qty });
        row.parentNode.insertBefore(tempRow, row.nextSibling);

        productInput.value = "";
        qtyInput.value = "";
        productInput.focus();
        console.log(product, qty)
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

        const realRow = createRow(real);
        tempRow.replaceWith(realRow);
    }

    productInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") qtyInput.focus();
    });

    qtyInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });

    productInput.focus();

  } else {
    // DISPLAY MODE
    row.id = `row-${data.id}`;
    nameCell.textContent = data.product;
    qtyCell.appendChild(createQuantityCell(data.qty));
  }

  row.appendChild(nameCell);
  row.appendChild(qtyCell);

  return row;
}


//code that enable quantity changes
const tableContainer = document.getElementById("stockTable");

//handles direct clicks on quantity
tableContainer.addEventListener("click", async (e) => {
    console.log(e)
    console.log("GETTING EDITED");
    const cell = e.target.closest("td");
    const row = cell.closest("tr");

    //ignore possible header row or non quantity cells
    if (!row || !cell || cell.cellIndex !==1){
        console.log("invalid cell", e, e.target);
        return
    }
    if (e.target.classList.contains("qty-btn")) {
    await additionAndSubtraction(e, cell, row)
    return; // IMPORTANT
    }
    //make cell editable
    const oldValue = parseInt(cell.querySelector("span").innerText);
    const input = document.createElement("input");
    input.type = "number"
    input.value = oldValue;
    input.style.width = "80%"
    cell.textContent = ""
    cell.appendChild(input)
    input.focus()

    //listener for when user finishes editing
    input.addEventListener("blur", async () => {
        const newValue = parseInt(input.value);
        if (!isNaN(newValue) && newValue !== parseInt(oldValue)){
            cell.innerHTML = "";
            cell.appendChild(createQuantityCell(newValue));
            const { data, error } = await API.updateRowById("testhouse", parseInt(row.id.replace("row-", "")), {qty: parseInt(newValue)})
            if (error){
                console.log("db change failed, rolling back", error)
                cell.innerHTML = "";
                cell.appendChild(createQuantityCell(oldValue));
            }
        } else {
            console.log("invalid value")
            cell.innerHTML = "";
            cell.appendChild(createQuantityCell(oldValue))
        }
    })
    input.addEventListener("keydown", async (event) => {
        if (event.key === "Enter"){
            input.blur();
        }
        if (event.key === "Escape"){
            cell.innerHTML = "";
            console.log(oldValue)
            cell.appendChild(createQuantityCell(oldValue))
        }
    })
} )


//function to create a wrapped div in the quantity cell of the table.
function createQuantityCell(quantity){
    const quantityContainer = document.createElement("div");
    quantityContainer.style.display = "flex";
    quantityContainer.style.alignItems = "center"; // vertical centering
    quantityContainer.style.justifyContent = "center"; // horizontal centering
    quantityContainer.style.gap = "8px";
    quantityContainer.style.height = "100%"; // ensures div fills the td vertically

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

export function openModal({ title, placeholder = "", initialValue = "" }) {
    return new Promise((resolve) => {
        // overlay
        const overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        // modal box
        const modal = document.createElement("div");
        modal.className = "modal";

        // row container (label + input)
        const row = document.createElement("div");
        row.className = "modal-row";

        const label = document.createElement("label");
        label.textContent = title;

        const input = document.createElement("input");
        input.type = "number";
        input.placeholder = placeholder;
        input.value = initialValue;

        row.appendChild(label);
        row.appendChild(input);

        // buttons
        const actions = document.createElement("div");
        actions.className = "modal-actions";

        const cancel = document.createElement("button");
        cancel.textContent = "annulla";
        cancel.className = "modal-btn cancel";

        const confirm = document.createElement("button");
        confirm.textContent = "conferma";
        confirm.className = "modal-btn confirm";

        actions.appendChild(cancel);
        actions.appendChild(confirm);

        modal.appendChild(row);
        modal.appendChild(actions);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        input.focus();

        function close(value) {
            overlay.remove();
            resolve(value);
        }

        confirm.onclick = () => {
            const value = parseInt(input.value);
            close(isNaN(value) ? null : value);
        };

        cancel.onclick = () => close(null);

        overlay.onclick = (e) => {
            if (e.target === overlay) close(null);
        };

        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") confirm.click();
            if (e.key === "Escape") close(null);
        });
    });
}

async function additionAndSubtraction (e, cell, row){
    const oldValue = parseInt(cell.querySelector("span").textContent);
    const isPlus = e.target.textContent === "+";
    const amount = await openModal({
    title: isPlus
    ? `${oldValue} +`
    : `${oldValue} - `,
    placeholder: "",
    });

    if (amount === null || isNaN(amount)) return;

    const newValue = isPlus ? oldValue + amount : oldValue - amount;

    // update DB
    console.log("optimistic update by AS")
    cell.innerHTML = "";
    cell.appendChild(createQuantityCell(newValue));
    const { data, error } = await API.updateRowById("testhouse", parseInt(row.id.replace("row-", "")), { qty: newValue })
    if (error){
        console.log("db change failed, rolling back", error)
        cell.innerHTML = "";
        cell.appendChild(createQuantityCell(oldValue));
    }
}

//handles AUTH changes
export function updateAuthUI(session) {
  const status = document.getElementById("status");

  if (session) {
    status.textContent = "Logged in as " + session.user.email;
  } else {
    status.textContent = "Not logged in";
  }
}

//function that handles the modal to change values in the table


//function that handles changes sent by the DB
export function handlePayload(payload){
    const currentContainer = document.getElementById("stockTable");
    const currentTable = currentContainer.querySelector("table");

    if (!currentTable) {
        console.log("no table found?", currentTable, currentContainer)
        return
    }
    const {eventType, new: newRow, old } = payload 
    const rowId = newRow?.id || old?.id
    const existingRow = document.getElementById(`row-${rowId}`)

    if (eventType === "INSERT") {
        //then add to table
        if (existingRow){
            console.log("row updated optimistically, ignoring payload info");
            return
        }
        console.log("payload", payload.new)
        currentTable.appendChild(createRow(payload.new))
    }

    else if (eventType === "UPDATE") {
        if (existingRow){
            existingRow.cells[0].textContent = newRow.product;
            const newDiv = createQuantityCell(newRow.qty);
            const newCell = document.createElement("td");
            newCell.style.verticalAlign = "middle";
            newCell.appendChild(newDiv)
            existingRow.replaceChild(newCell, existingRow.cells[1]);
        }
    }
    else if (eventType == "DELETE"){
        if (existingRow) {
            existingRow.remove()
        }
    }
}

//sidebar code
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