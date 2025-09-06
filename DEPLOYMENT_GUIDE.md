# Loan Management Application - Deployment Guide

## Overview
This guide explains how to deploy the Loan Management Application to Render with a remote PostgreSQL database.

## Prerequisites
- Git repository with your code
- Render account
- PostgreSQL database (can be created on Render)

## Backend Deployment on Render

### 1. Create PostgreSQL Database on Render
1. Go to your Render dashboard
2. Click "New +" → "PostgreSQL"
3. Choose a name (e.g., "loan-management-db")
4. Select the appropriate plan
5. Click "Create Database"
6. Wait for the database to be created
7. Copy the **External Database URL** (you'll need this)

### 2. Deploy Backend Service
1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your Git repository
4. Configure the service:
   - **Name**: `loan-management-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `backend`

### 3. Set Environment Variables
In your Render backend service, add these environment variables:

```bash
NODE_ENV=production
DATABASE_URL=postgres://username:password@hostname:port/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
```

**Important**: Replace the `DATABASE_URL` with the actual URL from your PostgreSQL database.

### 4. Deploy
1. Click "Create Web Service"
2. Wait for the deployment to complete
3. Note the service URL (e.g., `https://loan-management-application.onrender.com`)

## Frontend Configuration

### 1. Update API Endpoint
The frontend is already configured to use the remote backend URL:
- Default API URL: `https://loan-management-application.onrender.com/api`
- This can be overridden with `VITE_API_URL` environment variable

### 2. Build and Deploy Frontend
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy to your preferred hosting service (Vercel, Netlify, etc.)

## Data Migration (Optional)

If you have existing data in SQLite that you want to migrate:

### 1. Set up Local Environment
```bash
# Install dependencies
npm install

# Set the DATABASE_URL to your PostgreSQL database
export DATABASE_URL="postgres://username:password@hostname:port/database"

# Run migration
npm run migrate-to-postgres
```

### 2. Verify Migration
```bash
# Test database connection
node scripts/testDatabaseConnection.js
```

## Environment Variables Reference

### Backend (.env or Render Environment Variables)
```bash
NODE_ENV=production
DATABASE_URL=postgres://username:password@hostname:port/database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h
LOG_LEVEL=info
```

### Frontend (.env or Build Environment)
```bash
VITE_API_URL=https://loan-management-application.onrender.com/api
```

## Database Configuration

The application automatically detects the database type:
- **PostgreSQL**: When `DATABASE_URL` starts with `postgres://`
- **SQLite**: For local development (default)

## Features After Deployment

✅ **Remote Database**: PostgreSQL hosted on Render
✅ **Automatic SSL**: Secure connections in production
✅ **Connection Pooling**: Optimized database connections
✅ **Environment Detection**: Automatic configuration based on environment
✅ **Data Migration**: Script to migrate from SQLite to PostgreSQL

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if `DATABASE_URL` is correctly set
   - Verify the PostgreSQL database is running
   - Check SSL configuration

2. **CORS Errors**
   - Ensure CORS is properly configured in the backend
   - Check if the frontend URL is allowed

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings

### Testing Deployment

1. **Test Backend API**:
   ```bash
   curl https://loan-management-application.onrender.com/api/health
   ```

2. **Test Database Connection**:
   ```bash
   node scripts/testDatabaseConnection.js
   ```

3. **Test Frontend**:
   - Open the deployed frontend URL
   - Try logging in and creating a loan

## Support

If you encounter issues:
1. Check the Render service logs
2. Verify environment variables
3. Test database connectivity
4. Check CORS configuration
