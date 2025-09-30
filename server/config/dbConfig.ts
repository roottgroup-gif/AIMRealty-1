// Remove dotenv import to let Replit handle environment variables natively

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionUrl: string;
}

// VPS MySQL configuration - MUST be set via environment variables
const DEFAULT_VPS_CONFIG = {
  host: process.env.MYSQL_HOST || "",
  port: parseInt(process.env.MYSQL_PORT || "3306"),
  user: process.env.MYSQL_USER || "",
  password: process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "",
};

function createConnectionUrl(config: typeof DEFAULT_VPS_CONFIG): string {
  const { user, password, host, port, database } = config;
  const auth = password ? `${user}:${password}` : user;
  return `mysql://${auth}@${host}:${port}/${database}`;
}

function getDatabaseConfig(): DatabaseConfig {
  // Try to get MYSQL_URL from environment first
  let connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  // Check if individual MySQL environment variables are provided (trim whitespace)
  const mysqlHost = process.env.MYSQL_HOST?.trim();
  const mysqlPort = process.env.MYSQL_PORT?.trim();
  const mysqlUser = process.env.MYSQL_USER?.trim();
  const mysqlPassword = process.env.MYSQL_PASSWORD?.trim();
  const mysqlDatabase = process.env.MYSQL_DATABASE?.trim();

  // Debug logging for environment variables
  console.log("🔍 Environment Variables Debug:");
  console.log(`   MYSQL_URL: ${connectionUrl ? "[SET]" : "[NOT SET]"}`);
  console.log(`   MYSQL_HOST: ${mysqlHost ? "[SET]" : "[NOT SET]"}`);
  console.log(`   MYSQL_USER: ${mysqlUser ? "[SET]" : "[NOT SET]"}`);
  console.log(`   MYSQL_DATABASE: ${mysqlDatabase ? "[SET]" : "[NOT SET]"}`);
  console.log(`   MYSQL_PORT: ${mysqlPort || "[NOT SET]"}`);
  console.log(`   MYSQL_PASSWORD: ${mysqlPassword ? "[SET]" : "[NOT SET]"}`);

  // If individual MySQL environment variables are provided, use them
  if (mysqlHost && mysqlUser && mysqlDatabase) {
    console.log("🔗 Using MySQL VPS configuration from environment variables");
    const port = parseInt(mysqlPort || "3306");
    const auth = mysqlPassword ? `${mysqlUser}:${mysqlPassword}` : mysqlUser;
    connectionUrl = `mysql://${auth}@${mysqlHost}:${port}/${mysqlDatabase}`;
    console.log(
      `🔧 MySQL VPS: mysql://${mysqlUser}:***@${mysqlHost}:${port}/${mysqlDatabase}`,
    );
  }
  // If no URL provided and no individual vars, use default configuration
  else if (!connectionUrl) {
    console.log("📝 No MYSQL_URL found, using default configuration from environment variables");
    console.log("💡 Tip: Set environment variables MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE");

    connectionUrl = createConnectionUrl(DEFAULT_VPS_CONFIG);
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

  console.log("🔗 Database configuration:");
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);

  return config;
}

export { DatabaseConfig };
