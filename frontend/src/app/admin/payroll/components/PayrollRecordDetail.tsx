import React, { useState } from 'react';
import { ArrowLeft, Printer, Download, CheckCircle, XCircle } from 'lucide-react';

interface PayrollDetail {
  id: string;
  name: string;
  employeeId: string;
  status: 'Permanent Staff' | 'Part-time' | 'Contractor';
  hireDate: string;
  department: string;
  period: string;
  earnings: {
    baseSalary: number;
    commission: number;
    overtime: number;
    holidayBonus: number;
    mealAllowance: number;
  };
  deductions: {
    late: number;
    absence: number;
    sssLoan: number;
    cashAdvance: number;
    healthCheck: number;
    thirteenthMonth: number;
  };
}

const mockDetail: PayrollDetail = {
  id: '2024-0082',
  name: 'Maria Christina Santos',
  employeeId: '2024-0082',
  status: 'Permanent Staff',
  hireDate: 'Jan 12, 2022',
  department: 'Therapy & Wellness',
  period: 'Oct 1, 2024 – Oct 15, 2024',
  earnings: {
    baseSalary: 15500,
    commission: 4250.5,
    overtime: 1120.25,
    holidayBonus: 0,
    mealAllowance: 750,
  },
  deductions: {
    late: 145,
    absence: 0,
    sssLoan: 500,
    cashAdvance: 1000,
    healthCheck: 0,
    thirteenthMonth: 0,
  },
};

