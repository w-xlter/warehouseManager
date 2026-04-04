import * as AUTH from "./auth.js";
import * as API from "./api.js";
import * as UI from "./ui.js";

document.addEventListener("DOMContentLoaded", async () => {
  // Check if user is logged in
  const { data: { session } } = await AUTH.getSession();
  if (!session) {
    console.log("Not logged in");
  } else {
    console.log("Logged in as", session.user.email);
  }
  document.getElementById("signup").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const { user } = await AUTH.signUp(email, password);
      if (user) {
        alert("Account created! Logged in as " + user.email);
        // optionally hide auth form and show table
      }
    } catch (err) {
      alert(err.message);
    }
  });
  // Login
  document.getElementById("login").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    try {
      await AUTH.signIn(email, password);
      alert("Logged in!");
      // Optionally hide auth form and show table
    } catch (err) {
      alert(err.message);
    }
  });

  // Logout
  document.getElementById("logout").addEventListener("click", async () => {
    await AUTH.signOut();
    alert("Logged out!");
  });

  // Fetch initial items
  await loadAndRender();

  // Subscribe to table changes
  API.supabase.channel("public:testHouse")
    .on("postgres_changes", { event: "*", schema: "public", table: "testHouse" }, UI.handlePayload)
    .subscribe();
  const status = document.getElementById("status");
if (session) {
  status.textContent = "Logged in as " + session.user.email;
} else {
  status.textContent = "Not logged in";
}
});

async function loadAndRender() {
  const items = await API.getItems();
  UI.render(items);
}