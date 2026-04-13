import * as AUTH from "./auth.js";
import { getActiveTableId } from "./state.js";
/**
 * Fetch all items from the "testhouse" table.
 * Ensures a valid authenticated session exists before querying.
 * Returns an empty array on failure to keep UI stable.
 */
export async function getItems(table_id) {
	try {
		// Retrieve current auth session
		const { data: sessionData, error: sessionError } = await AUTH.getSession();
		if (sessionError) console.error("Session error:", sessionError);

		const session = sessionData?.session;

		// Guard: no session → no data access
		if (!session) {
		console.warn("No active session found");
		return [];
		}

		// Fetch all rows (RLS will filter based on user permissions)
		const { data, error } = await AUTH.supabase
		.from("testhouse")
		.select("*")
		.eq("table_id", getActiveTableId())

		if (error) {
		console.error("Fetch error:", error);
		return [];
		}

		return data;

	} catch (err) {
		// Catch unexpected runtime errors (network, auth edge cases, etc.)
		console.error("Unexpected error in getItems():", err);
		return [];
	}
}

/**
 * Update a single row by ID.
 * @param {string} table - Table name
 * @param {number} id - Row ID
 * @param {object} updates - Fields to update
 */
export async function updateRowById(table, id, updates) {
	console.log("Updating row:", { table, id, updates });

	return await AUTH.supabase
		.from(table)
		.update(updates)
		.eq("id", id);
}

/**
 * Insert a new row into a table.
 * Uses `.single()` to return the inserted row as an object instead of an array.
 * @param {string} table - Table name
 * @param {object} values - Row data
 */
export async function insertRow(table, values) {
	console.log("Inserting row:", { table, values });

	return await AUTH.supabase
		.from(table)
		.insert(values)
		.select()
		.single();
}

/**
 * Delete a row by ID.
 * @param {string} table - Table name
 * @param {number} id - Row ID
 */
export async function deleteRowById(table, id) {
	console.log("Deleting row:", { table, id });

	return await AUTH.supabase
		.from(table)
		.delete()
		.eq("id", id);
}


export async function getAvailableTables() {
    const { data, error } = await AUTH.supabase
      .from("tables")
      .select("*");

    if (error) {
      console.error("Fetch error:", error);
      return [];
    }

    return data;
}