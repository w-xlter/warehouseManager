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

        const quantity = document.createElement("td")
        quantity.textContent = item.qty;

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
            existingRow.cells[1].textContent = newRow.qty
        }
    }
    else if (eventType == "DELETE"){
        if (existingRow) {
            existingRow.remove()
        }
    }
}

//code that enable quantity changes

const tableContainer = document.getElementById("stockTable")

tableContainer.addEventListener("click", async (e) => {
    const cell = e.target;
    const row = cell.closest("tr");

    //ignore possible header row or non quantity cells
    if (!row || cell.cellIndex !==1){
        console.log("invalid cell");
        return
    }
    //make cell editable
    const oldValue = cell.textContent;
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
            cell.textContent = newValue;
            await API.supabase
            .from("testHouse")
            .update({qty: parseInt(newValue)})
            .eq("id", parseInt(row.id.replace("row-", "")));
        } else {
            cell.textContent = oldValue;
        }
    })
    input.addEventListener("keydown", async (event) => {
        if (event.key === "Enter"){
            input.blur();
        }
        if (event.key === "Escape"){
            cell.textContent = oldValue;
        }
    })
} )