export default function PayrollRecordDetail() {
  const [record] = useState(mockDetail);

  const grossPay =
    record.earnings.baseSalary +
    record.earnings.commission +
    record.earnings.overtime +
    record.earnings.holidayBonus +
    record.earnings.mealAllowance;

  const totalDeductions =
    record.deductions.late +
    record.deductions.absence +
    record.deductions.sssLoan +
    record.deductions.cashAdvance +
    record.deductions.healthCheck +
    record.deductions.thirteenthMonth;

  const netPay = grossPay - totalDeductions;

  return (
    <div className="min-h-screen bg-surface pb-16">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <button className="text-primary p-2 hover:bg-surface-container-high rounded-full transition md:hidden">
            <span>☰</span>
          </button>
          <h1 className="text-xl font-bold text-primary">ElSpa Payroll</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-body-md text-on-surface-variant hidden md:block">Admin Controller</span>
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxhfYielMwYvx2hiT6f95h_yBbGpSnpQFHYv8fyKo-CB9xZiWH-uJWUbkIaMX3-2nPcvfRFFr5wgnJdxpXKlzEmG5_1mUpXtkNeJg2y70BqL_4_IjiXKMUAw5Lozs_hQpYFE_ObaOfqq45AmC-GQjOPVjpGFPK6N6qmn8w1aJ8f4OxPeSHqhYqlIhkGZ5eIgEelMlmks2jRB_BnPbjmumNCkjzUNXPalEsSqhcYMgNE_3ZOANLLM1InNptM9F2hzvIo1XSS6lUHfRM"
            alt="Profile"
            className="w-8 h-8 rounded-full"
          />
        </div>
      </header>

      <main className="pt-24 pb-8 px-6 max-w-5xl mx-auto">
        {/* Employee Profile Header */}
        <section className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-primary-container text-on-primary-container text-label-sm font-bold rounded uppercase">
                {record.status}
              </span>
              <span className="text-label-sm text-outline">ID: {record.employeeId}</span>
            </div>
            <h2 className="text-4xl font-bold text-on-surface mb-2">{record.name}</h2>
            <p className="text-body-lg text-on-surface-variant flex items-center gap-1">
              <span>📅</span> Pay Period: {record.period}
            </p>
          </div>
          <div className="border-l md:border-l-0 md:border-r border-outline-variant pl-4 md:pl-0 md:pr-4 text-right">
            <p className="text-label-sm text-outline uppercase tracking-widest">Hire Date</p>
            <p className="text-body-lg font-bold mb-3">{record.hireDate}</p>
            <p className="text-label-sm text-outline uppercase tracking-widest">Department</p>
            <p className="text-body-md">{record.department}</p>
          </div>
        </section>

        {/* Bento Grid: Earnings + Deductions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* EARNINGS */}
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="bg-surface-container-high px-4 py-3 border-b border-outline-variant flex gap-2">
              <span className="text-primary">💰</span>
              <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
                Earnings / Income
              </h3>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-body-md">
                <tbody>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Base Salary</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold">
                      ₱{record.earnings.baseSalary.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Commission (Service)</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold">
                      ₱{record.earnings.commission.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Overtime (8.5 hrs)</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold">
                      ₱{record.earnings.overtime.toLocaleString('en-PH', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Holiday Bonus</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold">
                      ₱{record.earnings.holidayBonus.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="even:bg-surface">
                    <td className="px-4 py-3">Meal Allowance</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold">
                      ₱{record.earnings.mealAllowance.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
              <span className="text-label-sm font-bold text-on-surface-variant">SUBTOTAL GROSS</span>
              <span className="text-2xl font-bold text-primary font-data-mono">
                ₱{grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* DEDUCTIONS */}
          <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden flex flex-col shadow-sm">
            <div className="bg-surface-container-high px-4 py-3 border-b border-outline-variant flex gap-2">
              <span className="text-error">💸</span>
              <h3 className="text-label-sm font-bold text-on-surface-variant uppercase tracking-widest">
                Deductions
              </h3>
            </div>
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-body-md">
                <tbody>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Late / Tardy</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold text-error">
                      ₱{record.deductions.late.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Absence (1 Day)</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold text-error">
                      ₱{record.deductions.absence.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">SSS Loan Payment</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold text-error">
                      ₱{record.deductions.sssLoan.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Cash Advance Repay</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold text-error">
                      ₱{record.deductions.cashAdvance.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-outline-variant even:bg-surface">
                    <td className="px-4 py-3">Health Check Surcharge</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold text-error">
                      ₱{record.deductions.healthCheck.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="even:bg-surface">
                    <td className="px-4 py-3">13th Month Adjustment</td>
                    <td className="px-4 py-3 text-right font-data-mono font-bold text-error">
                      ₱{record.deductions.thirteenthMonth.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
              <span className="text-label-sm font-bold text-on-surface-variant">SUBTOTAL DEDUCTIONS</span>
              <span className="text-2xl font-bold text-error font-data-mono">
                ₱{totalDeductions.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* NET PAY HIGHLIGHT */}
        <section className="bg-primary text-on-primary p-6 rounded-2xl shadow-lg border border-primary-container mb-8">
          <p className="text-label-sm font-bold uppercase tracking-widest mb-2 opacity-90">Your Take-Home</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h3 className="text-5xl font-bold font-data-mono">
                ₱{netPay.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
              <p className="text-sm opacity-90 mt-1">NET PAY (After All Deductions)</p>
            </div>
            <div className="text-sm space-y-1 text-right">
              <div className="flex justify-between gap-4">
                <span className="opacity-90">Gross Pay:</span>
                <span className="font-bold">₱{grossPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="opacity-90">Deductions:</span>
                <span className="font-bold">-₱{totalDeductions.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 md:flex-row md:justify-between">
          <div className="flex gap-3 md:order-last">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-11 border border-outline-variant rounded-2xl hover:bg-surface-container transition">
              <ArrowLeft size={18} />
              <span className="text-body-md font-bold">Back</span>
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 h-11 border border-outline-variant rounded-2xl hover:bg-surface-container transition">
              <Printer size={18} />
              <span className="text-body-md font-bold">Print</span>
            </button>
          </div>
          <button className="flex items-center justify-center gap-2 px-8 h-11 bg-primary text-on-primary rounded-2xl hover:opacity-90 transition font-bold md:order-first">
            <Download size={18} />
            Download PDF
          </button>
        </div>

        {/* Approval Section (if not paid) */}
        <div className="mt-8 p-6 bg-surface-container-low rounded-2xl border border-outline-variant">
          <p className="text-body-md text-on-surface-variant mb-4">Record Status: <span className="font-bold text-primary">Pending Approval</span></p>
          <div className="flex gap-3">
            <button className="flex items-center justify-center gap-2 px-6 h-11 bg-green-600 text-white rounded-2xl hover:opacity-90 transition font-bold">
              <CheckCircle size={18} />
              Approve
            </button>
            <button className="flex items-center justify-center gap-2 px-6 h-11 bg-error text-on-error rounded-2xl hover:opacity-90 transition font-bold">
              <XCircle size={18} />
              Reject
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
