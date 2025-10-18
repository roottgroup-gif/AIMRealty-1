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
  // Check if individual MySQL environment variables are provided (trim whitespace)
  const mysqlHost = process.env.MYSQL_HOST?.trim();
  const mysqlPort = process.env.MYSQL_PORT?.trim();
  const mysqlUser = process.env.MYSQL_USER?.trim();
  const mysqlPassword = process.env.MYSQL_PASSWORD?.trim();
  const mysqlDatabase = process.env.MYSQL_DATABASE?.trim();

  // Debug logging
  console.log("🔍 Database config from environment:");
  console.log(`   Host: "${mysqlHost}" (length: ${mysqlHost?.length})`);
  console.log(`   Port: "${mysqlPort}"`);
  console.log(`   User: "${mysqlUser}"`);
  console.log(`   Database: "${mysqlDatabase}"`);
  console.log(`   Password present: ${mysqlPassword ? 'yes' : 'no'}`);

  // If individual MySQL environment variables are provided, use them directly
  if (mysqlHost && mysqlUser && mysqlDatabase) {
    const port = parseInt(mysqlPort || "3306");
    const encodedPassword = mysqlPassword ? encodeURIComponent(mysqlPassword) : '';
    const auth = encodedPassword ? `${encodeURIComponent(mysqlUser)}:${encodedPassword}` : encodeURIComponent(mysqlUser);
    const connectionUrl = `mysql://${auth}@${mysqlHost}:${port}/${mysqlDatabase}`;
    
    const config: DatabaseConfig = {
      host: mysqlHost,
      port: port,
      user: mysqlUser,
      password: mysqlPassword || "",
      database: mysqlDatabase,
      connectionUrl,
    };
    
    return config;
  }
  
  // Fallback to MYSQL_URL if provided
  const mysqlUrl = process.env.MYSQL_URL;
  if (mysqlUrl) {
    // Parse mysql:// URL manually since new URL() doesn't support it
    const urlPattern = /^mysql:\/\/(?:([^:]+)(?::([^@]+))?@)?([^:\/]+)(?::(\d+))?\/(.+)$/;
    const match = mysqlUrl.match(urlPattern);
    
    if (!match) {
      throw new Error("Invalid MYSQL_URL format. Expected: mysql://user:password@host:port/database");
    }
    
    const [, user, password, host, port, database] = match;
    
    const config: DatabaseConfig = {
      host: host,
      port: parseInt(port || "3306"),
      user: user || "root",
      password: password ? decodeURIComponent(password) : "",
      database: database,
      connectionUrl: mysqlUrl,
    };
    
    return config;
  }
  
  // If no configuration provided, throw error
  throw new Error(
    "No MySQL database configured. " +
    "Set MYSQL_URL or individual MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE environment variables."
  );
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
