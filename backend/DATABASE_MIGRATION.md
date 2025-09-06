# Database Migration Guide

This guide explains how to migrate from SQLite (local) to PostgreSQL (remote) for production deployment on Render.

## Environment Variables

### For Local Development (SQLite)
```bash
NODE_ENV=development
DATABASE_URL=sqlite:./models/loan_management.db
```

### For Production (PostgreSQL on Render)
```bash
NODE_ENV=production
DATABASE_URL=postgres://username:password@hostname:port/database
```

## Migration Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up PostgreSQL Database on Render
1. Go to your Render dashboard
2. Create a new PostgreSQL database
3. Copy the database URL provided by Render
4. Set the `DATABASE_URL` environment variable in your Render service

### 3. Run Migration Script
```bash
# Set the DATABASE_URL environment variable
export DATABASE_URL="postgres://username:password@hostname:port/database"

# Run the migration script
node scripts/migrateToPostgres.js
```

### 4. Deploy to Render
1. Push your code to your Git repository
2. Deploy your backend service on Render
3. Set the `DATABASE_URL` environment variable in Render dashboard
4. Set `NODE_ENV=production`

## Database Configuration

The application automatically detects the database type based on the `DATABASE_URL`:

- If `DATABASE_URL` starts with `postgres://` → Uses PostgreSQL
- Otherwise → Uses SQLite (for local development)

## Features

- **Automatic Database Detection**: The app automatically uses the correct database driver
- **SSL Support**: PostgreSQL connections use SSL in production
- **Connection Pooling**: PostgreSQL connections are pooled for better performance
- **Backward Compatibility**: Local development still works with SQLite

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if the PostgreSQL database is running and accessible
2. **SSL Errors**: Ensure SSL is properly configured for production
3. **Migration Errors**: Check if all required tables exist in the target database

### Testing Connection

```bash
# Test PostgreSQL connection
node -e "
const { sequelize } = require('./models');
sequelize.authenticate()
  .then(() => console.log('Connection successful'))
  .catch(err => console.error('Connection failed:', err));
"
```
