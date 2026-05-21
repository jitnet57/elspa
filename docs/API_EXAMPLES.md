# ElSpa Payroll API Examples

Complete working examples using curl, JavaScript/TypeScript, Python, and Postman.

---

## Table of Contents

1. [cURL Examples](#curl-examples)
2. [JavaScript/TypeScript Examples](#javascripttypescript-examples)
3. [Python Examples](#python-examples)
4. [Postman Collection](#postman-collection)
5. [Error Handling Examples](#error-handling-examples)

---

## cURL Examples

### Employees API

#### Create Employee (Therapist)

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

**Expected Response:**
```json
{
  "id": 1,
  "name": "Maria Santos",
  "phone": "0917-123-4567",
  "employee_type": "therapist",
  "pay_group": "weekly",
  "base_salary": 8000.00,
  "commission_rate": 10.00,
  "hire_date": "2025-01-15",
  "is_active": true,
  "created_at": "2026-05-21T10:30:00",
  "updated_at": "2026-05-21T10:30:00"
}
```

#### Create Employee (Driver)

```bash
curl -X POST http://localhost:8000/api/payroll/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Cruz",
    "phone": "0917-234-5678",
    "employee_type": "driver",
    "pay_group": "biweekly",
    "base_salary": 10000.00,
    "commission_rate": 0,
    "hire_date": "2024-06-01"
  }'
```

#### List All Employees

```bash
curl -X GET "http://localhost:8000/api/payroll/employees?skip=0&limit=50"
```

#### List Therapists Only

```bash
curl -X GET "http://localhost:8000/api/payroll/employees?employee_type=therapist"
```

#### Get Specific Employee

```bash
curl -X GET http://localhost:8000/api/payroll/employees/1
```

#### Update Employee

```bash
curl -X PUT http://localhost:8000/api/payroll/employees/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos Updated",
    "phone": "0917-999-8888",
    "employee_type": "therapist",
    "pay_group": "weekly",
    "base_salary": 9000.00,
    "commission_rate": 12.00,
    "hire_date": "2025-01-15"
  }'
```

#### Delete Employee

```bash
curl -X DELETE http://localhost:8000/api/payroll/employees/1
```

---

### Cash Advance API

#### Request Cash Advance

```bash
curl -X POST http://localhost:8000/api/payroll/cash-advance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "amount": 2000.00,
    "request_date": "2026-05-20",
    "reason": "Medical emergency"
  }'
```

#### List All Cash Advances

```bash
curl -X GET "http://localhost:8000/api/payroll/cash-advance?skip=0&limit=50"
```

#### List Pending Cash Advances

```bash
curl -X GET "http://localhost:8000/api/payroll/cash-advance?status=pending"
```

#### List Approved Cash Advances

```bash
curl -X GET "http://localhost:8000/api/payroll/cash-advance?status=approved"
```

#### Approve Cash Advance

```bash
curl -X PUT "http://localhost:8000/api/payroll/cash-advance/1?status=approved"
```

#### Reject Cash Advance

```bash
curl -X PUT "http://localhost:8000/api/payroll/cash-advance/1?status=rejected"
```

---

### Attendance API

#### Log Attendance (Regular Day)

```bash
curl -X POST http://localhost:8000/api/payroll/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "work_date": "2026-05-21",
    "clock_in": "08:00",
    "clock_out": "17:30",
    "late_minutes": 0,
    "overtime_minutes": 0,
    "is_absent": false,
    "holiday_type": "none"
  }'
```

#### Log Attendance (Late)

```bash
curl -X POST http://localhost:8000/api/payroll/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "work_date": "2026-05-22",
    "clock_in": "08:20",
    "clock_out": "17:30",
    "late_minutes": 20,
    "overtime_minutes": 0,
    "is_absent": false,
    "holiday_type": "none"
  }'
```

#### Log Attendance (Overtime)

```bash
curl -X POST http://localhost:8000/api/payroll/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "work_date": "2026-05-23",
    "clock_in": "08:00",
    "clock_out": "20:00",
    "late_minutes": 0,
    "overtime_minutes": 120,
    "is_absent": false,
    "holiday_type": "none"
  }'
```

#### Log Attendance (Holiday with OT)

```bash
curl -X POST http://localhost:8000/api/payroll/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "work_date": "2026-06-12",
    "clock_in": "08:00",
    "clock_out": "19:00",
    "late_minutes": 0,
    "overtime_minutes": 180,
    "is_absent": false,
    "holiday_type": "national"
  }'
```

#### Log Attendance (Absent)

```bash
curl -X POST http://localhost:8000/api/payroll/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 2,
    "work_date": "2026-05-24",
    "clock_in": null,
    "clock_out": null,
    "late_minutes": 0,
    "overtime_minutes": 0,
    "is_absent": true,
    "holiday_type": "none"
  }'
```

#### List Attendance (All)

```bash
curl -X GET "http://localhost:8000/api/payroll/attendance?skip=0&limit=100"
```

#### List Attendance (Specific Date)

```bash
curl -X GET "http://localhost:8000/api/payroll/attendance?work_date=2026-05-21"
```

#### List Attendance (Specific Employee)

```bash
curl -X GET "http://localhost:8000/api/payroll/attendance?employee_id=1"
```

#### Update Attendance

```bash
curl -X PUT http://localhost:8000/api/payroll/attendance/1 \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": 1,
    "work_date": "2026-05-21",
    "clock_in": "08:05",
    "clock_out": "17:35",
    "late_minutes": 5,
    "overtime_minutes": 0,
    "is_absent": false,
    "holiday_type": "none"
  }'
```

---

### Holidays API

#### Create National Holiday

```bash
curl -X POST http://localhost:8000/api/payroll/holidays \
  -H "Content-Type: application/json" \
  -d '{
    "holiday_date": "2026-06-12",
    "holiday_name": "Independence Day",
    "holiday_type": "national",
    "rate_multiplier": 2.00
  }'
```

#### Create Special Holiday

```bash
curl -X POST http://localhost:8000/api/payroll/holidays \
  -H "Content-Type: application/json" \
  -d '{
    "holiday_date": "2026-11-01",
    "holiday_name": "All Saints' Day",
    "holiday_type": "special",
    "rate_multiplier": 1.30
  }'
```

#### List All Holidays

```bash
curl -X GET "http://localhost:8000/api/payroll/holidays?skip=0&limit=50"
```

#### Delete Holiday

```bash
curl -X DELETE http://localhost:8000/api/payroll/holidays/1
```

---

### Payroll Periods API

#### Create Weekly Payroll Period

```bash
curl -X POST http://localhost:8000/api/payroll/periods \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-05-19",
    "period_end": "2026-05-25",
    "pay_group": "weekly"
  }'
```

#### Create Bi-weekly Payroll Period

```bash
curl -X POST http://localhost:8000/api/payroll/periods \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-05-12",
    "period_end": "2026-05-25",
    "pay_group": "biweekly"
  }'
```

#### List All Payroll Periods

```bash
curl -X GET "http://localhost:8000/api/payroll/periods?skip=0&limit=50"
```

#### Get Specific Period

```bash
curl -X GET http://localhost:8000/api/payroll/periods/1
```

#### Calculate Payroll for Period

```bash
curl -X POST http://localhost:8000/api/payroll/periods/1/calculate
```

**Expected Response:**
```json
[
  {
    "id": 1,
    "payroll_period_id": 1,
    "employee_id": 1,
    "base_amount": 8000.00,
    "commission_amount": 1200.00,
    "overtime_amount": 500.00,
    "holiday_bonus": 800.00,
    "meal_allowance": 0.00,
    "late_deduction": 100.00,
    "absence_deduction": 0.00,
    "sss_deduction": 0.00,
    "ca_deduction": 2000.00,
    "health_check_deduction": 0.00,
    "thirteenth_month_deduction": 0.00,
    "gross_pay": 10500.00,
    "total_deductions": 2100.00,
    "net_pay": 8400.00,
    "status": "draft",
    "notes": null,
    "created_at": "2026-05-21T10:30:00",
    "updated_at": "2026-05-21T10:30:00"
  }
]
```

#### Approve Payroll Period (Draft → Approved)

```bash
curl -X POST http://localhost:8000/api/payroll/periods/1/approve
```

#### Mark As Paid (Approved → Paid)

```bash
curl -X POST http://localhost:8000/api/payroll/periods/1/approve
```

---

### Payroll Records API

#### List All Payroll Records

```bash
curl -X GET "http://localhost:8000/api/payroll/records?skip=0&limit=50"
```

#### List Records for Specific Period

```bash
curl -X GET "http://localhost:8000/api/payroll/records?payroll_period_id=1"
```

#### List Records for Specific Employee

```bash
curl -X GET "http://localhost:8000/api/payroll/records?employee_id=1"
```

#### Get Specific Payroll Record

```bash
curl -X GET http://localhost:8000/api/payroll/records/1
```

---

## JavaScript/TypeScript Examples

### Setup: Fetch API Wrapper

```typescript
// api.ts
interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

class PayrollApi {
  private baseUrl: string;
  private token?: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  setToken(token: string) {
    this.token = token;
  }

  private async request<T>(path: string, options: ApiOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'API Error');
    }

    return response.json();
  }

  // Employees
  async createEmployee(data: any) {
    return this.request('/api/payroll/employees', {
      method: 'POST',
      body: data,
    });
  }

  async getEmployees(skip = 0, limit = 100, type?: string) {
    let path = `/api/payroll/employees?skip=${skip}&limit=${limit}`;
    if (type) path += `&employee_type=${type}`;
    return this.request(path);
  }

  async getEmployee(id: number) {
    return this.request(`/api/payroll/employees/${id}`);
  }

  async updateEmployee(id: number, data: any) {
    return this.request(`/api/payroll/employees/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  async deleteEmployee(id: number) {
    return this.request(`/api/payroll/employees/${id}`, {
      method: 'DELETE',
    });
  }

  // Cash Advance
  async createCashAdvance(data: any) {
    return this.request('/api/payroll/cash-advance', {
      method: 'POST',
      body: data,
    });
  }

  async getCashAdvances(skip = 0, limit = 100, status?: string) {
    let path = `/api/payroll/cash-advance?skip=${skip}&limit=${limit}`;
    if (status) path += `&status=${status}`;
    return this.request(path);
  }

  async updateCashAdvanceStatus(id: number, status: string) {
    return this.request(`/api/payroll/cash-advance/${id}?status=${status}`, {
      method: 'PUT',
    });
  }

  // Attendance
  async createAttendance(data: any) {
    return this.request('/api/payroll/attendance', {
      method: 'POST',
      body: data,
    });
  }

  async getAttendance(workDate?: string, employeeId?: number) {
    let path = '/api/payroll/attendance?skip=0&limit=100';
    if (workDate) path += `&work_date=${workDate}`;
    if (employeeId) path += `&employee_id=${employeeId}`;
    return this.request(path);
  }

  async updateAttendance(id: number, data: any) {
    return this.request(`/api/payroll/attendance/${id}`, {
      method: 'PUT',
      body: data,
    });
  }

  // Payroll Periods
  async createPayrollPeriod(data: any) {
    return this.request('/api/payroll/periods', {
      method: 'POST',
      body: data,
    });
  }

  async getPayrollPeriods() {
    return this.request('/api/payroll/periods');
  }

  async getPayrollPeriod(id: number) {
    return this.request(`/api/payroll/periods/${id}`);
  }

  async calculatePayroll(periodId: number) {
    return this.request(`/api/payroll/periods/${periodId}/calculate`, {
      method: 'POST',
    });
  }

  async approvePayrollPeriod(periodId: number) {
    return this.request(`/api/payroll/periods/${periodId}/approve`, {
      method: 'POST',
    });
  }

  // Payroll Records
  async getPayrollRecords(periodId?: number, employeeId?: number) {
    let path = '/api/payroll/records';
    const params = new URLSearchParams();
    if (periodId) params.append('payroll_period_id', String(periodId));
    if (employeeId) params.append('employee_id', String(employeeId));
    if (params.toString()) path += `?${params}`;
    return this.request(path);
  }

  async getPayrollRecord(id: number) {
    return this.request(`/api/payroll/records/${id}`);
  }
}

export default PayrollApi;
```

### Usage Examples

#### Create Employee

```typescript
const api = new PayrollApi('http://localhost:8000');

const employee = await api.createEmployee({
  name: 'Maria Santos',
  phone: '0917-123-4567',
  employee_type: 'therapist',
  pay_group: 'weekly',
  base_salary: 8000,
  commission_rate: 10,
  hire_date: '2025-01-15',
});

console.log(`Created employee: ${employee.name} (ID: ${employee.id})`);
```

#### Request and Approve Cash Advance

```typescript
// Create CA
const ca = await api.createCashAdvance({
  employee_id: 1,
  amount: 2000,
  request_date: '2026-05-20',
  reason: 'Medical emergency',
});

console.log(`CA created with status: ${ca.status}`);

// Approve CA
const approved = await api.updateCashAdvanceStatus(ca.id, 'approved');
console.log(`CA approved, new status: ${approved.status}`);
```

#### Complete Payroll Workflow

```typescript
async function processWeeklyPayroll() {
  // 1. Create payroll period
  const period = await api.createPayrollPeriod({
    period_start: '2026-05-19',
    period_end: '2026-05-25',
    pay_group: 'weekly',
  });
  console.log(`Created payroll period: ${period.id}`);

  // 2. Calculate payroll
  const records = await api.calculatePayroll(period.id);
  console.log(`Calculated payroll for ${records.length} employees`);

  // 3. Display results
  records.forEach(record => {
    console.log(`
      Employee ${record.employee_id}:
        Gross: ${record.gross_pay}
        Deductions: ${record.total_deductions}
        Net: ${record.net_pay}
    `);
  });

  // 4. Approve period
  const approved = await api.approvePayrollPeriod(period.id);
  console.log(`Period approved, status: ${approved.status}`);

  // 5. Mark as paid
  const paid = await api.approvePayrollPeriod(period.id);
  console.log(`Period marked as paid, status: ${paid.status}`);
}

processWeeklyPayroll().catch(console.error);
```

#### Log Attendance for Week

```typescript
async function logWeekAttendance(employeeId: number) {
  const dates = ['2026-05-19', '2026-05-20', '2026-05-21', '2026-05-22', '2026-05-23'];

  for (const date of dates) {
    await api.createAttendance({
      employee_id: employeeId,
      work_date: date,
      clock_in: '08:00',
      clock_out: '17:30',
      late_minutes: 0,
      overtime_minutes: 0,
      is_absent: false,
      holiday_type: 'none',
    });
  }

  console.log('Week attendance logged');
}
```

#### React Component Example

```typescript
import React, { useState, useEffect } from 'react';
import PayrollApi from './api';

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = new PayrollApi();
    api
      .getEmployees()
      .then(setEmployees)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Type</th>
          <th>Salary</th>
          <th>Commission</th>
        </tr>
      </thead>
      <tbody>
        {employees.map(emp => (
          <tr key={emp.id}>
            <td>{emp.id}</td>
            <td>{emp.name}</td>
            <td>{emp.employee_type}</td>
            <td>₱{emp.base_salary.toLocaleString()}</td>
            <td>{emp.commission_rate}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Python Examples

### Setup: Requests Wrapper

```python
# payroll_api.py
import requests
from typing import Optional, Dict, Any, List

class PayrollApi:
    def __init__(self, base_url: str = 'http://localhost:8000'):
        self.base_url = base_url
        self.session = requests.Session()
        self.token: Optional[str] = None

    def set_token(self, token: str):
        self.token = token
        if token:
            self.session.headers.update({'Authorization': f'Bearer {token}'})

    def _request(self, method: str, path: str, **kwargs) -> Dict[str, Any]:
        url = f'{self.base_url}{path}'
        response = self.session.request(method, url, **kwargs)
        
        if not response.ok:
            try:
                error_data = response.json()
                raise Exception(error_data.get('detail', 'API Error'))
            except:
                response.raise_for_status()
        
        if response.status_code == 204:
            return {}
        
        return response.json()

    # Employees
    def create_employee(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/api/payroll/employees', json=data)

    def get_employees(self, skip: int = 0, limit: int = 100, 
                     employee_type: Optional[str] = None) -> List[Dict]:
        params = {'skip': skip, 'limit': limit}
        if employee_type:
            params['employee_type'] = employee_type
        return self._request('GET', '/api/payroll/employees', params=params)

    def get_employee(self, employee_id: int) -> Dict[str, Any]:
        return self._request('GET', f'/api/payroll/employees/{employee_id}')

    def update_employee(self, employee_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'/api/payroll/employees/{employee_id}', json=data)

    def delete_employee(self, employee_id: int) -> None:
        self._request('DELETE', f'/api/payroll/employees/{employee_id}')

    # Cash Advance
    def create_cash_advance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/api/payroll/cash-advance', json=data)

    def get_cash_advances(self, skip: int = 0, limit: int = 100, 
                         status: Optional[str] = None) -> List[Dict]:
        params = {'skip': skip, 'limit': limit}
        if status:
            params['status'] = status
        return self._request('GET', '/api/payroll/cash-advance', params=params)

    def update_cash_advance_status(self, ca_id: int, status: str) -> Dict[str, Any]:
        return self._request('PUT', f'/api/payroll/cash-advance/{ca_id}', 
                           params={'status': status})

    # Attendance
    def create_attendance(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/api/payroll/attendance', json=data)

    def get_attendance(self, work_date: Optional[str] = None, 
                      employee_id: Optional[int] = None) -> List[Dict]:
        params = {'skip': 0, 'limit': 100}
        if work_date:
            params['work_date'] = work_date
        if employee_id:
            params['employee_id'] = employee_id
        return self._request('GET', '/api/payroll/attendance', params=params)

    def update_attendance(self, log_id: int, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('PUT', f'/api/payroll/attendance/{log_id}', json=data)

    # Payroll
    def create_payroll_period(self, data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/api/payroll/periods', json=data)

    def get_payroll_periods(self) -> List[Dict]:
        return self._request('GET', '/api/payroll/periods')

    def calculate_payroll(self, period_id: int) -> List[Dict]:
        return self._request('POST', f'/api/payroll/periods/{period_id}/calculate')

    def approve_payroll_period(self, period_id: int) -> Dict[str, Any]:
        return self._request('POST', f'/api/payroll/periods/{period_id}/approve')

    def get_payroll_records(self, period_id: Optional[int] = None,
                           employee_id: Optional[int] = None) -> List[Dict]:
        params = {}
        if period_id:
            params['payroll_period_id'] = period_id
        if employee_id:
            params['employee_id'] = employee_id
        return self._request('GET', '/api/payroll/records', params=params)

    def get_payroll_record(self, record_id: int) -> Dict[str, Any]:
        return self._request('GET', f'/api/payroll/records/{record_id}')
```

### Usage Examples

#### Create Employee

```python
from payroll_api import PayrollApi

api = PayrollApi()

employee = api.create_employee({
    'name': 'Maria Santos',
    'phone': '0917-123-4567',
    'employee_type': 'therapist',
    'pay_group': 'weekly',
    'base_salary': 8000.00,
    'commission_rate': 10.00,
    'hire_date': '2025-01-15'
})

print(f"Created employee: {employee['name']} (ID: {employee['id']})")
```

#### Complete Payroll Processing

```python
def process_weekly_payroll():
    api = PayrollApi()
    
    # 1. Create period
    period = api.create_payroll_period({
        'period_start': '2026-05-19',
        'period_end': '2026-05-25',
        'pay_group': 'weekly'
    })
    print(f"Created period: {period['id']}")
    
    # 2. Calculate
    records = api.calculate_payroll(period['id'])
    print(f"Calculated {len(records)} employee records")
    
    # 3. Display results
    for record in records:
        print(f"""
            Employee {record['employee_id']}:
            Gross: ₱{record['gross_pay']:.2f}
            Deductions: ₱{record['total_deductions']:.2f}
            Net: ₱{record['net_pay']:.2f}
        """)
    
    # 4. Approve
    approved = api.approve_payroll_period(period['id'])
    print(f"Status: {approved['status']}")
    
    # 5. Mark paid
    paid = api.approve_payroll_period(period['id'])
    print(f"Final Status: {paid['status']}")

if __name__ == '__main__':
    process_weekly_payroll()
```

#### Generate Payroll Report

```python
import pandas as pd
from datetime import datetime

def generate_payroll_report(period_id: int):
    api = PayrollApi()
    
    # Get records
    records = api.get_payroll_records(period_id=period_id)
    
    # Create DataFrame
    df = pd.DataFrame([{
        'Employee ID': r['employee_id'],
        'Base': r['base_amount'],
        'Commission': r['commission_amount'],
        'OT': r['overtime_amount'],
        'Late Deduction': r['late_deduction'],
        'CA Deduction': r['ca_deduction'],
        'Gross': r['gross_pay'],
        'Deductions': r['total_deductions'],
        'Net': r['net_pay']
    } for r in records])
    
    # Export to Excel
    filename = f"payroll_{period_id}_{datetime.now().strftime('%Y%m%d')}.xlsx"
    df.to_excel(filename, index=False)
    print(f"Report saved: {filename}")
    
    # Summary
    print(f"\nPayroll Summary:")
    print(f"Total Gross: ₱{df['Gross'].sum():.2f}")
    print(f"Total Deductions: ₱{df['Deductions'].sum():.2f}")
    print(f"Total Net: ₱{df['Net'].sum():.2f}")

# Usage
generate_payroll_report(1)
```

---

## Postman Collection

Save as `ElSpa-Payroll-API.postman_collection.json`:

```json
{
  "info": {
    "name": "ElSpa Payroll API",
    "description": "Complete API collection for ElSpa payroll system",
    "version": "1.0.0"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000",
      "type": "string"
    },
    {
      "key": "employee_id",
      "value": "1",
      "type": "string"
    },
    {
      "key": "period_id",
      "value": "1",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Employees",
      "item": [
        {
          "name": "Create Employee",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"name\": \"Maria Santos\",\n  \"phone\": \"0917-123-4567\",\n  \"employee_type\": \"therapist\",\n  \"pay_group\": \"weekly\",\n  \"base_salary\": 8000.00,\n  \"commission_rate\": 10.00,\n  \"hire_date\": \"2025-01-15\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/payroll/employees",
              "host": ["{{base_url}}"],
              "path": ["api", "payroll", "employees"]
            }
          }
        },
        {
          "name": "List Employees",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{base_url}}/api/payroll/employees?skip=0&limit=100",
              "host": ["{{base_url}}"],
              "path": ["api", "payroll", "employees"],
              "query": [
                {
                  "key": "skip",
                  "value": "0"
                },
                {
                  "key": "limit",
                  "value": "100"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Payroll",
      "item": [
        {
          "name": "Create Payroll Period",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"period_start\": \"2026-05-19\",\n  \"period_end\": \"2026-05-25\",\n  \"pay_group\": \"weekly\"\n}"
            },
            "url": {
              "raw": "{{base_url}}/api/payroll/periods",
              "host": ["{{base_url}}"],
              "path": ["api", "payroll", "periods"]
            }
          }
        },
        {
          "name": "Calculate Payroll",
          "request": {
            "method": "POST",
            "url": {
              "raw": "{{base_url}}/api/payroll/periods/{{period_id}}/calculate",
              "host": ["{{base_url}}"],
              "path": ["api", "payroll", "periods", "{{period_id}}", "calculate"]
            }
          }
        }
      ]
    }
  ]
}
```

**Import into Postman:**
1. Open Postman
2. Click "Import"
3. Upload JSON file
4. Update `base_url` variable as needed

---

## Error Handling Examples

### JavaScript

```typescript
async function safeApiCall() {
  const api = new PayrollApi();

  try {
    const employee = await api.getEmployee(999); // Non-existent
  } catch (error) {
    console.error('Error details:', error.message);
    // Output: Error details: 직원을 찾을 수 없습니다
  }
}
```

### Python

```python
from payroll_api import PayrollApi

api = PayrollApi()

try:
    api.delete_employee(999)
except Exception as e:
    print(f"Error: {e}")
    # Output: Error: 직원을 찾을 수 없습니다
```

### cURL

```bash
# Test 404 error
curl -X GET http://localhost:8000/api/payroll/employees/999

# Response:
# {
#   "detail": "직원을 찾을 수 없습니다"
# }

# Test 400 error
curl -X POST http://localhost:8000/api/payroll/periods \
  -H "Content-Type: application/json" \
  -d '{
    "period_start": "2026-05-25",
    "period_end": "2026-05-19",
    "pay_group": "weekly"
  }'

# Response:
# {
#   "detail": "기간 설정이 잘못되었습니다"
# }
```

---

## Quick Reference Table

| Task | cURL | Python | JavaScript |
|------|------|--------|-----------|
| Create Employee | POST /employees | api.create_employee() | api.createEmployee() |
| List Employees | GET /employees | api.get_employees() | api.getEmployees() |
| Get Employee | GET /employees/{id} | api.get_employee(id) | api.getEmployee(id) |
| Create CA | POST /cash-advance | api.create_cash_advance() | api.createCashAdvance() |
| Log Attendance | POST /attendance | api.create_attendance() | api.createAttendance() |
| Create Period | POST /periods | api.create_payroll_period() | api.createPayrollPeriod() |
| Calculate | POST /periods/{id}/calculate | api.calculate_payroll(id) | api.calculatePayroll(id) |
| Approve | POST /periods/{id}/approve | api.approve_payroll_period(id) | api.approvePayrollPeriod(id) |

---

**Last Updated:** 2026-05-21  
**Version:** 1.0.0

