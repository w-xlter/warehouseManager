import * as API from "./api.js"

export async function print(){
    const items = [{name: "peroni", qty: 50}, {name: "coca", qty: 10}] //temp
    const anchor = document.getElementById("stockTable") //where the table will be inserted
    const table = document.createElement("table") //actual table that will be inserted
    const objects = await API.getItems()
    console.log(objects)
    objects.forEach(object => {
        console.log(object)
        const row = document.createElement("tr")
        const product = document.createElement("td")
        const amount = document.createElement("td")
        console.log(object.product, object.qty)
        product.textContent = object.product
        amount.textContent = object.qty
        console.log(product, amount)
        row.appendChild(product)
        row.appendChild(amount)
        console.log(row)
        table.appendChild(row)
    });
/*    items.forEach(element => { //foreach to insert all of the elements in the table
        const row = document.createElement("tr")
        const product = document.createElement("td")
        const amount = document.createElement("td")
        console.log(element.name, element.qty)
        product.textContent = element.name
        amount.textContent = element.qty
        console.log(product, amount)
        row.appendChild(product)
        row.appendChild(amount)
        console.log(row)
        table.appendChild(row)
    });*/
    


    anchor.appendChild(table)
}