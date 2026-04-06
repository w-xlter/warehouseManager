import * as AUTH from "./auth.js";
import * as API from "./api.js";
import * as UI from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {

  // --- INITIAL AUTH CHECK ---
  const { data } = await AUTH.getSession();
  const session = data.session;

  if (!session) {
    console.log("User not logged in yet");
  } else {
    console.log("LNR Current user ID:", session.user.id);
    await loadAndRender(); // fetch data now that session is active
  }
  // --- REAL-TIME AUTH LISTENER ---
  // This runs whenever login/logout happens
  AUTH.onAuthChange((event, session) => {
    console.log("Auth changed:", event);
    UI.updateAuthUI(session);
  });

  // --- SIGN UP ---
  document.getElementById("signup").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const { user } = await AUTH.signUp(email, password);

      if (user) {
        alert("Account created! Logged in as " + user.email);
        // UI update handled automatically by onAuthChange
      }

    } catch (err) {
      alert(err.message);
    }
  });

  // --- LOGIN ---
  document.getElementById("login").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await AUTH.signIn(email, password);

      // Wait for session to be active
      const { data: sessionData } = await AUTH.getSession();
      if (sessionData.session) {
        await loadAndRender(); // fetch items now that auth.uid() exists
      }

    } catch (err) {
      alert(err.message);
    }
  });

  // --- LOGOUT ---
  document.getElementById("logout").addEventListener("click", async () => {
    await AUTH.signOut();
    // UI update handled automatically by onAuthChange
  });

  // --- INITIAL DATA LOAD ---
  // Fetch items from DB and render table
  await loadAndRender();

  // --- REAL-TIME DB SUBSCRIPTION ---
  // Listen for any changes in the table and update UI accordingly
  AUTH.supabase
    .channel("public:testhouse")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "testhouse" },
      UI.handlePayload
    )
    .subscribe();

  // --- FALLBACK STATUS UPDATE ---
  // (Redundant, since updateAuthUI already handles this, but kept for clarity)
  const status = document.getElementById("status");

  if (session) {
    status.textContent = "Logged in as " + session.user.email;
  } else {
    status.textContent = "Not logged in";
  }
});


// --- DATA FETCH FUNCTION ---
// Gets items from API and renders them in the UI
async function loadAndRender() {
  // Ensure session exists
  const { data: { session } } = await AUTH.getSession();
  if (!session) {
    console.log("No session, skipping fetch");
    return;
  }

  console.log("LNR Current session:", session);
  console.log("LNR Current user ID:", session.user.id);

  // Optional: explicitly set session on Supabase client
  // supabase.auth.setSession(session.access_token); // usually not needed if using the same client

  const items = await API.getItems();
  console.log("loadAndRender items:", items);
  UI.render(items);
}