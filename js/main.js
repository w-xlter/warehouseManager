import * as AUTH from "./auth.js";
import * as API from "./api.js";
import * as UI from "./ui.js";

/*
 * Main entry point executed when DOM content is fully loaded.
 * Initializes authentication, sets up event listeners, fetches initial data,
 * and subscribes to real-time database changes.
 */
document.addEventListener("DOMContentLoaded", async () => {

  // --- INITIAL AUTH CHECK ---
  // Retrieve current session to determine if user is logged in
  const { data } = await AUTH.getSession();
  const session = data.session;

  if (!session) {
    console.log("User not logged in yet");
  } else {
    console.log("LNR Current user ID:", session.user.id);
    // If logged in, fetch data and render table immediately
    await loadAndRender();
  }

  // --- REAL-TIME AUTH LISTENER ---
  // Updates UI whenever the user's authentication state changes (login/logout)
  AUTH.onAuthChange((event, session) => {
    console.log("Auth changed:", event);
    UI.updateAuthUI(session); // update displayed login status
  });

  // --- SIGN UP ---
  // Handles user account creation
  document.getElementById("signup").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const { user } = await AUTH.signUp(email, password);

      if (user) {
        alert("Account created! Logged in as " + user.email);
        // UI will update automatically via onAuthChange listener
      }

    } catch (err) {
      alert(err.message); // display error if signup fails
    }
  });

  // --- LOGIN ---
  // Handles user login
  document.getElementById("login").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await AUTH.signIn(email, password);

      // Confirm session is active before loading data
      const { data: sessionData } = await AUTH.getSession();
      if (sessionData.session) {
        await loadAndRender(); // fetch items now that user is authenticated
      }

    } catch (err) {
      alert(err.message); // display error if login fails
    }
  });

  // --- LOGOUT ---
  // Handles user logout
  document.getElementById("logout").addEventListener("click", async () => {
    await AUTH.signOut();
    // UI updates automatically via onAuthChange listener
  });

  // --- INITIAL DATA LOAD ---
  // Fetch items from database and render table on page load
  await loadAndRender();

  // --- REAL-TIME DB SUBSCRIPTION ---
  // Subscribe to changes in the "testhouse" table for live updates
  AUTH.supabase
    .channel("public:testhouse")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "testhouse" },
      UI.handlePayload
    )
    .subscribe();

  // --- FALLBACK STATUS UPDATE ---
  // Redundant with UI.updateAuthUI, ensures status element shows current state
  const status = document.getElementById("status");

  if (session) {
    status.textContent = "Logged in as " + session.user.email;
  } else {
    status.textContent = "Not logged in";
  }
});


// --- DATA FETCH FUNCTION ---
// Fetches items from API and renders them in the UI
async function loadAndRender() {
  // Ensure session exists before fetching data
  const { data: { session } } = await AUTH.getSession();
  if (!session) {
    console.log("No session, skipping fetch");
    return;
  }

  console.log("LNR Current session:", session);
  console.log("LNR Current user ID:", session.user.id);

  // Fetch items from API
  const items = await API.getItems();
  console.log("loadAndRender items:", items);

  // Render fetched items in the UI table
  UI.render(items);
}