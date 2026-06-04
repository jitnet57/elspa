'use client';

/**
 * 📌 Expense Form Component
 * 📋 목적: 지출 항목 추가/수정 폼
 * 🔧 포함: 실시간 검증, 에러 표시, 제출 처리
 */

import { useState } from 'react';
import { useFinancialStore } from '@/lib/store/financial';
import { useFormValidation, ValidationRules } from '@/hooks/financial/useFormValidation';
import { FinancialErrorHandler } from '@/lib/errors/financial-errors';

interface ExpenseFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({ initialData, onSuccess, onCancel }: ExpenseFormProps) {
  const store = useFinancialStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validationRules: ValidationRules = {
    category_id: { required: true },
    amount: {
      required: true,
      min: 0.01,
      custom: (v) => {
        if (isNaN(v) || v <= 0) return '금액은 0보다 커야 합니다';
        if (v > 999999999) return '금액이 너무 큽니다';
        return true;
      },
    },
    expense_date: { required: true },
    description: { maxLength: 500 },
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
    initialData || {
      category_id: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
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
        categoryId: parseInt(formData.category_id),
        amount: parseFloat(formData.amount),
        expenseDate: new Date(formData.expense_date).toISOString(),
        description: formData.description || undefined,
      };

      // API call would go here
      // For now, update store directly
      if (initialData?.id) {
        // Update
        store.addExpense({
          ...initialData,
          ...payload,
        });
      } else {
        // Create
        store.addExpense({
          id: Date.now(),
          ...payload,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {submitError && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
          ❌ {submitError}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category_id"
          value={state.category_id?.value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            state.category_id?.error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        >
          <option value="">Select category...</option>
          {store.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {state.category_id?.error && (
          <p className="text-red-500 text-xs mt-1">{state.category_id.error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Amount <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-2">
          <span className="text-gray-600">₱</span>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={state.amount?.value || ''}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              state.amount?.error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
        </div>
        {state.amount?.error && (
          <p className="text-red-500 text-xs mt-1">{state.amount.error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="expense_date"
          value={state.expense_date?.value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            state.expense_date?.error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {state.expense_date?.error && (
          <p className="text-red-500 text-xs mt-1">{state.expense_date.error}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          placeholder="Expense description (max 500 characters)"
          rows={3}
          value={state.description?.value || ''}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            state.description?.error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          {state.description?.error && (
            <span className="text-red-500">{state.description.error}</span>
          )}
          <span className="ml-auto">
            {(state.description?.value || '').length}/500
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
        )}
      </div>
    </form>
  );
}
