# Database Setup Guide

## Default Configuration

Your project is now configured to use **MySQL by default**. It will automatically:

1. **Try MySQL first** if `MYSQL_URL` is provided
2. **Fall back to SQLite** for local development (no setup required)
3. Support PostgreSQL if needed

## Quick Start with MySQL

### 1. Set up MySQL Database

```bash
# Create database
CREATE DATABASE mapestate;
USE mapestate;

# Import the schema
source database_mysql_schema.sql;
```

### 2. Configure Environment

Create `.env` file:
```bash
MYSQL_URL=mysql://username:password@localhost:3306/mapestate
```

### 3. Start Application

```bash
npm run dev
```

## Database Options

### Option 1: MySQL (Recommended)
- Set `MYSQL_URL` in your environment
- Import `database_mysql_schema.sql`
- Full feature support

### Option 2: SQLite (Default Fallback)
- No configuration needed
- Automatic table creation
- Perfect for development

### Option 3: PostgreSQL (Replit Default)
- Works with existing Replit database
- No additional setup required

## Files Included

- `database_mysql_schema.sql` - Complete MySQL database schema
- `.env.example` - Environment configuration template
- SQLite fallback - Automatic local development database

## API Endpoints

All database operations use API endpoints (no JSON files):

- `GET /api/properties` - Get all properties
- `POST /api/properties` - Create property
- `GET /api/users` - Get users
- `POST /api/inquiries` - Submit inquiry
- And many more...

Your application now prioritizes MySQL while maintaining compatibility with other databases! 🎉