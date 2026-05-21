# ElSpa Payroll System - API Documentation

**Version:** 1.0.0  
**Last Updated:** 2026-05-21  
**Generated:** Comprehensive OpenAPI 3.0 specification with complete reference documentation

---

## Overview

Complete API documentation for the **ElSpa Payroll System** — a comprehensive RESTful API for managing employee payroll, cash advances, attendance, and payroll calculations in the Philippines.

### What's Included

This documentation package contains:

1. **OpenAPI 3.0 Specifications**
   - Full machine-readable API spec in YAML and JSON formats
   - Compatible with Swagger UI, Postman, and code generators
   
2. **Interactive Documentation**
   - Swagger UI with "Try It Out" functionality
   - Click-and-test all 21 API endpoints directly from browser
   - Request/response examples and schemas
   
3. **Comprehensive Guides**
   - Complete endpoint reference with business logic
   - cURL, JavaScript, Python, and Postman examples
   - Step-by-step setup and integration instructions
   
4. **Real-World Examples**
   - Complete workflow examples (employee creation → payroll calculation)
   - Error handling patterns
   - Data model documentation

---

## Files in This Package

| File | Purpose | Format | Size |
|------|---------|--------|------|
| **index.html** | Interactive Swagger UI | HTML | 3.2 KB |
| **openapi.yaml** | API specification (YAML format) | YAML | 48.9 KB |
| **openapi.json** | API specification (JSON format) | JSON | 65.9 KB |
| **API_REFERENCE.md** | Complete endpoint documentation | Markdown | 30.9 KB |
| **API_EXAMPLES.md** | Code examples in 4 languages | Markdown | 28.1 KB |
| **SWAGGER_SETUP.md** | Setup and integration guide | Markdown | 10.4 KB |
| **README_API_DOCS.md** | This file | Markdown | - |

---

## Quick Start

### 1. View Interactive Documentation

**Option A: Swagger UI (Recommended)**
```bash
# Start a simple web server
cd e:\elspa\docs
python -m http.server 8001

# Open browser
http://localhost:8001/index.html
```

**Option B: Direct File Access**
```bash
# Simply open in browser
file:///e:/elspa/docs/index.html
```

**Option C: If Backend is Running**
```
http://localhost:8000/docs
```

### 2. Try Out API Endpoints

1. Open Swagger UI (index.html)
2. Click any endpoint (e.g., "POST /api/payroll/employees")
3. Click "Try it out" button
4. Enter sample data
5. Click "Execute"
6. View response immediately

### 3. Read Reference Docs

- For complete endpoint details → **API_REFERENCE.md**
- For code examples → **API_EXAMPLES.md**
- For setup help → **SWAGGER_SETUP.md**

---

## API Overview

### 21 Endpoints Across 6 Resources

#### Employees (5 endpoints)
- Create, read, update, delete employees
- List with filtering by type
- Support: therapist, driver, manager, maintenance, nail, hollys

#### Cash Advance (3 endpoints)
- Request, approve, reject cash advances
- Track settlement during payroll
- Status workflow: pending → approved → settled

#### Attendance (3 endpoints)
- Log daily attendance with clock-in/out
- Auto-calculate overtime and tardiness
- Holiday classification (national/special)

#### Holidays (3 endpoints)
- Create and manage Philippine holidays
- Support national (200%) and special (130%) holidays
- Automatic pay multiplier application

#### Payroll Periods (4 endpoints)
- Create payroll cycles (weekly/biweekly)
- Status workflow: draft → approved → paid
- Period-wide calculations and approvals

#### Payroll Records (3 endpoints)
- Calculate payroll with detailed breakdown
- Track all income and deduction components
- View settlement details

**Total:** 21 endpoints covering complete payroll lifecycle

---

## Core Features

### Automatic Calculations
```
Gross Pay = Base Salary + Commission + Overtime + Holiday Bonus + Meal Allowance
Total Deductions = Late + Absence + SSS + CA + Health Check + 13th Month
Net Pay = Gross Pay - Total Deductions
```

### Multi-Step Workflow
```
Employee → Attendance → Payroll Period → Calculate → Approve → Pay
```

### Business Logic Support
- **Overtime:** >= 40 minutes triggers overtime pay
- **Tardiness:** > 10 minutes = 10 PHP per minute deduction
- **Holiday Pay:** National (2x) vs Special (1.3x) multipliers
- **Cash Advance:** Tracked and auto-settled during payroll
- **Multi-employee:** Process all employees in one period

---

## Code Examples Quick Reference

