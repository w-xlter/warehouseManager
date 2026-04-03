import * as API from "./api.js"
import * as UI from "./ui.js"
//await page loading
document.addEventListener("DOMContentLoaded", async () =>{
    await loadAndRender()
    API.supabase
    .channel("public:testHouse")
    .on(
        "postgres_changes", //first argument, listen to DB changes
        { event: "*", schema: "public", table: "testHouse"}, //filter
        (payload) => { 
            console.log("DB change, reloading");
            UI.handlePayload(payload);
        }
    )
    .subscribe();
});

async function loadAndRender() {
    const items = await API.getItems()
    console.log("fetched items: ", items)
    UI.render(items)
}
