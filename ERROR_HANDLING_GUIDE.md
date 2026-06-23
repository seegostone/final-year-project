# Backend Error Handling & Debugging Guide

## Overview
This guide explains the error handling architecture and how to debug 500 errors in the EstatesComplaint backend.

## Error Handling Architecture

### 1. Global Error Handler Middleware
**File:** `backend/server.js` (lines 158-257)

The global error handler catches ALL errors thrown by route handlers or async operations. It must have **exactly 4 parameters** `(err, req, res, next)` for Express to recognize it as an error handler.

**Key Features:**
- ✅ Logs full error details with context (URL, method, IP, timestamp)
- ✅ Handles specific error types (MongoDB, JWT, Multer, etc.)
- ✅ Returns appropriate HTTP status codes
- ✅ Shows stack traces in development only
- ✅ Catches unhandled promise rejections and exceptions

### 2. Error Types Handled

| Error Type | HTTP Status | Cause |
|-----------|------------|-------|
| MulterError (LIMIT_FILE_SIZE) | 400 | File upload exceeds 5MB |
| MongoServerError (code 11000) | 400 | Duplicate key (email, etc.) |
| MongoServerError (code 121) | 400 | Document validation failed |
| BSONError / CastError | 400 | Invalid MongoDB ObjectId |
| JsonWebTokenError | 401 | Invalid JWT token |
| TokenExpiredError | 401 | JWT token expired |
| ValidationError | 400 | Input validation failed |
| CORS Error | 403 | Cross-origin request blocked |
| Database Connection Error | 503 | MongoDB unavailable |
| Timeout | 504 | Request took too long |
| Generic Error | 500 | Unhandled server error |

### 3. Async Error Handling
**Package:** `express-async-errors`

This package automatically catches errors thrown in async route handlers and passes them to the error handler middleware.

```javascript
// With express-async-errors, this error is caught automatically:
app.get('/api/endpoint', async (req, res) => {
  const data = await someAsyncOperation(); // If this throws, it goes to error handler
  res.json(data);
});

// WITHOUT express-async-errors, you'd need:
app.get('/api/endpoint', async (req, res, next) => {
  try {
    const data = await someAsyncOperation();
    res.json(data);
  } catch (error) {
    next(error); // Must explicitly pass to error handler
  }
});
```

### 4. Unhandled Rejection & Exception Handlers

**File:** `backend/server.js` (lines 285-311)

Catches errors that escape all try-catch blocks and error handlers:

```javascript
process.on('unhandledRejection', (reason, promise) => {
  // Logs rejected promises not caught by .catch() or try-catch
  logger.error('🔴 [UNHANDLED REJECTION]', { reason, promise });
});

process.on('uncaughtException', (error) => {
  // Logs thrown errors not caught by try-catch
  logger.error('🔴 [UNCAUGHT EXCEPTION]', { message: error.message, stack: error.stack });
  process.exit(1); // Process is unstable - exit immediately
});
```

## Debugging 500 Errors

### Step 1: Check Server Logs

**Development Mode:**
```bash
cd backend
npm run dev
# Errors appear in terminal with full stack traces
# Look for lines with 🔴 [ERROR], 🔴 [UNHANDLED REJECTION], etc.
```

**Production Mode:**
```bash
# Check log files
tail -f logs/error.log      # Errors only
tail -f logs/combined.log   # All logs
```

### Step 2: Use Network Tab in Browser DevTools

1. Open Chrome DevTools (`F12`)
2. Go to **Network** tab
3. Trigger the request that causes 500
4. Click on the failed request
5. Go to **Response** tab
6. You should see JSON with error details:
```json
{
  "success": false,
  "message": "Internal Server Error",
  "details": {
    "stack": "Error: Cannot read property 'email' of null\n    at complaintOperations.create (/path/to/file.js:45:12)",
    "code": "PROP_ACCESS_ERROR"
  }
}
```

### Step 3: Common 500 Error Causes

#### A. Database Connection Failed
**Symptoms:**
- Message: "Database connection not available"
- MongoDB isn't running

**Fix:**
```bash
# Start MongoDB
mongod
# OR if using MongoDB Atlas, check connection string in .env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
```

#### B. Null/Undefined Reference
**Symptoms:**
- Message: "Cannot read property 'X' of null/undefined"
- Stack trace points to accessing a property on null

**Fix:** Add null checks before accessing properties
```javascript
// ❌ Bad
const email = user.email; // Crashes if user is null

// ✅ Good
const email = user?.email || 'default@example.com'; // Safe
```

