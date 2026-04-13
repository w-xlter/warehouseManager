import * as AUTH from "./auth.js";
import * as API from "./api.js";
import * as UI from "./ui.js";

/*
 * Main entry point executed when DOM content is fully loaded.
 * Initializes authentication, sets up event listeners, fetches initial data,
 * and subscribes to real-time database changes.
 */

let activeTableId = null;
let currentChannel = null;
document.addEventListener("DOMContentLoaded", async () => {

	// --- INITIAL AUTH CHECK ---
	// Retrieve current session to determine if user is logged in
	const { data } = await AUTH.getSession();
	const session = data.session;
	UI.initSidebar();
	if (!session) {
		console.log("User not logged in yet");
		loginModal()
	} else {
		console.log("LNR Current user ID:", session.user.id, "inital auth check");
		getTables();
	}

	// --- REAL-TIME AUTH LISTENER ---
	// Updates UI whenever the user's authentication state changes (login/logout)
	AUTH.onAuthChange(async (event, session) => {
		console.log("Auth changed:", event);
		if (event == "SIGNED_OUT"){
			location.reload();
			return;
		}


		if (event == "SIGNED_IN"){
			getTables();
		}
		UI.updateAuthUI(session); // update displayed login status
	});
});


//triggers the modal that handles the login/registration, then calls on supabase functions.
document.getElementById("login-modal-btn").addEventListener("click", async () => {
    const { data: { session } } = await AUTH.getSession();
    if (!session) {
		const {email, password, action} = await UI.loginModal();
		console.log(email, password, action);
		if (action == "login"){
			try {
				await AUTH.signIn(email, password);
				const { data: sessionData } = await AUTH.getSession();
			if (sessionData.session) {
				await loadAndRender(); 
			}

			} catch (err) {
			alert(err.message); 
			}
		} else if (action == "register") {
			try {
			const { user } = await AUTH.signUp(email, password);

			if (user) {
				alert("Account created! Logged in as " + user.email);

			}

			} catch (err) {
				alert(err.message); 
			}
		}

    }
	UI.togglePopover(session);
});

async function loginModal() {
	const { data: { session } } = await AUTH.getSession();
    if (!session) {
		const {email, password, action} = await UI.loginModal();
		console.log(email, password, action);
		if (action == "login"){
			try {
				await AUTH.signIn(email, password);
				const { data: sessionData } = await AUTH.getSession();
			if (sessionData.session) {
				await loadAndRender(); 
			}

			} catch (err) {
			alert(err.message); 
			}
		} else if (action == "register") {
			try {
			const { user } = await AUTH.signUp(email, password);

			if (user) {
				alert("Account created! Logged in as " + user.email);

			}

			} catch (err) {
				alert(err.message); 
			}
		}

    }
	UI.togglePopover(session);
}
document.getElementById("logout-btn").addEventListener("click", async () => {
	await AUTH.signOut();
})

async function getTables() {
	const tables = await API.getAvailableTables();
		console.log("user has access to: ",tables)
		UI.setMagazzini(
			tables.map(t => ({
				id: t.id,
				label: t.name,
				onClick: async () => {
					activeTableId = t.id;
					document.getElementById("table-name").innerText = "";
					document.getElementById("table-name").innerText = t.name;
					console.log(activeTableId, t.name);
					subscribeToTable(activeTableId);
					await loadAndRender();
				}
		}))
	);
}
// --- DATA FETCH FUNCTION ---
// Fetches items from API and renders them in the UI
async function loadAndRender() {
	if (!activeTableId) return;
	// Ensure session exists before fetching data
	const { data: { session } } = await AUTH.getSession();
	if (!session) {
		console.log("No session, skipping fetch");
		return;
	}

	console.log("LNR Current session:", session);
	console.log("LNR Current user ID:", session.user.id);

	// Fetch items from API
	const table_id = "debee654-6588-4377-a8d5-1bc5c786fbc5"
	const items = await API.getItems(activeTableId);

	console.log("loadAndRender items:", items);

	// Render fetched items in the UI table
	console.log(await API.getAvailableTables())
	UI.render(items);
}


function subscribeToTable(tableId) {
  if (currentChannel) {
    AUTH.supabase.removeChannel(currentChannel);
    currentChannel = null;
  }

  currentChannel = AUTH.supabase
    .channel(`table:${tableId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "testhouse",
        filter: `table_id=eq.${tableId}`
      },
      (payload) => {
        console.log("payload received:", payload);
        UI.handlePayload(payload);
      }
    )
    .subscribe((status) => {
      console.log("subscription status:", status);
    });

  return currentChannel;
}