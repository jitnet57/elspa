# Swagger UI Setup Guide

This guide explains how to set up and use the interactive API documentation for the ElSpa Payroll System.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Running Documentation Locally](#running-documentation-locally)
3. [Accessing Swagger UI](#accessing-swagger-ui)
4. [Using Try It Out](#using-try-it-out)
5. [Authentication](#authentication)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Option 1: Static HTML (Recommended for Development)

1. Navigate to the docs folder:
   ```bash
   cd e:\elspa\docs
   ```

2. Serve files with Python:
   ```bash
   python -m http.server 8001
   ```

3. Open browser:
   ```
   http://localhost:8001/index.html
   ```

### Option 2: FastAPI Built-in Documentation

If using FastAPI with automatic OpenAPI generation, access at:
```
http://localhost:8000/docs
```

### Option 3: Direct File Access

Simply open `index.html` in your browser:
```
file:///e:/elspa/docs/index.html
```

---

## Running Documentation Locally

### With Python HTTP Server

```bash
# Navigate to docs directory
cd e:\elspa\docs

# Start server on port 8001
python -m http.server 8001

# Open browser
start http://localhost:8001/index.html
```

### With Node.js

If you have Node.js installed:

```bash
# Install http-server globally (one-time)
npm install -g http-server

# Run from docs directory
cd e:\elspa\docs
http-server

# Output will show access URL
# http://127.0.0.1:8080
```

### With Node.js Built-in Server

```bash
cd e:\elspa\docs
npx http-server
```

### With FastAPI (If Integrated)

If the FastAPI app is configured with OpenAPI:

```bash
# Run backend
python main.py

# Access at
http://localhost:8000/docs     # Swagger UI
http://localhost:8000/redoc    # ReDoc alternative
```

---

## Accessing Swagger UI

### Features Available

1. **Browse All Endpoints** - Organized by resource (Employees, Cash Advance, etc.)
2. **View Request/Response Schemas** - JSON schema details with examples
3. **Try Out Requests** - Send real API calls from the UI
4. **See Status Codes** - All possible HTTP responses documented
5. **Download Specification** - Export OpenAPI spec in YAML or JSON

### Navigation Tips

- **Left Sidebar:** Search/filter endpoints
- **Expand/Collapse:** Click endpoint rows to expand details
- **Try It Out Button:** Opens request builder for each endpoint
- **Schema Tab:** View request/response data structure
- **Examples Tab:** See sample data values
- **Curl Preview:** View equivalent curl command

---

## Using Try It Out

### Example: Create an Employee

1. **Locate Endpoint**
   - Find "POST /api/payroll/employees" under Employees section
   - Click to expand

2. **Open Try It Out**
   - Click blue "Try it out" button
   - Request body editor appears

3. **Enter Data**
   ```json
   {
     "name": "Maria Santos",
     "phone": "0917-123-4567",
     "employee_type": "therapist",
     "pay_group": "weekly",
     "base_salary": 8000.00,
     "commission_rate": 10.00,
     "hire_date": "2025-01-15"
   }
   ```

4. **Send Request**
   - Click "Execute" button
   - Response appears below with actual server response

5. **View Results**
   - Status code (201 if successful)
   - Response body (created employee object)
   - Response headers
   - Time taken

### Common Workflows in Swagger UI

**Creating and Approving Payroll:**

1. POST /api/payroll/periods - Create period
2. GET /api/payroll/attendance - View attendance data
3. POST /api/payroll/periods/{id}/calculate - Calculate payroll
4. GET /api/payroll/records - View calculated records
5. POST /api/payroll/periods/{id}/approve - Approve period

**Managing Cash Advances:**

1. POST /api/payroll/cash-advance - Create CA request
2. GET /api/payroll/cash-advance - List all CAs
3. PUT /api/payroll/cash-advance/{id} - Approve/Reject CA
4. (Auto-settled during payroll calculation)

---

## Authentication

### For Production Deployments

If API requires JWT authentication:

1. **Get Token** (typically from login endpoint)
   ```bash
   POST /api/auth/login
   {
     "username": "user@example.com",
     "password": "password"
   }
   ```

2. **Add to Swagger UI**
   - Click "Authorize" button (top right)
   - Paste JWT token in "Bearer" field
   - Click "Authorize"

3. **All Requests** will now include:
   ```
   Authorization: Bearer <your_token>
   ```

### For Development (No Auth)

If development mode doesn't require authentication, skip this step. All endpoints work without authorization.

---

## File Structure

```
docs/
├── index.html              # Main Swagger UI page
├── openapi.yaml            # OpenAPI specification (YAML)
├── openapi.json            # OpenAPI specification (JSON)
├── API_REFERENCE.md        # Comprehensive Markdown documentation
├── SWAGGER_SETUP.md        # This file
└── API_EXAMPLES.md         # Curl and JavaScript examples
```

### Which File to Use

- **index.html** → Open in browser for interactive docs
- **openapi.yaml** → Reference or import into tools
- **openapi.json** → For API clients and generators
- **API_REFERENCE.md** → Complete text reference
- **API_EXAMPLES.md** → Copy-paste code examples

---

## Generating Client Code

### From Swagger UI

1. Click "Generate Client" (if available)
2. Select language (JavaScript, Python, Go, etc.)
3. Download generated SDK

### Using OpenAPI Generator (CLI)

```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate JavaScript client
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g javascript \
  -o ./generated/client

# Generate Python client
openapi-generator-cli generate \
  -i docs/openapi.yaml \
  -g python \
  -o ./generated/python-client
```

### Using Online Tools

- **Swagger Editor:** https://editor.swagger.io
  - Import openapi.yaml
  - Generate → Client → Select Language

- **OpenAPI Tools:** https://openapi.tools
  - Many third-party generators listed

---

## Troubleshooting

### OpenAPI File Not Loading

**Issue:** "Failed to load spec"

**Solution:**
```bash
# Ensure YAML is valid
python3 << 'EOF'
import yaml
with open('openapi.yaml') as f:
    yaml.safe_load(f)
print("YAML is valid")
EOF
```

### CORS Errors

**Issue:** "Cannot read remote spec"

**Solution:**
- If serving locally, use `http://localhost:8001` (not file://)
- Ensure backend has CORS enabled:
  ```python
  from fastapi.middleware.cors import CORSMiddleware
  
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

### Port Already in Use

**Issue:** `Address already in use`

**Solution:**
```bash
# Use different port
python -m http.server 8002

# Or kill existing process
# Windows
taskkill /PID <process_id> /F

# Linux/Mac
lsof -i :8001
kill -9 <process_id>
```

### Request Times Out

**Issue:** "Request Failed"

**Solution:**
- Ensure backend API is running
- Check network connectivity
- Verify API base URL is correct
- Check browser console for detailed errors (F12)

### Schema Validation Errors

**Issue:** Red error messages in Swagger UI

**Solution:**
1. Check YAML syntax:
   ```bash
   python -m yaml docs/openapi.yaml
   ```

2. Validate at https://validator.swagger.io

3. Fix any schema issues and reload page (Ctrl+F5)

---

## Integration with Frontend

### JavaScript/TypeScript

Using fetch API:
```typescript
// Get all employees
const response = await fetch('/api/payroll/employees');
const employees = await response.json();
```

Using Axios:
```typescript
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8000'
});

// Create employee
const employee = await instance.post('/api/payroll/employees', {
  name: 'Maria Santos',
  phone: '0917-123-4567',
  employee_type: 'therapist',
  pay_group: 'weekly',
  base_salary: 8000,
  commission_rate: 10,
  hire_date: '2025-01-15'
});
```

See `API_EXAMPLES.md` for more JavaScript examples.

### Python

```python
import requests

# Create employee
response = requests.post(
    'http://localhost:8000/api/payroll/employees',
    json={
        'name': 'Maria Santos',
        'phone': '0917-123-4567',
        'employee_type': 'therapist',
        'pay_group': 'weekly',
        'base_salary': 8000.00,
        'commission_rate': 10.00,
        'hire_date': '2025-01-15'
    }
)

employee = response.json()
print(f"Created employee ID: {employee['id']}")
```

---

## Best Practices

1. **Start with Swagger UI**
   - Visual, interactive documentation
   - Try endpoints before writing code
   - Understand data structures

2. **Keep OpenAPI Updated**
   - Update spec when endpoints change
   - Regenerate docs after schema updates
   - Version the spec with releases

3. **Use Meaningful Examples**
   - Provide realistic test data
   - Show error cases
   - Document business rules

4. **Test Before Publishing**
   - Run all Try It Out examples
   - Verify status codes
   - Check error messages

5. **Share with Team**
   - Point to documentation URL
   - Use for code reviews
   - Reference in tickets/PRs

---

## Advanced Features

### Request Filtering

In Swagger UI, use the search box to filter endpoints:
- Type "employee" to show only employee endpoints
- Type "POST" to show only POST methods
- Combine: "employee POST" for specific combinations

### Custom Headers

Add custom headers to requests:
1. Click endpoint
2. Expand request
3. Add headers in the request headers section

### Response Inspection

Each response shows:
- **Status:** HTTP status code
- **Headers:** Response headers
- **Body:** JSON/text response
- **Duration:** Time taken

### Curl Conversion

To get curl equivalent:
1. Fill in Try It Out form
2. Scroll to "Responses"
3. Look for curl command in curl tab

---

## Support & Resources

- **OpenAPI Specification:** https://spec.openapis.org/oas/v3.0.0
- **Swagger UI Documentation:** https://swagger.io/tools/swagger-ui/
- **ReDoc Alternative:** https://redoc.ly/
- **FastAPI Integration:** https://fastapi.tiangolo.com/deployment/concepts/#openapi-and-apis

---

## Quick Reference

| Task | Command |
|------|---------|
| Start local docs server | `python -m http.server 8001` |
| Validate YAML | `python -m yaml docs/openapi.yaml` |
| Generate Python client | `openapi-generator-cli generate -i docs/openapi.yaml -g python -o ./gen` |
| Check backend CORS | Test a request from Swagger UI |
| Access Swagger UI | `http://localhost:8001/index.html` |
| View raw spec | `http://localhost:8001/openapi.yaml` |

---

**Last Updated:** 2026-05-21  
**Version:** 1.0.0

