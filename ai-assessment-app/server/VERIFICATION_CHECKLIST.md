# Backend Verification Checklist

This document provides a comprehensive checklist for verifying the backend functionality before proceeding to frontend integration.

## Prerequisites

Before running verification tests, ensure:

- [ ] PostgreSQL database is running and accessible
- [ ] `DATABASE_URL` environment variable is set
- [ ] Server dependencies are installed (`npm install` in server directory)
- [ ] Server is built (`npm run build` in server directory)

## Environment Variables Required

Create a `.env` file in the `ai-assessment-app/server` directory with:

```env
DATABASE_URL=postgresql://username:password@host:port/database
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
```

## Verification Steps

### 1. Database Connection Verification

**Manual Check:**
```bash
# From server directory
npm run dev
```

**Expected Output:**
- ✓ "检查数据库连接..." message
- ✓ "数据库连接成功" message
- ✓ "服务器启动成功" message
- ✓ Server listening on specified PORT

**Verification:**
- [ ] Server starts without errors
- [ ] Database connection successful
- [ ] No connection timeout errors

### 2. Database Schema Verification

**Manual Check:**
```bash
# Connect to your database and verify tables exist
psql $DATABASE_URL -c "\dt"
```

**Expected:**
- [ ] `ai_assessments` table exists
- [ ] `ai_assessment_public_stats` view exists

**Verify Table Structure:**
```sql
\d ai_assessments
```

**Expected Columns:**
- [ ] id (UUID, PRIMARY KEY)
- [ ] name (TEXT)
- [ ] cohort (TEXT)
- [ ] total (INTEGER with CHECK constraint 0-30)
- [ ] title (TEXT)
- [ ] d1, d2, d3, d4, d5 (INTEGER with CHECK constraint 0-6)
- [ ] answers (JSONB)
- [ ] created_at (TIMESTAMPTZ)
- [ ] user_agent (TEXT)

**Verify Indexes:**
```sql
\di ai_assessments*
```

**Expected:**
- [ ] Index on `cohort`
- [ ] Index on `created_at DESC`

### 3. API Endpoint Testing

**Automated Testing:**
```bash
# Make sure server is running first
cd ai-assessment-app/server
./test-api.sh
```

**Manual Testing (Alternative):**

#### Test 1: Health Check
```bash
curl http://localhost:3000/health
```
**Expected:** 
- [ ] HTTP 200
- [ ] JSON response with `status: "healthy"` and `database: "connected"`

#### Test 2: Submit Valid Assessment
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试用户",
    "cohort": "default",
    "total": 25,
    "title": "AI 应用先锋",
    "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {"q1": 5, "q2": 5, "q3": 5, "q4": 5, "q5": 5}
  }'
```
**Expected:**
- [ ] HTTP 201
- [ ] JSON response with `success: true` and `data.id` (UUID)

#### Test 3: Submit Invalid Assessment (Validation)
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试",
    "cohort": "default",
    "total": 35,
    "title": "测试",
    "d1": 7, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'
```
**Expected:**
- [ ] HTTP 400
- [ ] JSON response with `success: false` and validation error details

#### Test 4: Get Cohort Statistics
```bash
curl http://localhost:3000/api/assessments/stats/default
```
**Expected:**
- [ ] HTTP 200
- [ ] JSON response with statistics (total_count, avg_total, avg_d1-d5, min_total, max_total)

#### Test 5: Get Recent Assessments
```bash
curl http://localhost:3000/api/assessments/recent/default?limit=10
```
**Expected:**
- [ ] HTTP 200
- [ ] JSON array with recent assessments
- [ ] Each assessment has: id, name, total, title, d1-d5, created_at
- [ ] No sensitive fields (answers, user_agent) exposed

#### Test 6: Get Assessment Distribution
```bash
curl http://localhost:3000/api/assessments/distribution/default
```
**Expected:**
- [ ] HTTP 200
- [ ] JSON array with distribution data
- [ ] Each item has: total, d1-d5, created_at

### 4. Security Verification

#### Rate Limiting
**Test:**
Send 12 rapid POST requests to `/api/assessments`

**Expected:**
- [ ] First 10 requests succeed (HTTP 201)
- [ ] 11th and 12th requests fail with HTTP 429 (Too Many Requests)

#### Input Validation
**Test various invalid inputs:**

1. Missing required fields:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{"name": "测试"}'
```
**Expected:** [ ] HTTP 400 with validation errors

2. Out of range scores:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": -5,
    "title": "测试",
    "d1": 10, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'
```
**Expected:** [ ] HTTP 400 with validation errors

