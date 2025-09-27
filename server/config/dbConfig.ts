import 'dotenv/config';

interface DatabaseConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  connectionUrl: string;
}

// Default XAMPP MySQL configuration
const DEFAULT_XAMPP_CONFIG = {
  host: '127.0.0.1', // Use IP instead of localhost to force TCP connection
  port: 3306,
  user: 'root',
  password: '', // XAMPP default (no password)
  database: 'mapestate'
};

function createConnectionUrl(config: typeof DEFAULT_XAMPP_CONFIG): string {
  const { user, password, host, port, database } = config;
  const auth = password ? `${user}:${password}` : user;
  return `mysql://${auth}@${host}:${port}/${database}`;
}

function getDatabaseConfig(): DatabaseConfig {
  // Try to get MYSQL_URL from environment first
  let connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  
  // If no URL provided, use default XAMPP configuration
  if (!connectionUrl) {
    console.log('📝 No MYSQL_URL found, using default XAMPP configuration');
    console.log('🔧 Default: mysql://root:@127.0.0.1:3306/mapestate');
    console.log('💡 Tip: Create a .env file with MYSQL_URL to customize');
    
    connectionUrl = createConnectionUrl(DEFAULT_XAMPP_CONFIG);
  }
  
  // Parse the connection URL to get individual components
  const url = new URL(connectionUrl);
  
  const config: DatabaseConfig = {
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username || 'root',
    password: url.password || '',
    database: url.pathname.slice(1), // Remove leading slash
    connectionUrl
  };
  
  return config;
}

function validateDatabaseConfig(config: DatabaseConfig): void {
  if (!config.host) {
    throw new Error('Database host is required');
  }
  
  if (!config.database) {
    throw new Error('Database name is required');
  }
  
  if (!config.connectionUrl.startsWith('mysql://')) {
    throw new Error('Invalid MySQL connection URL format');
  }
}

export function getValidatedDatabaseConfig(): DatabaseConfig {
  const config = getDatabaseConfig();
  validateDatabaseConfig(config);
  
  console.log('🔗 Database configuration:');
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   User: ${config.user}`);
  console.log(`   Database: ${config.database}`);
  
  return config;
}

export { DatabaseConfig };