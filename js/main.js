import * as UI from "./ui.js";
import * as API from "./api.js";

/**
 * Simulated user ID.
 *
 * In the future, this should come from authentication
 * (e.g., Supabase Auth user.id).
 *
 * Current approach:
 * - Generates a random user identifier on each page load
 * - Not persistent across sessions/devices
 */
const USER_ID = "user_" + Math.floor(Math.random() * 1000);

/**
 * Application entry point.
 *
 * Responsibilities:
 * 1. Fetch initial data from backend
 * 2. Render UI
 * 3. Attach interaction logic
 * 4. Start background processes (cleanup)
 * 5. Subscribe to realtime updates
 */
async function init() {

    /**
     * STEP 1: Fetch data from Supabase
     *
     * - Returns an array of items from "testHouse"
     * - Each item contains:
     *   { id, product, qty, editing_by, editing_at }
     */
    const items = await API.getItems();

    /**
     * Debug log to verify data integrity.
     * Useful for checking:
     * - Empty datasets
     * - Unexpected null values
     */
    console.log("Items:", items);

    /**
     * STEP 2: Render the table UI
     *
     * - Completely rebuilds the table DOM
     * - Delegates row rendering to UI.updateRowUI()
     */
    UI.print(items);

    /**
     * STEP 3: Attach user interaction logic
     *
     * - Handles click-to-lock/unlock behavior
     * - Uses event delegation (attached to container)
     * - Requires:
     *   - Supabase client (for DB updates)
     *   - USER_ID (to track ownership of locks)
     */
    UI.attachRowHighlight(API.supabase, USER_ID);

    /**
     * STEP 4: Start periodic cleanup process
     *
     * - Runs every 5 seconds
     * - Removes expired locks (UI only)
     *
     */
    UI.startLockCleanup(items);

    /**
     * STEP 5: Setup realtime subscription
     *
     * - Subscribes to PostgreSQL changes via Supabase Realtime
     * - Listens to INSERT, UPDATE, DELETE events ("*")
     * - Scope:
     *   schema: "public"
     *   table: "testHouse"
     */
    const channel = API.supabase
        .channel("public:testHouse")
        .on(
            "postgres_changes",
            {
                event: "*",           // listen to all events
                schema: "public",
                table: "testHouse"
            },
            payload => {
                /**
                 * payload structure:
                 * - payload.new → new row state (for INSERT/UPDATE)
                 * - payload.old → previous row state (for DELETE/UPDATE)
                 */

                const row = document.querySelector(`#row-${payload.new.id}`);

                /**
                 * If row is not found:
                 * - Could be a new row not yet rendered
                 * - Could be deleted row
                 *
                 * Current behavior: ignore
                 * Alternative: trigger full re-render
                 */
                if (!row) return;

                /**
                 * Update the UI using the latest database state.
                 *
                 * This ensures:
                 * - Cross-device sync
                 * - Consistency with backend
                 * - Correct handling of locks
                 */
                UI.updateRowUI(row, payload.new);
            }
        );

    /**
     * Activate the realtime subscription.
     *
     * - Must be awaited to ensure connection is established
     * - Internally opens a WebSocket connection
     */
    await channel.subscribe();
}

/**
 * Bootstraps the application once DOM is fully loaded.
 *
 * Prevents:
 * - Accessing DOM elements before they exist
 * - Race conditions during initialization
 */
document.addEventListener("DOMContentLoaded", init);