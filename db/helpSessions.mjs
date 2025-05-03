import mysql from "mysql2/promise";

// Create a connection pool
const pool = mysql.createPool({
  host:
    process.env.DB_HOST || "eldrix.c3u0owce2vpi.us-east-2.rds.amazonaws.com",
  user: process.env.DB_USER || "admin",
  password: process.env.DB_PASSWORD || "B99U7lu2sYcOzCk1HWSG",
  database: process.env.DB_NAME || "eldrix-prod",
  port: parseInt(process.env.DB_PORT || "3306"),
  connectionLimit: 10,
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

    const [rows] = await pool.execute(sql, safeParams);
    return rows;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

/**
 * Get all help sessions
 */
export async function getAllHelpSessions() {
  return await query("SELECT * FROM HelpSession");
}

/**
 * Get all help sessions for a user
 */
export async function getHelpSessionsByUserId(userId) {
  return await query("SELECT * FROM HelpSession WHERE userId = ?", [userId]);
}

/**
 * Get a help session by ID
 */
export async function getHelpSessionById(id) {
  const sessions = await query("SELECT * FROM HelpSession WHERE id = ?", [id]);
  return sessions[0] || null;
}

/**
 * Create a new help session
 */
export async function createHelpSession(sessionData) {
  const {
    id,
    userId,
    title,
    description,
    status = "open",
    priority = "medium",
    createdAt = new Date(),
    updatedAt = new Date(),
  } = sessionData;

  const result = await query(
    `INSERT INTO HelpSession (id, userId, title, description, status, priority, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, title, description, status, priority, createdAt, updatedAt]
  );

  console.log("Help session created:", result);
  return { id, ...sessionData };
}

/**
 * Update a help session
 */
export async function updateHelpSession(id, sessionData) {
  const fields = Object.keys(sessionData);
  const values = Object.values(sessionData);

  // Add updatedAt field
  fields.push("updatedAt");
  values.push(new Date());

  const setClause = fields.map((field) => `${field} = ?`).join(", ");

  const result = await query(
    `UPDATE HelpSession SET ${setClause} WHERE id = ?`,
    [...values, id]
  );

  console.log("Help session updated:", result);
  return { id, ...sessionData, updatedAt: new Date() };
}

/**
 * Delete a help session
 */
export async function deleteHelpSession(id) {
  const result = await query("DELETE FROM HelpSession WHERE id = ?", [id]);
  return result.affectedRows > 0;
}

/**
 * Get recently created help sessions
 */
export async function getRecentHelpSessions(limit = 10) {
  return await query(
    "SELECT * FROM HelpSession ORDER BY createdAt DESC LIMIT ?",
    [limit]
  );
}

/**
 * Count help sessions by status
 */
export async function countHelpSessionsByStatus(status) {
  const result = await query(
    "SELECT COUNT(*) as count FROM HelpSession WHERE status = ?",
    [status]
  );
  return result[0].count;
}
