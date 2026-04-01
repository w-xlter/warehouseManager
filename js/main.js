import * as UI from "./ui.js"

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("btn").addEventListener("click", () => {
        UI.print()
    })
})