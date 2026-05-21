/**
 * 📌 Form Validation Hook
 * 📋 목적: 실시간 폼 검증 및 에러 추적
 * 🔧 포함: 필드 검증, 에러 메시지, 폼 상태
 */

import { useState, useCallback } from 'react';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
}

export interface ValidationRules {
  [field: string]: ValidationRule;
}

export interface ValidationState {
  [field: string]: {
    value: any;
    error: string | null;
    touched: boolean;
  };
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

export function useFormValidation(initialValues: Record<string, any>, rules: ValidationRules) {
  const [state, setState] = useState<ValidationState>(() => {
    const initial: ValidationState = {};
    Object.keys(initialValues).forEach((field) => {
      initial[field] = {
        value: initialValues[field],
        error: null,
        touched: false,
      };
    });
    return initial;
  });

  const validateField = useCallback(
    (field: string, value: any): string | null => {
      const rule = rules[field];
      if (!rule) return null;

      // Required
      if (rule.required && !value) {
        return `${field}는 필수 입력 항목입니다`;
      }

      if (!value) return null;

      // String length
      if (typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          return `최소 ${rule.minLength}자 이상이어야 합니다`;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return `최대 ${rule.maxLength}자 이하여야 합니다`;
        }
      }

      // Number range
      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          return `${rule.min} 이상이어야 합니다`;
        }
        if (rule.max !== undefined && value > rule.max) {
          return `${rule.max} 이하여야 합니다`;
        }
      }

      // Pattern (regex)
      if (rule.pattern && !rule.pattern.test(String(value))) {
        return `유효한 형식이 아닙니다`;
      }

      // Custom validator
      if (rule.custom) {
        const result = rule.custom(value);
        if (result !== true) {
          return typeof result === 'string' ? result : '검증 실패';
        }
      }

      return null;
    },
    [rules]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;

      setState((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          value: type === 'number' ? parseFloat(value) : value,
          error: null,
        },
      }));
    },
    []
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name } = e.target;
      const value = state[name]?.value;
      const error = validateField(name, value);

      setState((prev) => ({
        ...prev,
        [name]: {
          ...prev[name],
          error,
          touched: true,
        },
      }));
    },
    [state, validateField]
  );

  const setFieldValue = useCallback(
    (field: string, value: any) => {
      setState((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          value,
          error: null,
        },
      }));
    },
    []
  );

  const setFieldError = useCallback((field: string, error: string | null) => {
    setState((prev) => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);

  const getFormData = useCallback((): Record<string, any> => {
    const data: Record<string, any> = {};
    Object.keys(state).forEach((field) => {
      data[field] = state[field].value;
    });
    return data;
  }, [state]);

  const getValidationResult = useCallback((): FormValidationResult => {
    const errors: Record<string, string> = {};
    const touched: Record<string, boolean> = {};

    Object.keys(state).forEach((field) => {
      const fieldState = state[field];
      if (fieldState.error) {
        errors[field] = fieldState.error;
      }
      touched[field] = fieldState.touched;
    });

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      touched,
    };
  }, [state]);

  const validateAll = useCallback((): boolean => {
    const newState = { ...state };

    Object.keys(rules).forEach((field) => {
      const value = state[field]?.value;
      const error = validateField(field, value);

      if (!newState[field]) {
        newState[field] = { value, error: null, touched: false };
      }

      newState[field].error = error;
      newState[field].touched = true;
    });

    setState(newState);

    const hasErrors = Object.values(newState).some((field) => field.error);
    return !hasErrors;
  }, [state, rules, validateField]);

  const reset = useCallback(() => {
    const initial: ValidationState = {};
    Object.keys(initialValues).forEach((field) => {
      initial[field] = {
        value: initialValues[field],
        error: null,
        touched: false,
      };
    });
    setState(initial);
  }, [initialValues]);

  return {
    state,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    getFormData,
    getValidationResult,
    validateAll,
    reset,
  };
}
