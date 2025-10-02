import mysql from 'mysql2/promise';
import { getValidatedDatabaseConfig } from './config/dbConfig';
import fs from 'fs';
import path from 'path';

async function importSqlFile(sqlFilePath: string) {
  let connection: mysql.Connection | null = null;
  
  try {
    // Get database configuration
    const config = getValidatedDatabaseConfig();
    
    console.log("🔗 Connecting to MySQL VPS...");
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    
    // Create connection
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true, // Allow multiple SQL statements
    });
    
    console.log("✅ Connected to MySQL VPS");
    
    // Check if SQL file exists
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error(`SQL file not found: ${sqlFilePath}`);
    }
    
    // Read SQL file
    console.log(`📂 Reading SQL file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
    
    if (!sqlContent.trim()) {
      throw new Error("SQL file is empty");
    }
    
    // Split SQL content by semicolons to execute statements one by one
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      try {
        const statement = statements[i];
        if (statement) {
          await connection.query(statement);
          successCount++;
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        }
      } catch (stmtError: any) {
        errorCount++;
        console.error(`❌ Error in statement ${i + 1}:`, stmtError.message);
        console.error(`   Statement: ${statements[i].substring(0, 100)}...`);
      }
    }
    
    console.log("\n📈 Import Summary:");
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📊 Total: ${statements.length}`);
    
    if (errorCount === 0) {
      console.log("\n🎉 SQL import completed successfully!");
    } else {
      console.log("\n⚠️ SQL import completed with errors");
    }
    
  } catch (error: any) {
    console.error("\n❌ SQL Import Failed:");
    console.error(`   Error: ${error.message}`);
    throw error;
  } finally {
    // Close connection
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("\n📖 Usage:");
  console.log("   tsx server/import-sql.ts <path-to-sql-file>");
  console.log("\n📝 Example:");
  console.log("   tsx server/import-sql.ts ./backup.sql");
  console.log("   tsx server/import-sql.ts ./database-export.sql");
  process.exit(1);
}

const sqlFilePath = path.resolve(args[0]);

importSqlFile(sqlFilePath)
  .then(() => {
    console.log("\n✅ Import process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Import process failed:", error);
    process.exit(1);
  });