### cURL: Create Employee
```bash
curl -X POST http://localhost:8000/api/payroll/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "phone": "0917-123-4567",
    "employee_type": "therapist",
    "pay_group": "weekly",
    "base_salary": 8000.00,
    "commission_rate": 10.00,
    "hire_date": "2025-01-15"
  }'
```

### JavaScript: Calculate Payroll
```typescript
const api = new PayrollApi('http://localhost:8000');
const records = await api.calculatePayroll(periodId);
console.log(`Calculated ${records.length} employee records`);
```

### Python: Process Weekly Payroll
```python
api = PayrollApi()
period = api.create_payroll_period({
    'period_start': '2026-05-19',
    'period_end': '2026-05-25',
    'pay_group': 'weekly'
})
records = api.calculate_payroll(period['id'])
```

See **API_EXAMPLES.md** for complete code in all languages.

---

## Data Models

### Employee
```typescript
{
  id: integer,
  name: string,
  phone: string,
  employee_type: "therapist" | "driver" | "manager" | "nail" | "maintenance" | "hollys",
  pay_group: "weekly" | "biweekly",
  base_salary: decimal,
  commission_rate: decimal,
  hire_date: date,
  is_active: boolean,
  created_at: datetime,
  updated_at: datetime
}
```

### PayrollRecord (Calculated)
```typescript
{
  // Income
  base_amount: decimal,
  commission_amount: decimal,
  overtime_amount: decimal,
  holiday_bonus: decimal,
  meal_allowance: decimal,
  
  // Deductions
  late_deduction: decimal,
  absence_deduction: decimal,
  sss_deduction: decimal,
  ca_deduction: decimal,
  health_check_deduction: decimal,
  thirteenth_month_deduction: decimal,
  
  // Summary
  gross_pay: decimal,
  total_deductions: decimal,
  net_pay: decimal,
  
  status: "draft" | "approved" | "paid"
}
```

See **API_REFERENCE.md** for all 6 data models with field descriptions.

---

## API Specification Files

### OpenAPI YAML (openapi.yaml)
- **Format:** YAML (human-readable)
- **Use Case:** Reference, import into Swagger Editor
- **Size:** 48.9 KB
- **Content:** 21 endpoints with full schemas, examples, errors

### OpenAPI JSON (openapi.json)
- **Format:** JSON (machine-readable)
- **Use Case:** API client generation, tool integration
- **Size:** 65.9 KB
- **Content:** Same as YAML, different format

### Validation
Both files are valid OpenAPI 3.0 and can be validated at:
- https://validator.swagger.io
- Swagger Editor: https://editor.swagger.io

---

## Integration Paths

### Path 1: Browser Testing (5 minutes)
1. Open `index.html` in browser
2. Click endpoint → "Try it out" → Enter data → "Execute"
3. See live response
4. Copy curl command if needed

### Path 2: Command Line Testing (10 minutes)
1. Copy cURL examples from **API_EXAMPLES.md**
2. Run in terminal with your data
3. Parse JSON response

### Path 3: Code Integration (30 minutes)
1. Pick language: JavaScript, Python, etc.
2. Copy client code from **API_EXAMPLES.md**
3. Adapt to your needs
4. Call API endpoints from your app

### Path 4: Auto-Generated Client (20 minutes)
1. Upload `openapi.yaml` to https://editor.swagger.io
2. Click "Generate Client"
3. Select language (JavaScript, Python, Go, etc.)
4. Download generated SDK
5. Use in your project

---

## Common Tasks

### Task: Create Weekly Payroll
**Reference:** See "Complete Workflow Example" in **API_REFERENCE.md** page 50+

**Steps:**
1. POST /api/payroll/periods (create period)
2. POST /api/payroll/attendance (log daily work)
3. POST /api/payroll/cash-advance (request any CAs)
4. PUT /api/payroll/cash-advance/{id} (approve CAs)
5. POST /api/payroll/periods/{id}/calculate (calculate payroll)
6. POST /api/payroll/periods/{id}/approve (approve period)
7. POST /api/payroll/periods/{id}/approve (mark as paid)

### Task: Log Employee Attendance
**Examples:** **API_EXAMPLES.md** sections on cURL Attendance

**Key Points:**
- Unique per employee per day
- Supports late, overtime, holidays, absent
- Auto-calculates deductions and bonuses

### Task: Integrate into Frontend
**Framework Examples:**
- **React:** See **API_EXAMPLES.md** "React Component Example"
- **Vue/Nuxt:** Use same fetch/axios patterns
- **Next.js:** Use in API routes or client components

**Reference:** **API_EXAMPLES.md** has 50+ working code examples

### Task: Generate Reports
**Example:** **API_EXAMPLES.md** "Generate Payroll Report" (Python + Pandas)

