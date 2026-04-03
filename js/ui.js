import * as API from "./api.js"

/*
renders a teable of items inside "stockTable"

- Takes an array of items as an imout
- updates the DOM
*/
export function render(items){
    //get the table
    const anchor = document.getElementById("stockTable");
    //clear current content
    anchor.innerHTML = "";

    const table = document.createElement("table");

    items.forEach(item => {
        const row = document.createElement("tr");
        row.id = `row-${item.id}`;
        const name = document.createElement("td");
        name.textContent = item.product;

        const quantity = document.createElement("td");
        quantity.style.verticalAlign = "middle";
        quantity.appendChild(createQuantityCell(item.qty))
        row.appendChild(name);
        row.appendChild(quantity)
        table.appendChild(row)
    });
    anchor.appendChild(table)
}

//function that handles changes sent by the DB
export function handlePayload(payload){

    const currentContainer = document.getElementById("stockTable");
    const currentTable = currentContainer.querySelector("table");

    if (!currentTable) {
        console.log("no table found?", currentTable, currentContainer)
        return
    }
    const {eventType, new: newRow, old } = payload 
    console.log("payload: ", eventType, newRow, old)
    const rowId = newRow?.id || old?.id
    const existingRow = document.getElementById(`row-${rowId}`)

    if (eventType === "INSERT") {
        //then add to table
        const row = document.createElement("tr");
        row.id = `row-${newRow.id}`;
        const name = document.createElement("td");
        name.textContent = newRow.product;

        const quantity = document.createElement("td")
        quantity.textContent = newRow.qty;
        row.appendChild(name);
        row.appendChild(quantity)
        currentTable.appendChild(row)
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

//code that enable quantity changes
const tableContainer = document.getElementById("stockTable");

//handles direct clicks on quantity
tableContainer.addEventListener("click", async (e) => {
    console.log(e)
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
            await API.supabase
            .from("testHouse")
            .update({qty: parseInt(newValue)})
            .eq("id", parseInt(row.id.replace("row-", "")));
        } else {
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

async function additionAndSubtraction (e, cell, row){
    const oldValue = parseInt(cell.querySelector("span").textContent);
    const isPlus = e.target.textContent === "+";

    const amount = await openQuantityPopup();
    if (amount === null || isNaN(amount)) return;

    const newValue = isPlus ? oldValue + amount : oldValue - amount;

    // update DB
    await API.supabase
        .from("testHouse")
        .update({ qty: newValue })
        .eq("id", parseInt(row.id.replace("row-", "")));

}


function openQuantityPopup(){
    return new Promise((resolve)=> {
        const popup = document.createElement("div");
        popup.className = "qty-popup";
        
        const input = document.createElement("input");
        input.type = "number";

        const ok = document.createElement("button");
        ok.textContent = "✔"
        
        const cancel = document.createElement("button");
        cancel.textContent = "✖"

        popup.appendChild(input);
        popup.appendChild(cancel);
        popup.appendChild(ok);
        document.body.appendChild(popup);

        input.focus();

        ok.onclick = () => {
            const value = parseInt(input.value);
            popup.remove();
            resolve(value);
        };

        cancel.onclick = () => {
            popup.remove();
            resolve(null);
        };
    })
}
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


