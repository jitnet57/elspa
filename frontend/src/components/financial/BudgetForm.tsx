'use client';

/**
 * 📌 Budget Form Component
 * 📋 목적: 예산 설정 및 수정 폼
 * 🔧 포함: 월/연도 선택, 예산 금액, 검증
 */

import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/financial';
import { useFormValidation, ValidationRules } from '@/hooks/financial/useFormValidation';
import { FinancialErrorHandler } from '@/lib/errors/financial-errors';

interface BudgetFormProps {
  year?: number;
  month?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetForm({ year, month, onSuccess, onCancel }: BudgetFormProps) {
  const store = useFinancialStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentYear = year || new Date().getFullYear();
  const currentMonth = month || new Date().getMonth() + 1;

  const validationRules: ValidationRules = {
    year: {
      required: true,
      min: 2000,
      max: 2100,
    },
    month: {
      required: true,
      min: 1,
      max: 12,
    },
    target_revenue: {
      required: true,
      min: 0,
    },
    expense_limit: {
      required: true,
      min: 0,
    },
    salary_budget: { min: 0 },
    indirect_costs_budget: { min: 0 },
    benefits_budget: { min: 0 },
    other_budget: { min: 0 },
  };

  const {
    state,
    handleChange,
    handleBlur,
    setFieldError,
    getFormData,
    validateAll,
    reset,
  } = useFormValidation(
    {
      year: currentYear,
      month: currentMonth,
      target_revenue: '',
      expense_limit: '',
      salary_budget: '',
      indirect_costs_budget: '',
      benefits_budget: '',
      other_budget: '',
    },
    validationRules
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateAll()) {
      setSubmitError('Please fix the validation errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = getFormData();
      const payload = {
        year: parseInt(formData.year),
        month: parseInt(formData.month),
        targetRevenue: parseFloat(formData.target_revenue || '0'),
        expenseLimit: parseFloat(formData.expense_limit || '0'),
        salaryBudget: formData.salary_budget ? parseFloat(formData.salary_budget) : undefined,
        indirectCostsBudget: formData.indirect_costs_budget ? parseFloat(formData.indirect_costs_budget) : undefined,
        benefitsBudget: formData.benefits_budget ? parseFloat(formData.benefits_budget) : undefined,
        otherBudget: formData.other_budget ? parseFloat(formData.other_budget) : undefined,
      };

      // API call would go here
      // For now, update store directly
      store.setBudget({
        id: Date.now(),
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      reset();
      onSuccess?.();
    } catch (error: any) {
      const parsed = FinancialErrorHandler.parseError(error);
      const userMsg = FinancialErrorHandler.getUserMessage(parsed);
      setSubmitError(userMsg);

      if (parsed.fieldErrors) {
        Object.entries(parsed.fieldErrors).forEach(([field, msg]) => {
          setFieldError(field, msg as string);
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const BudgetField = ({ name, label }: { name: string; label: string }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <span className="text-gray-600">₱</span>
        <input
          type="number"
          name={name}
          step="1000"
          min="0"
          placeholder="0"
          value={state[name]?.value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            state[name]?.error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
      </div>
      {state[name]?.error && (
        <p className="text-red-500 text-xs mt-1">{state[name].error}</p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
          ❌ {submitError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="year"
            min="2000"
            max="2100"
            value={state.year?.value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              state.year?.error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {state.year?.error && (
            <p className="text-red-500 text-xs mt-1">{state.year.error}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Month <span className="text-red-500">*</span>
          </label>
          <select
            name="month"
            value={state.month?.value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              state.month?.error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={m}>
                {new Date(2026, m - 1).toLocaleString('en-US', { month: 'long' })}
              </option>
            ))}
          </select>
          {state.month?.error && (
            <p className="text-red-500 text-xs mt-1">{state.month.error}</p>
          )}
        </div>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="font-semibold text-gray-900">Budget Allocation</h3>

        <BudgetField name="target_revenue" label="Target Revenue" />
        <BudgetField name="expense_limit" label="Expense Limit" />
        <BudgetField name="salary_budget" label="Salary Budget (Optional)" />
        <BudgetField name="indirect_costs_budget" label="Indirect Costs (Optional)" />
        <BudgetField name="benefits_budget" label="Benefits Budget (Optional)" />
        <BudgetField name="other_budget" label="Other Budget (Optional)" />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? 'Setting...' : 'Set Budget'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
