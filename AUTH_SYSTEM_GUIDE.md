# Phase 8-2: Authentication System (Wave 2 - Blocking)

## Overview

The authentication system implements JWT-based token management for the ElSpa Manager application. This system protects the Payroll API and prepares the foundation for Wave 3 features.

**Status:** Phase 8-2 (Complete)  
**Blocking:** Wave 3 (4 parallel tasks)  
**Deadline:** 2026-05-24

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
├─────────────────────────────────────────────────────────┤
│  /auth/login (LoginPage)                                │
│  ↓                                                       │
│  AuthStore (Zustand) ← localStorage                      │
│  ↓                                                       │
│  authenticatedFetch() → all API calls                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ↓ (with Authorization header)
┌─────────────────────────────────────────────────────────┐
│                  Backend (FastAPI)                       │
├─────────────────────────────────────────────────────────┤
│  /api/auth/* (auth router)                              │
│  ├─ POST /login                                          │
│  ├─ POST /refresh                                        │
│  ├─ POST /verify                                         │
│  ├─ POST /logout                                         │
│  └─ POST /me                                             │
│                                                          │
│  JWT Module (app/auth/jwt.py)                           │
│  ├─ create_access_token()                               │
│  ├─ create_refresh_token()                              │
│  ├─ verify_token()                                      │
│  └─ decode_token()                                      │
│                                                          │
│  Dependencies (app/auth/dependencies.py)                │
│  ├─ get_current_user() → requires Bearer token          │
│  ├─ require_admin() → requires admin role               │
│  └─ get_optional_user() → optional auth                 │
│                                                          │
│  Protected APIs (e.g., /api/payroll/*)                  │
│  ├─ GET endpoints: @Depends(get_current_user)           │
│  └─ POST/PUT/DELETE: @Depends(require_admin)            │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Authentication Endpoints

All endpoints are prefixed with `/api/auth`

#### 1. Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@elspa.com",
  "password": "admin123"
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": 1,
    "email": "admin@elspa.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

**Test Accounts:**
- Admin: `admin@elspa.com` / `admin123`
- User: `user@elspa.com` / `user123`

#### 2. Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200 OK):
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### 3. Verify Token

```http
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200 OK):
{
  "valid": true,
  "user": {
    "user_id": 1,
    "email": "admin@elspa.com",
    "name": "Admin User",
    "role": "admin"
  }
}
```

#### 4. Logout

```http
POST /api/auth/logout
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (200 OK):
{
  "message": "Successfully logged out"
}
```

#### 5. Get Current User

```http
POST /api/auth/me
Authorization: Bearer <access_token>

Response (200 OK):
{
  "user_id": 1,
  "email": "admin@elspa.com",
  "name": "Admin User",
  "role": "admin"
}
```

---

## Environment Configuration

### Backend (.env)

```bash
# JWT Configuration
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend

No explicit configuration needed. The API URL is set via:
- `NEXT_PUBLIC_API_URL` environment variable
- Default: `http://localhost:8000`

---

## Frontend Implementation

### 1. Auth Store (Zustand)

**File:** `frontend/src/lib/store/auth-store.ts`

```typescript
import { useAuthStore } from '@/lib/store/auth-store';

const store = useAuthStore();

// Login
await store.login('admin@elspa.com', 'admin123');

// Logout
await store.logout();

// Refresh token
await store.refreshToken();

// Check authentication
if (store.isAuthenticated()) {
  // User is logged in
}

// Check admin role
if (store.isAdmin()) {
  // User is admin
}
```

### 2. Login Page

**File:** `frontend/src/app/auth/login/page.tsx`

- Email/password form
- Test accounts info
- Error handling
- Auto-redirect to `/admin/payroll` on success

### 3. Authenticated API Client

**File:** `frontend/src/lib/api/authenticated-client.ts`

```typescript
import { authenticatedGet, authenticatedPost } from '@/lib/api/authenticated-client';

// GET request
const employees = await authenticatedGet('/api/payroll/employees');

// POST request
const result = await authenticatedPost('/api/payroll/employees', {
  name: 'John Doe',
  hire_date: '2025-01-15'
});

// PUT request
const updated = await authenticatedPut('/api/payroll/employees/1', {
  name: 'Jane Doe'
});

// DELETE request
await authenticatedDelete('/api/payroll/employees/1');
```

### 4. Route Protection

**File:** `frontend/src/middleware.ts`

- Protects `/admin/*` routes
- Redirects unauthenticated users to `/auth/login`
- Handles token expiration

---

## Backend Implementation

### 1. JWT Module

**File:** `app/auth/jwt.py`

Functions:
- `create_access_token()` - Generate 15-min access token
- `create_refresh_token()` - Generate 7-day refresh token
- `verify_token()` - Validate token with type checking
- `decode_token()` - Extract payload from token

### 2. Dependencies

**File:** `app/auth/dependencies.py`

- `get_current_user()` - Extract and validate bearer token
- `require_admin()` - Ensure user has admin role
- `get_optional_user()` - Optional authentication

### 3. Auth Router

**File:** `app/routers/auth.py`

Endpoints:
- `POST /login` - Authenticate user
- `POST /refresh` - Get new access token
- `POST /verify` - Check token validity
- `POST /logout` - Invalidate token (blacklist)
- `POST /me` - Get current user info

**Note:** Currently uses mock users. To integrate with database:
1. Update `authenticate_user()` function
2. Query `Employee` model by email
3. Verify password hash
4. Return user info

### 4. Payroll API Protection

**File:** `app/routers/payroll.py`

Added authentication to all endpoints:

```python
@router.post("/employees", dependencies=[Depends(require_admin)])
async def create_employee(...):
    # Only admins can create employees
    pass

@router.get("/employees", dependencies=[Depends(get_current_user)])
async def list_employees(...):
    # All authenticated users can list employees
    pass
```

---

## Token Flow

### Login Flow

```
User Input (email, password)
    ↓
POST /api/auth/login
    ↓
Mock User Validation (or DB query)
    ↓
Create JWT Access Token (15 min)
Create JWT Refresh Token (7 days)
    ↓
Store in localStorage
    ↓
Redirect to /admin/payroll
```

### API Request Flow

```
Client makes API request
    ↓
authenticatedFetch() checks localStorage
    ↓
Add "Authorization: Bearer <token>" header
    ↓
Send request
    ↓
Server validates token
    ↓
If valid (200)
    ↓ return data
If invalid/expired (401)
    ↓ attempt refresh
    ↓ if refresh succeeds, retry request
    ↓ if refresh fails, redirect to /auth/login
```

---

## Security Considerations

### Token Storage

- **Current:** localStorage (vulnerable to XSS)
- **Future:** HTTP-only cookies (more secure, requires backend CORS adjustment)

### Token Expiration

- **Access Token:** 15 minutes (short-lived)
- **Refresh Token:** 7 days (longer-lived)
- **Strategy:** Automatic refresh on 401 response

### Token Blacklist

- **Current:** In-memory set (resets on server restart)
- **Future:** Redis-backed blacklist (persistent)

### Password Storage

- **Current:** Mock users (hardcoded in auth.py)
- **Future:** Hash passwords using bcrypt/argon2

### CORS

- **Current:** `allow_origins=["*"]`
- **Production:** Restrict to specific frontend domain

---

## Testing

### Run Tests

```bash
# Run all authentication tests
pytest tests/test_auth.py -v

# Run specific test
pytest tests/test_auth.py::TestLogin::test_login_success_admin -v

# Run with coverage
pytest tests/test_auth.py --cov=app.auth --cov-report=html
```

### Test Coverage

17 test cases covering:

1. **Login (6 tests)**
   - Success (Admin, User)
   - Failure (wrong password, nonexistent user)
   - Validation errors (missing fields)

2. **Token Refresh (2 tests)**
   - Success
   - Failure (invalid token)

3. **Token Verify (2 tests)**
   - Success
   - Failure (invalid token)

4. **Payroll API Auth (5 tests)**
   - Unauthorized access
   - Authenticated access
   - Admin-only endpoints

5. **Logout (1 test)**
   - Successful logout

6. **Current User (1 test)**
   - Get user info

---

## Files Created/Modified

### Backend

| File | Type | Purpose |
|------|------|---------|
| `app/auth/__init__.py` | New | Auth module exports |
| `app/auth/jwt.py` | New | JWT token management |
| `app/auth/dependencies.py` | New | FastAPI dependency functions |
| `app/routers/auth.py` | New | Authentication endpoints |
| `app/routers/payroll.py` | Modified | Added auth dependencies |
| `app/config.py` | Modified | Added JWT settings |
| `.env.example` | Modified | Added JWT configuration |
| `main.py` | Modified | Registered auth router |

### Frontend

| File | Type | Purpose |
|------|------|---------|
| `src/lib/store/auth-store.ts` | New | Zustand auth store |
| `src/app/auth/login/page.tsx` | New | Login page UI |
| `src/lib/api/authenticated-client.ts` | New | Authenticated fetch wrapper |
| `src/middleware.ts` | New | Route protection middleware |

### Tests

| File | Type | Purpose |
|------|------|---------|
| `tests/test_auth.py` | New | 17 test cases |

---

## Known Limitations

1. **Mock Users:** Currently uses hardcoded mock users. No database integration yet.
2. **In-Memory Blacklist:** Token blacklist resets on server restart.
3. **localStorage:** Not ideal for sensitive tokens (XSS vulnerable).
4. **No Refresh Token Rotation:** Same refresh token used multiple times.
5. **No Rate Limiting:** No protection against brute force attacks.

---

## Next Steps (Wave 3)

### Immediate Tasks (to unblock Wave 3)

1. **Database Integration**
   - Create `User` or `Account` model
   - Hash passwords with bcrypt
   - Update `authenticate_user()` function

2. **Redis-based Token Blacklist**
   - Replace in-memory blacklist
   - Store logout tokens with TTL

3. **Refresh Token Rotation**
   - Issue new refresh token with each refresh
   - Invalidate old refresh token

4. **HTTP-Only Cookies**
   - Move tokens to HTTP-only cookies
   - Adjust CORS settings
   - Reduce XSS vulnerability

### Wave 3 Parallel Tasks

1. **Financial Audit Trail** - Use auth for change tracking
2. **Therapist Settlement** - Auth for settlement operations
3. **Real-time Monitoring** - Auth for WebSocket connections
4. **Dashboard** - Auth for analytics access

---

## Troubleshooting

### "Invalid or expired token" Error

**Solution:** 
- Check token expiration: Access tokens expire after 15 minutes
- Use refresh endpoint to get new token
- Clear localStorage and log in again

### "Admin role required" Error

**Solution:**
- Only admin users can create/modify resources
- Log in with admin account: `admin@elspa.com` / `admin123`

### CORS Errors

**Solution:**
- Ensure `NEXT_PUBLIC_API_URL` matches backend URL
- Check that backend CORS allows frontend origin

### Token Blacklist Not Working

**Current Implementation:** In-memory set resets on server restart

**Solution:** Switch to Redis-based blacklist for persistence

---

## API Documentation

Full OpenAPI documentation available at:
- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8000/redoc` (ReDoc)

---

**Phase 8-2 Complete** ✅

Generated: 2026-05-22  
Completed: Pending (ETA 2026-05-24)
