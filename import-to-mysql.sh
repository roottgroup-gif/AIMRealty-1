#!/bin/bash

# MySQL Import Script for MapEstate Database
# This script imports the database schema to your MySQL server

# Database connection details
DB_HOST="72.60.134.44"
DB_PORT="3306"
DB_USER="mapestate"
DB_PASS="mapestate123"
DB_NAME="mapestate"

echo "========================================"
echo "MySQL Database Schema Import"
echo "========================================"
echo ""
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "User: $DB_USER"
echo ""

# Check if mysql client is installed
if ! command -v mysql &> /dev/null; then
    echo "❌ Error: MySQL client is not installed"
    echo "Install it with: sudo apt install mysql-client"
    exit 1
fi

# Check if SQL file exists
if [ ! -f "setup-mysql-tables.sql" ]; then
    echo "❌ Error: setup-mysql-tables.sql file not found"
    echo "Make sure you run this script from the project root directory"
    exit 1
fi

echo "📂 Found setup-mysql-tables.sql"
echo ""

# Test connection first
echo "🔍 Testing database connection..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SELECT 1;" &> /dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database connection successful"
    echo ""
else
    echo "❌ Failed to connect to database"
    echo "Please check your credentials and try again"
    exit 1
fi

# Import the schema
echo "📥 Importing database schema..."
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < setup-mysql-tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database schema imported successfully!"
    echo ""
    
    # Show created tables
    echo "📋 Tables in database:"
    mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" -e "SHOW TABLES;"
    
    echo ""
    echo "========================================"
    echo "✨ Import Complete!"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "1. Add MYSQL_URL secret to Replit:"
    echo "   mysql://mapestate:mapestate123@72.60.134.44:3306/mapestate"
    echo ""
    echo "2. Restart your Replit application"
    echo ""
else
    echo ""
    echo "❌ Failed to import database schema"
    exit 1
fi
