/**
 * 📌 Offline Storage Hook (IndexedDB)
 * 📋 목적: 오프라인 상황에서 재무 데이터 임시 저장
 * 🔧 포함: 비동기 저장, 동기화 추적
 */

import { useEffect, useState } from 'react';

export interface StoredExpense {
  id: string;
  amount: number;
  categoryId: number;
  expenseDate: string;
  description: string;
  synced: boolean;
  createdAt: number;
}

interface OfflineStorageReturn {
  isReady: boolean;
  saveExpenseOffline: (expense: Omit<StoredExpense, 'synced' | 'createdAt'>) => Promise<void>;
  getUnsyncedExpenses: () => Promise<StoredExpense[]>;
  markAsSynced: (expenseId: string) => Promise<void>;
  clearSyncedExpenses: () => Promise<void>;
  getStorageStats: () => Promise<{ total: number; synced: number; unsynced: number }>;
}

export function useOfflineStorage(): OfflineStorageReturn {
  const [db, setDb] = useState<IDBDatabase | null>(null);
  const [isReady, setIsReady] = useState(false);

  // IndexedDB 초기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const openDB = async () => {
      return new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('ElSpaFinancial', 1);

        request.onupgradeneeded = (e) => {
          const database = (e.target as IDBOpenDBRequest).result;

          if (!database.objectStoreNames.contains('expenses')) {
            const store = database.createObjectStore('expenses', { keyPath: 'id' });
            store.createIndex('synced', 'synced', { unique: false });
            store.createIndex('categoryId', 'categoryId', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          reject(new Error('Failed to open IndexedDB'));
        };
      });
    };

    openDB()
      .then((database) => {
        setDb(database);
        setIsReady(true);
      })
      .catch((err) => {
        console.error('IndexedDB initialization failed:', err);
        setIsReady(false);
      });

    return () => {
      if (db) db.close();
    };
  }, []);

  const saveExpenseOffline = async (expense: Omit<StoredExpense, 'synced' | 'createdAt'>) => {
    if (!db) throw new Error('IndexedDB not ready');

    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      const store = tx.objectStore('expenses');

      const storedExpense: StoredExpense = {
        ...expense,
        synced: false,
        createdAt: Date.now(),
      };

      const request = store.add(storedExpense);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save expense offline'));
    });
  };

  const getUnsyncedExpenses = async (): Promise<StoredExpense[]> => {
    if (!db) throw new Error('IndexedDB not ready');

    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readonly');
      const store = tx.objectStore('expenses');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(false));

      const result: StoredExpense[] = [];

      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          result.push(cursor.value as StoredExpense);
          cursor.continue();
        } else {
          resolve(result);
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve unsynced expenses'));
      };
    });
  };

  const markAsSynced = async (expenseId: string): Promise<void> => {
    if (!db) throw new Error('IndexedDB not ready');

    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      const store = tx.objectStore('expenses');
      const getRequest = store.get(expenseId);

      getRequest.onsuccess = () => {
        const expense = getRequest.result as StoredExpense;
        if (expense) {
          const updateRequest = store.put({ ...expense, synced: true });
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(new Error('Failed to mark as synced'));
        } else {
          reject(new Error('Expense not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to retrieve expense'));
      };
    });
  };

  const clearSyncedExpenses = async (): Promise<void> => {
    if (!db) throw new Error('IndexedDB not ready');

    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readwrite');
      const store = tx.objectStore('expenses');
      const index = store.index('synced');
      const request = index.openCursor(IDBKeyRange.only(true));

      const expensesToDelete: string[] = [];

      request.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest).result;
        if (cursor) {
          expensesToDelete.push(cursor.primaryKey as string);
          cursor.continue();
        } else {
          // 모든 동기화된 지출 삭제
          if (expensesToDelete.length === 0) {
            resolve();
            return;
          }

          let deleteCount = 0;
          expensesToDelete.forEach((id) => {
            const deleteReq = store.delete(id);
            deleteReq.onsuccess = () => {
              deleteCount++;
              if (deleteCount === expensesToDelete.length) {
                resolve();
              }
            };
            deleteReq.onerror = () => reject(new Error('Failed to delete synced expense'));
          });
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to clear synced expenses'));
      };
    });
  };

  const getStorageStats = async (): Promise<{ total: number; synced: number; unsynced: number }> => {
    if (!db) throw new Error('IndexedDB not ready');

    return new Promise((resolve, reject) => {
      const tx = db.transaction('expenses', 'readonly');
      const store = tx.objectStore('expenses');
      const request = store.getAll();

      request.onsuccess = () => {
        const expenses = request.result as StoredExpense[];
        const synced = expenses.filter((e) => e.synced).length;
        const unsynced = expenses.filter((e) => !e.synced).length;

        resolve({
          total: expenses.length,
          synced,
          unsynced,
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to get storage stats'));
      };
    });
  };

  return {
    isReady,
    saveExpenseOffline,
    getUnsyncedExpenses,
    markAsSynced,
    clearSyncedExpenses,
    getStorageStats,
  };
}