#### C. Missing Environment Variables
**Symptoms:**
- JWT validation fails
- Database connection fails
- Random undefined values in responses

**Fix:** Check your `.env` file:
```bash
# backend/.env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finalyearproject
JWT_SECRET=your_secret_key_here
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

#### D. Async/Await Without Error Handling
**Symptoms:**
- Request hangs or times out
- No error appears in logs

**Fix:** Ensure all async operations are awaited and have try-catch:
```javascript
// ❌ Bad - Error not caught
app.post('/endpoint', async (req, res) => {
  const result = await dbOperation(); // If this throws, error is unhandled
  res.json(result);
});

// ✅ Good - With express-async-errors (automatic)
app.post('/endpoint', async (req, res) => {
  const result = await dbOperation(); // Errors caught automatically
  res.json(result);
});

// ✅ Good - Manual try-catch
app.post('/endpoint', async (req, res, next) => {
  try {
    const result = await dbOperation();
    res.json(result);
  } catch (error) {
    next(error); // Pass to error handler
  }
});
```

#### E. Invalid ObjectId
**Symptoms:**
- Message: "Invalid ID format"
- Trying to query with a non-ObjectId string

**Fix:** Validate ObjectId before use
```javascript
import { ObjectId } from 'mongodb';

// ✅ Good
if (!ObjectId.isValid(id)) {
  return res.status(400).json({ message: 'Invalid ID' });
}
const item = await db.collection('items').findOne({ _id: new ObjectId(id) });
```

### Step 4: Add Debug Logging

Insert `console.log()` or `logger.debug()` strategically:

```javascript
export const createComplaint = async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    console.log('📍 Step 1: Received request body:', req.body);
    
    const userId = req.user._id;
    console.log('📍 Step 2: User ID:', userId);
    
    const result = await complaintOperations.create(db, complaintData);
    console.log('📍 Step 3: Complaint created:', result);
    
    res.json({ success: true, complaint: result });
  } catch (error) {
    console.error('❌ Error in createComplaint:', error);
    next(error); // Pass to error handler
  }
};
```

## Best Practices

### 1. Always Use try-catch in Controllers
```javascript
export const endpoint = async (req, res, next) => {
  try {
    // Your logic here
    res.json({ success: true });
  } catch (error) {
    next(error); // Pass to global error handler
  }
};
```

### 2. Validate Input Early
```javascript
import { validationResult } from 'express-validator';

if (!validationResult(req).isEmpty()) {
  return res.status(400).json({
    success: false,
    errors: validationResult(req).array(),
  });
}
```

### 3. Check for Null/Undefined
```javascript
const user = await userOperations.findById(db, userId);
if (!user) {
  return res.status(404).json({ success: false, message: 'User not found' });
}
// Now safe to use user
```

### 4. Return Consistent Error Responses
```javascript
// All errors should follow this format:
{
  "success": false,
  "message": "Error description",
  "details": {} // Only in development
}
```

### 5. Use Proper HTTP Status Codes
- 400: Bad Request (validation failed, client error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (authenticated but not allowed)
- 404: Not Found (resource doesn't exist)
- 500: Internal Server Error (unhandled error)
- 503: Service Unavailable (database/service down)

## Testing Error Handling

### Test 1: Trigger a 500 Error
```bash
# Intentionally send bad data
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# Check the response and logs
```

### Test 2: Check Logs
```bash
# Development
npm run dev
# Look for 🔴 emoji errors in terminal

# Production
tail -f logs/error.log
```

### Test 3: Test Database Connection
```bash
# In a separate terminal
mongod
# If MongoDB doesn't start, fix connection string in .env
```

## Summary

| Component | What It Does | Location |
|-----------|------------|----------|
| express-async-errors | Auto-catches async errors | `server.js` (import) |
| Global Error Handler | Main error processor | `server.js` lines 158-257 |
| Unhandled Rejection Handler | Catches rejected promises | `server.js` lines 285-298 |
| Uncaught Exception Handler | Catches thrown errors | `server.js` lines 300-311 |
| Winston Logger | Logs errors with context | `server.js` lines 87-119 |

**For any 500 error:**
1. ✅ Check server logs for the actual error message
2. ✅ Look for stack trace to find the problematic code line
3. ✅ Check .env variables are set correctly
4. ✅ Verify MongoDB is running and connection string is valid
5. ✅ Add debug logging to narrow down the issue
