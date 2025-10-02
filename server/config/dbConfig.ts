// Remove dotenv import to let Replit handle environment variables natively

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionUrl: string;
}

function getDatabaseConfig(): DatabaseConfig {
  // Only look for MYSQL_URL (not DATABASE_URL which is for PostgreSQL)
  let connectionUrl = process.env.MYSQL_URL;

  // Check if individual MySQL environment variables are provided (trim whitespace)
  const mysqlHost = process.env.MYSQL_HOST?.trim();
  const mysqlPort = process.env.MYSQL_PORT?.trim();
  const mysqlUser = process.env.MYSQL_USER?.trim();
  const mysqlPassword = process.env.MYSQL_PASSWORD?.trim();
  const mysqlDatabase = process.env.MYSQL_DATABASE?.trim();

  // If individual MySQL environment variables are provided, use them
  if (mysqlHost && mysqlUser && mysqlDatabase) {
    const port = parseInt(mysqlPort || "3306");
    const encodedPassword = mysqlPassword ? encodeURIComponent(mysqlPassword) : '';
    const auth = encodedPassword ? `${encodeURIComponent(mysqlUser)}:${encodedPassword}` : encodeURIComponent(mysqlUser);
    connectionUrl = `mysql://${auth}@${mysqlHost}:${port}/${mysqlDatabase}`;
  }
  // If no URL provided and no individual vars, throw error
  else if (!connectionUrl) {
    throw new Error(
      "No MySQL database configured. " +
      "Set MYSQL_URL or individual MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables."
    );
  }

  // Parse the connection URL to get individual components
  const url = new URL(connectionUrl);

  const config: DatabaseConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || "root",
    password: url.password || "",
    database: url.pathname.slice(1), // Remove leading slash
    connectionUrl,
  };

  return config;
}

function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.host) {
    throw new Error("Database host is required");
  }

  if (!config.database) {
    throw new Error("Database name is required");
  }

  if (!config.connectionUrl.startsWith("mysql://")) {
    throw new Error("Invalid MySQL connection URL format");
  }
}

export function getValidatedDatabaseConfig(): DatabaseConfig {
  const config = getDatabaseConfig();
  validateDatabaseConfig(config);
  return config;
}

export { DatabaseConfig };
