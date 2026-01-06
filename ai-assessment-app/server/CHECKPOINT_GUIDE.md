# Task 10: Backend Functionality Verification - Quick Guide

## Overview

This checkpoint verifies that all backend components are working correctly before proceeding to frontend integration. Since automated tests are marked as optional tasks and haven't been implemented yet, this checkpoint focuses on manual verification.

## What Has Been Implemented

Based on the task list, the following components have been completed:

✅ **Task 1:** Backend project structure
✅ **Task 2:** Database connection and configuration  
✅ **Task 3:** Database migration scripts
✅ **Task 4:** Data models and validation
✅ **Task 5:** API controllers (all 4 endpoints)
✅ **Task 6:** Security middleware (rate limiting, input validation)
✅ **Task 7:** Error handling and logging
✅ **Task 8:** API routes
✅ **Task 9:** Server entry point

## What Needs to Be Verified

### 1. Database Setup

**First, ensure your database is set up:**

```bash
# Option A: If using Railway PostgreSQL
# Get your DATABASE_URL from Railway dashboard

# Option B: If using local PostgreSQL
createdb ai_assessment_dev

# Run the migration script
psql your_database_url -f ai-assessment-app/server/migrations/init.sql
```

### 2. Environment Configuration

**Create environment file:**

```bash
cd ai-assessment-app/server
cat > .env << EOF
DATABASE_URL=postgresql://username:password@localhost:5432/ai_assessment_dev
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
EOF
```

Replace the DATABASE_URL with your actual database connection string.

### 3. Install Dependencies and Build

```bash
cd ai-assessment-app/server
npm install
npm run build
```

### 4. Start the Server

```bash
npm run dev
```

**Expected output:**
```
检查数据库连接...
数据库连接成功
服务器启动成功
本地访问地址: http://localhost:3000
API 端点: http://localhost:3000/api
健康检查: http://localhost:3000/health
```

If you see errors, check:
- DATABASE_URL is correct
- PostgreSQL is running
- Migration script has been executed
- Port 3000 is available

### 5. Run Manual Tests

**Option A: Automated Test Script (Recommended)**

In a new terminal (keep server running):

```bash
cd ai-assessment-app/server
./test-api.sh
```

This will test all endpoints and provide a summary.

**Option B: Manual Testing**

Follow the detailed steps in `VERIFICATION_CHECKLIST.md`

### 6. Verify Results

Check that:
- ✅ Health check returns 200 OK
- ✅ Assessment submission works (201 Created)
- ✅ Invalid data is rejected (400 Bad Request)
- ✅ Statistics endpoint returns data (200 OK)
- ✅ Recent assessments endpoint works (200 OK)
- ✅ Distribution endpoint works (200 OK)
- ✅ Rate limiting triggers after 10 requests (429 Too Many Requests)

## Common Issues and Solutions

### Issue: "Database connection failed"

**Solution:**
1. Check DATABASE_URL is set correctly
2. Verify PostgreSQL is running: `pg_isready`
3. Test connection manually: `psql $DATABASE_URL -c "SELECT 1"`
4. Check database exists: `psql -l | grep ai_assessment`

### Issue: "Table does not exist"

**Solution:**
Run the migration script:
```bash
psql $DATABASE_URL -f ai-assessment-app/server/migrations/init.sql
```

### Issue: "Port 3000 already in use"

**Solution:**
1. Find process using port: `lsof -i :3000`
2. Kill it: `kill -9 <PID>`
3. Or use different port: `PORT=3001 npm run dev`

### Issue: "Module not found" errors

**Solution:**
```bash
cd ai-assessment-app/server
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: Test script fails with "curl: command not found"

**Solution:**
Install curl or test manually using a tool like Postman or Insomnia.

## Quick Verification Commands

```bash
# 1. Check server is running
curl http://localhost:3000/health

# 2. Submit a test assessment
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{"cohort":"test","total":20,"title":"测试","d1":4,"d2":4,"d3":4,"d4":4,"d5":4,"answers":{}}'

# 3. Get statistics
curl http://localhost:3000/api/assessments/stats/test

# 4. Get recent assessments
curl http://localhost:3000/api/assessments/recent/test

# 5. Get distribution
curl http://localhost:3000/api/assessments/distribution/test
```

## Success Criteria

This checkpoint is complete when:

1. ✅ Server starts without errors
2. ✅ Database connection is healthy
3. ✅ All 4 API endpoints respond correctly
4. ✅ Input validation rejects invalid data
5. ✅ Rate limiting is functional
6. ✅ Error handling works properly
7. ✅ No critical issues found

## What's Next

After successful verification:

- **Task 11:** Refactor frontend API client to use new backend
- **Task 12:** Configure environment variables
- **Task 13:** Configure build and deployment
- **Task 14:** (Optional) Implement backward compatibility
- **Task 15:** Final validation and testing

## Files Created for This Checkpoint

1. `test-api.sh` - Automated testing script
2. `VERIFICATION_CHECKLIST.md` - Detailed verification steps
3. `CHECKPOINT_GUIDE.md` - This quick reference guide

## Need Help?

If you encounter issues:

1. Check server logs for error messages
2. Review `VERIFICATION_CHECKLIST.md` for detailed troubleshooting
3. Verify all previous tasks (1-9) are actually complete
4. Check that database schema matches design document
5. Ensure all environment variables are set correctly

## Notes

- Automated tests (unit tests and property-based tests) are marked as optional in the task list
- This checkpoint focuses on manual verification since those tests haven't been implemented
- The test script (`test-api.sh`) provides automated endpoint testing but not full test coverage
- For production deployment, implementing the optional test tasks is highly recommended