3. SQL Injection attempt:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'; DROP TABLE ai_assessments; --",
    "cohort": "default",
    "total": 20,
    "title": "测试",
    "d1": 4, "d2": 4, "d3": 4, "d4": 4, "d5": 4,
    "answers": {}
  }'
```
**Expected:** 
- [ ] Request handled safely (no SQL injection)
- [ ] Either HTTP 201 (input sanitized) or HTTP 400 (validation error)
- [ ] Database table still exists

#### CORS Headers
```bash
curl -I http://localhost:3000/api/assessments/stats/default
```
**Expected:**
- [ ] `Access-Control-Allow-Origin` header present
- [ ] `Access-Control-Allow-Methods` header present

#### Security Headers (Helmet)
```bash
curl -I http://localhost:3000/health
```
**Expected:**
- [ ] `X-Content-Type-Options: nosniff` header present
- [ ] `X-Frame-Options` header present
- [ ] Other security headers from Helmet

### 5. Error Handling Verification

#### Database Connection Error
**Test:** Stop database and restart server

**Expected:**
- [ ] Server logs "数据库连接失败" error
- [ ] Server exits with code 1
- [ ] No server crash or hanging

#### Invalid Route
```bash
curl http://localhost:3000/api/nonexistent
```
**Expected:**
- [ ] HTTP 404
- [ ] JSON response with error message

#### Server Error Simulation
**Test:** Query with malformed cohort that might cause issues

**Expected:**
- [ ] HTTP 500 (if error occurs)
- [ ] Error logged to console
- [ ] No sensitive information in response (production mode)

### 6. Logging Verification

**Check server logs for:**
- [ ] Request logging (method, path, status, duration, IP)
- [ ] Error logging (with stack traces in development)
- [ ] Database connection events
- [ ] Startup messages

### 7. Data Integrity Verification

**After running tests, verify in database:**

```sql
-- Check test data was inserted
SELECT COUNT(*) FROM ai_assessments;

-- Verify constraints are enforced
SELECT * FROM ai_assessments WHERE total < 0 OR total > 30;
-- Should return 0 rows

SELECT * FROM ai_assessments WHERE d1 < 0 OR d1 > 6;
-- Should return 0 rows

-- Verify view works
SELECT * FROM ai_assessment_public_stats;
-- Should return aggregated statistics
```

**Expected:**
- [ ] Test assessments are in database
- [ ] No constraint violations
- [ ] Statistics view returns correct aggregations

### 8. Performance Check

**Basic performance verification:**

```bash
# Send 100 requests and measure time
time for i in {1..100}; do
  curl -s -X POST http://localhost:3000/api/assessments \
    -H "Content-Type: application/json" \
    -d '{
      "cohort": "perf-test",
      "total": 20,
      "title": "测试",
      "d1": 4, "d2": 4, "d3": 4, "d4": 4, "d5": 4,
      "answers": {}
    }' > /dev/null
done
```

**Expected:**
- [ ] All requests complete successfully
- [ ] Average response time < 200ms
- [ ] No memory leaks or connection pool exhaustion

## Summary Checklist

Before proceeding to frontend integration:

- [ ] All database tables and views created
- [ ] Database connection working
- [ ] All 4 API endpoints responding correctly
- [ ] Input validation working
- [ ] Rate limiting configured
- [ ] Security headers present
- [ ] Error handling working
- [ ] Logging functional
- [ ] No SQL injection vulnerabilities
- [ ] Data integrity maintained
- [ ] Performance acceptable

## Known Issues / Notes

Document any issues found during verification:

```
[Add notes here]
```

## Next Steps

Once all checks pass:

1. Proceed to Task 11: Frontend API Client Refactoring
2. Update frontend to use new backend endpoints
3. Test end-to-end functionality
4. Prepare for Railway deployment

## Troubleshooting

### Server won't start
- Check DATABASE_URL is set correctly
- Verify PostgreSQL is running
- Check port 3000 is not already in use
- Review server logs for specific errors

### Database connection fails
- Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
- Check database credentials
- Ensure database exists
- Check network connectivity to database

### Tests fail
- Ensure server is running before running tests
- Check server logs for errors
- Verify database has correct schema
- Try running tests individually to isolate issues

### Rate limiting not working
- Rate limiting is per-IP address
- May need to wait 60 seconds between test runs
- Check if requests are coming from same IP

## Contact

If you encounter issues during verification, document them and consult with the team.