**Available Data:**
- Individual payroll records with breakdown
- Period-wide summaries
- Employee history

---

## Error Handling

### Standard Error Format
```json
{
  "detail": "Human-readable error message"
}
```

### Common Errors

| Status | Example | Solution |
|--------|---------|----------|
| 400 | Invalid employee type | Check enum values in schema |
| 404 | Employee not found | Verify employee_id exists |
| 409 | Period already paid | Can't modify paid periods |
| 500 | Database error | Check backend logs |

See **API_REFERENCE.md** "Error Handling" section for all cases.

---

## Setup Instructions

### Running Swagger UI Locally

**Python (Built-in):**
```bash
cd e:\elspa\docs
python -m http.server 8001
# Open http://localhost:8001/index.html
```

**Node.js:**
```bash
npm install -g http-server
cd e:\elspa\docs
http-server
# Open http://127.0.0.1:8080
```

### CORS Setup (If Backend Required)

FastAPI backend needs CORS enabled:

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

See **SWAGGER_SETUP.md** for detailed setup guide.

---

## File Relationships

```
docs/
├── index.html ─────────────► (Displays openapi.yaml via SwaggerUIBundle)
├── openapi.yaml ───────────► (Source of truth for API spec)
├── openapi.json ───────────► (Same spec, JSON format)
├── API_REFERENCE.md ───────► (Detailed explanation of openapi.yaml)
├── API_EXAMPLES.md ────────► (Code examples for openapi endpoints)
├── SWAGGER_SETUP.md ───────► (How to run and use index.html)
└── README_API_DOCS.md ─────► (This file - overview and navigation)
```

**Recommended Reading Order:**
1. **README_API_DOCS.md** (this file) ← Quick overview
2. **API_REFERENCE.md** ← Understand each endpoint
3. **API_EXAMPLES.md** ← See code in your language
4. **SWAGGER_SETUP.md** ← Run and test locally
5. **openapi.yaml** ← Reference for tooling/generation

---

## Testing Checklist

- [ ] Open index.html in browser
- [ ] Expand a POST endpoint (e.g., "Create Employee")
- [ ] Click "Try it out"
- [ ] Fill in sample data
- [ ] Click "Execute"
- [ ] See 201 response with employee object
- [ ] Copy cURL command and run in terminal
- [ ] Verify same response
- [ ] Read corresponding section in API_REFERENCE.md
- [ ] Look at code example in API_EXAMPLES.md for your language

---

## Support & Troubleshooting

### Swagger UI Not Loading
**Issue:** "Failed to load spec"
**Solution:** Ensure you're using http://localhost:8001 (not file://)

### API Returns 500
**Issue:** "Internal server error"
**Solution:** Check backend is running (python main.py)

### CORS Errors
**Issue:** "No 'Access-Control-Allow-Origin'"
**Solution:** Add CORS middleware to FastAPI (see above)

### Port Already in Use
**Issue:** "Address already in use"
**Solution:** Use different port: `python -m http.server 8002`

See **SWAGGER_SETUP.md** "Troubleshooting" section for more.

---

## Generated With

- **OpenAPI Specification:** 3.0.0
- **Swagger UI:** Latest (CDN)
- **FastAPI Router:** Direct source analysis
- **Documentation:** Comprehensive reference
- **Examples:** 50+ code samples

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-05-21 | 1.0.0 | Initial complete documentation release |

---

## Key Statistics

- **Endpoints Documented:** 21
- **Data Models:** 6
- **HTTP Methods:** 3 (GET, POST, PUT, DELETE)
- **Status Codes:** 5 (200, 201, 204, 400, 404, 409, 500)
- **Example Workflows:** 5+
- **Code Examples:** 50+
- **Languages Covered:** 3 (cURL, JavaScript/TypeScript, Python)

---

## Next Steps

1. **For Developers:**
   - Open index.html → Try endpoints
   - Read API_EXAMPLES.md → Copy code to project
   - Integrate client into your app

2. **For API Consumers:**
   - Use openapi.yaml with code generator
   - Or use auto-generated client from Swagger UI
   - Follow example workflows

3. **For Documentation:**
   - Share index.html link with team
   - Reference API_REFERENCE.md in tickets
   - Use API_EXAMPLES.md for code reviews

---

## Feedback & Updates

- All documentation synced with `app/routers/payroll.py` (2026-05-21)
- OpenAPI spec is machine-readable and tool-compatible
- Code examples are tested and working
- Markdown docs are comprehensive and detailed

---

**Last Updated:** 2026-05-21  
**Documentation Version:** 1.0.0  
**API Version:** 1.0.0

For questions or updates, refer to the project's CLAUDE.md and development guidelines.

