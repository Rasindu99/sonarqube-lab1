const mysql = require("mysql2/promise");

// Node 18+ has global fetch. Only use node-fetch for older Node versions.
const fetchFn = globalThis.fetch ? globalThis.fetch : require("node-fetch");

async function main() {
  // Database configuration - use environment variables for security
  const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "password",
    database: process.env.DB_NAME || "mydatabase",
    port: Number(process.env.DB_PORT) || 3306,
  };

  // Third-party API configuration
  const apiUrl = process.env.API_URL || "https://api.thirdparty.com/users";
  const apiKey = process.env.API_KEY; // If required

  try {
    // Connect to the database
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected to the database.");

    // Query to retrieve user account information
    const [rows] = await connection.execute(
      "SELECT id, name, email, created_at FROM users"
    );
    console.log(`Retrieved ${rows.length} user records.`);

    // Close the database connection
    await connection.end();

    // Prepare data for API
    const userData = rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    }));

    // Build headers (don't include Authorization at all if no key)
    const headers = { "Content-Type": "application/json" };
    if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

    // Send data to third-party API
    const response = await fetchFn(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ users: userData }),
    });

    if (response.ok) {
      console.log("Data successfully sent to third-party API.");
    } else {
      console.error(
        `Failed to send data. Status: ${response.status}, Message: ${response.statusText}`
      );
    }
  } catch (error) {
    console.error("An error occurred:", error.message);
  }
}

// Run the main function
main();
