import * as UI from "./ui.js"
import * as API from "./api.js"

document.addEventListener("DOMContentLoaded", async () => {
        UI.print()
        const objects = await API.getItems()
        console.log(objects)
        objects.forEach(object => {
            console.log(object)
        });
})