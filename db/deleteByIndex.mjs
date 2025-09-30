import pkg from "pg";
const { Pool } = pkg;

// Create a connection pool
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_R4PlognbL8qm@ep-winter-river-adogkt3g-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require",
  ssl: { rejectUnauthorized: false },
  max: 10,
});

/**
 * Execute a SQL query safely
 */
async function query(sql, params = []) {
  try {
    const safeParams = params.map((param) =>
      param === undefined ? null : param
    );
    console.log("SQL:", sql);
    console.log("Params:", JSON.stringify(safeParams));

    const result = await pool.query(sql, safeParams);
    return result.rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Delete a record by its ID
 * @param {string} tableName - The name of the table
 * @param {string} id - The ID of the record to delete
 * @returns {boolean} - True if deletion was successful
 */
export async function deleteById(tableName, id) {
  try {
    const result = await pool.query(
      `DELETE FROM "${tableName}" WHERE id = $1`,
      [id]
    );
    console.log(`Deleted from ${tableName} with ID ${id}:`, result.rowCount);
    return result.rowCount > 0;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete multiple records by their IDs
 * @param {string} tableName - The name of the table
 * @param {string[]} ids - Array of IDs to delete
 * @returns {number} - Number of records deleted
 */
export async function deleteMultipleByIds(tableName, ids) {
  if (!ids || ids.length === 0) {
    return 0;
  }

  try {
    const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(",");
    const result = await pool.query(
      `DELETE FROM "${tableName}" WHERE id IN (${placeholders})`,
      ids
    );
    console.log(`Deleted ${result.rowCount} records from ${tableName}`);
    return result.rowCount;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}

/**
 * Delete records based on a WHERE condition
 * @param {string} tableName - The name of the table
 * @param {string} whereClause - SQL WHERE clause (without the "WHERE" keyword)
 * @param {Array} params - Parameters for the WHERE clause
 * @returns {number} - Number of records deleted
 */
export async function deleteWhere(tableName, whereClause, params = []) {
  try {
    const result = await pool.query(
      `DELETE FROM "${tableName}" WHERE ${whereClause}`,
      params
    );
    console.log(
      `Deleted ${result.rowCount} records from ${tableName} where ${whereClause}`
    );
    return result.rowCount;
  } catch (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }
}
