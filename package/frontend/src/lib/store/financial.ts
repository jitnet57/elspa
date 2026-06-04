/**
 * 📌 Zustand Financial Dashboard Store
 * 📋 목적: 경영지표자료 대시보드의 매출, 지출, 예산 데이터 상태 관리
 * 🔧 포함: monthlyRevenue, expenses, categories, budget
 */

import { create } from 'zustand';

export interface ExpenseCategory {
  id: number;
  name: string;
  categoryType: string;
  description?: string;
  isActive: boolean;
}

export interface Expense {
  id: number;
  categoryId: number;
  amount: number;
  expenseDate: string;
  description?: string;
  receiptUrl?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyRevenue {
  id: number;
  year: number;
  month: number;
  totalRevenue: number;
  therapistCommission: number;
  companyCommission: number;
  walkupRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: number;
  year: number;
  month: number;
  targetRevenue: number;
  expenseLimit: number;
  salaryBudget?: number;
  indirectCostsBudget?: number;
  benefitsBudget?: number;
  otherBudget?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialState {
  // Data
  monthlyRevenues: MonthlyRevenue[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  budgets: Budget[];
  selectedYear: number;
  selectedMonth: number;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setMonthlyRevenues: (revenues: MonthlyRevenue[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  setCategories: (categories: ExpenseCategory[]) => void;
  setBudgets: (budgets: Budget[]) => void;

  addExpense: (expense: Expense) => void;
  updateExpense: (expenseId: number, expense: Partial<Expense>) => void;
  deleteExpense: (expenseId: number) => void;

  addCategory: (category: ExpenseCategory) => void;
  setBudget: (budget: Budget) => void;

  setSelectedPeriod: (year: number, month?: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getTotalExpenses: () => number;
  getTotalRevenue: () => number;
  getExpensesByCategory: () => Record<string, number>;
  getProfitMargin: () => number;
}

export const useFinancialStore = create<FinancialState>((set, get) => ({
  // Initial state
  monthlyRevenues: [],
  expenses: [],
  categories: [],
  budgets: [],
  selectedYear: new Date().getFullYear(),
  selectedMonth: new Date().getMonth() + 1,
  isLoading: false,
  error: null,

  // 💾 Data setters
  setMonthlyRevenues: (revenues) => set({ monthlyRevenues: revenues }),
  setExpenses: (expenses) => set({ expenses }),
  setCategories: (categories) => set({ categories }),
  setBudgets: (budgets) => set({ budgets }),

  // ➕ Add/Update/Delete expense
  addExpense: (expense) =>
    set((state) => ({
      expenses: [...state.expenses, expense],
    })),

  updateExpense: (expenseId, updates) =>
    set((state) => ({
      expenses: state.expenses.map((e) =>
        e.id === expenseId ? { ...e, ...updates } : e
      ),
    })),

  deleteExpense: (expenseId) =>
    set((state) => ({
      expenses: state.expenses.filter((e) => e.id !== expenseId),
    })),

  // 📂 Category & Budget
  addCategory: (category) =>
    set((state) => ({
      categories: [...state.categories, category],
    })),

  setBudget: (budget) =>
    set((state) => ({
      budgets: [
        ...state.budgets.filter(
          (b) => !(b.year === budget.year && b.month === budget.month)
        ),
        budget,
      ],
    })),

  // 📅 Period selection
  setSelectedPeriod: (year, month) =>
    set({
      selectedYear: year,
      selectedMonth: month || new Date().getMonth() + 1,
    }),

  // ⚙️ Loading & error
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // 📊 Computed values
  getTotalExpenses: () => {
    const state = get();
    const startDate = new Date(state.selectedYear, state.selectedMonth - 1, 1);
    const endDate = new Date(state.selectedYear, state.selectedMonth, 0);

    return state.expenses
      .filter((e) => {
        const expenseDate = new Date(e.expenseDate);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .reduce((sum, e) => sum + e.amount, 0);
  },

  getTotalRevenue: () => {
    const state = get();
    const revenue = state.monthlyRevenues.find(
      (r) => r.year === state.selectedYear && r.month === state.selectedMonth
    );
    return revenue?.totalRevenue ?? 0;
  },

  getExpensesByCategory: () => {
    const state = get();
    const startDate = new Date(state.selectedYear, state.selectedMonth - 1, 1);
    const endDate = new Date(state.selectedYear, state.selectedMonth, 0);

    const grouped: Record<string, number> = {};

    state.expenses
      .filter((e) => {
        const expenseDate = new Date(e.expenseDate);
        return expenseDate >= startDate && expenseDate <= endDate;
      })
      .forEach((e) => {
        const category = state.categories.find((c) => c.id === e.categoryId);
        const categoryName = category?.name || 'Unknown';
        grouped[categoryName] = (grouped[categoryName] ?? 0) + e.amount;
      });

    return grouped;
  },

  getProfitMargin: () => {
    const state = get();
    const revenue = state.monthlyRevenues.find(
      (r) => r.year === state.selectedYear && r.month === state.selectedMonth
    );

    if (!revenue || revenue.totalRevenue === 0) return 0;

    const expenses = get().getTotalExpenses();
    const profit = revenue.totalRevenue - expenses;
    return (profit / revenue.totalRevenue) * 100;
  },
}));
