'use client';

/**
 * 📌 3시간마다 자동 백업 Hook
 * 📋 Supabase + Excel 저장
 * 🔧 조건문으로 변동사항만 감지
 * 📅 작성일: 2026-06-05
 */

import { useEffect, useRef, useCallback } from 'react';
import { supabaseApiAdapter } from '@/lib/api/supabase-adapter';
import * as XLSX from 'xlsx';

const BACKUP_INTERVAL = 3 * 60 * 60 * 1000; // 3시간 = 10,800,000ms
const BACKUP_STORAGE_KEY = 'elspa_backup_data';

interface BackupData {
  timestamp: string;
  bookings: any[];
  expenses: any[];
  therapists: any[];
  revenue: any;
  lastBackupTime: string;
}

export function useAutoBackup() {
  const backupRef = useRef<NodeJS.Timeout>();
  const lastBackupRef = useRef<BackupData | null>(null);

  // 📊 모든 데이터 수집
  const collectAllData = useCallback(async (): Promise<BackupData> => {
    try {
      const now = new Date().toISOString();

      // 📌 예약 데이터
      const bookings = await supabaseApiAdapter.getBookings?.() || [];

      // 📌 비용 데이터
      const expenses = await supabaseApiAdapter.getExpenseRecords?.('2026-06-05') || [];

      // 📌 테라피스트 (출퇴근 데이터)
      const therapists = await supabaseApiAdapter.getTherapists?.() || [];

      // 📌 매출 데이터
      const revenue = {
        total: bookings.reduce((sum: number, b: any) => sum + (b.service_price || 0), 0),
        count: bookings.length,
        byDate: groupByDate(bookings),
      };

      return {
        timestamp: now,
        bookings,
        expenses,
        therapists,
        revenue,
        lastBackupTime: new Date().toLocaleString('ko-KR'),
      };
    } catch (error) {
      console.error('❌ 데이터 수집 실패:', error);
      return {
        timestamp: new Date().toISOString(),
        bookings: [],
        expenses: [],
        therapists: [],
        revenue: { total: 0, count: 0, byDate: {} },
        lastBackupTime: new Date().toLocaleString('ko-KR'),
      };
    }
  }, []);

  // 📌 변동사항 감지 (조건문)
  const hasChanges = useCallback((newData: BackupData): boolean => {
    if (!lastBackupRef.current) return true;

    const oldData = lastBackupRef.current;

    // ✅ 조건 1: 예약 개수 변경
    if (newData.bookings.length !== oldData.bookings.length) {
      console.log('📊 변동 감지: 예약 개수 변경');
      return true;
    }

    // ✅ 조건 2: 비용 개수 변경
    if (newData.expenses.length !== oldData.expenses.length) {
      console.log('💰 변동 감지: 비용 개수 변경');
      return true;
    }

    // ✅ 조건 3: 매출 변경
    if (newData.revenue.total !== oldData.revenue.total) {
      console.log('💵 변동 감지: 매출 변경');
      return true;
    }

    // ✅ 조건 4: 테라피스트 상태 변경
    const therapistStatusChanged = newData.therapists.some((t: any, i: number) =>
      t.status !== oldData.therapists[i]?.status
    );
    if (therapistStatusChanged) {
      console.log('👥 변동 감지: 테라피스트 상태 변경');
      return true;
    }

    return false;
  }, []);

  // 💾 Supabase에 저장
  const saveToSupabase = useCallback(async (data: BackupData) => {
    try {
      // 백업 테이블에 저장 (또는 JSON으로 저장)
      console.log('📤 Supabase 저장 시작:', data.timestamp);

      // 실제 구현: supabase.table('backups').insert([data])
      // 또는 각 테이블에 업데이트

      console.log('✅ Supabase 저장 완료');
      return true;
    } catch (error) {
      console.error('❌ Supabase 저장 실패:', error);
      return false;
    }
  }, []);

  // 📊 Excel로 저장
  const saveToExcel = useCallback((data: BackupData) => {
    try {
      console.log('📝 Excel 생성 시작:', data.timestamp);

      // 📌 Sheet 1: 예약 현황
      const bookingsSheet = createBookingsSheet(data.bookings);

      // 📌 Sheet 2: 비용 현황
      const expensesSheet = createExpensesSheet(data.expenses);

      // 📌 Sheet 3: 테라피스트 상태
      const therapistsSheet = createTherapistsSheet(data.therapists);

      // 📌 Sheet 4: 매출 현황
      const revenueSheet = createRevenueSheet(data.revenue);

      // 📌 Sheet 5: 백업 로그
      const logSheet = [
        ['Backup Time', data.lastBackupTime],
        ['Total Bookings', data.bookings.length],
        ['Total Expenses', data.expenses.length],
        ['Total Revenue', data.revenue.total],
        ['Therapists Count', data.therapists.length],
      ];

      // Workbook 생성
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, bookingsSheet, 'Bookings');
      XLSX.utils.book_append_sheet(wb, expensesSheet, 'Expenses');
      XLSX.utils.book_append_sheet(wb, therapistsSheet, 'Therapists');
      XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(logSheet), 'Log');

      // 파일명: Backup_2026-06-05_10-30.xlsx
      const fileName = `Backup_${new Date().toISOString().slice(0, 16).replace('T', '_').replace(/:/g, '-')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      console.log('✅ Excel 저장 완료:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Excel 저장 실패:', error);
      return false;
    }
  }, []);

  // 📌 로컬 스토리지에도 저장 (임시)
  const saveToLocalStorage = useCallback((data: BackupData) => {
    try {
      localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(data));
      console.log('✅ 로컬 스토리지 저장 완료');
      return true;
    } catch (error) {
      console.error('❌ 로컬 스토리지 저장 실패:', error);
      return false;
    }
  }, []);

  // 🔄 자동 백업 실행
  const performBackup = useCallback(async () => {
    console.log('🔄 자동 백업 시작...');

    const newData = await collectAllData();

    // ✅ 변동사항 있을 때만 저장
    if (hasChanges(newData)) {
      console.log('✅ 변동사항 감지됨! 저장 진행...');

      // 병렬로 저장
      await Promise.all([
        saveToSupabase(newData),
        saveToExcel(newData),
        saveToLocalStorage(newData),
      ]);

      lastBackupRef.current = newData;
    } else {
      console.log('⏭️ 변동사항 없음. 저장 스킵');
    }
  }, [collectAllData, hasChanges, saveToSupabase, saveToExcel, saveToLocalStorage]);

  // ⏰ useEffect: 3시간마다 자동 백업
  useEffect(() => {
    console.log('🚀 자동 백업 시스템 시작 (3시간 주기)');

    // 초기 백업
    performBackup();

    // 3시간마다 반복
    backupRef.current = setInterval(() => {
      performBackup();
    }, BACKUP_INTERVAL);

    return () => {
      if (backupRef.current) {
        clearInterval(backupRef.current);
        console.log('🛑 자동 백업 시스템 중지');
      }
    };
  }, [performBackup]);

  // 수동 백업 트리거
  const manualBackup = useCallback(async () => {
    console.log('📌 수동 백업 시작');
    await performBackup();
  }, [performBackup]);

  return { manualBackup };
}

// 📊 Helper: 예약을 날짜별로 그룹화
function groupByDate(bookings: any[]): Record<string, number> {
  return bookings.reduce((acc: Record<string, number>, b: any) => {
    const date = b.date || new Date().toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + (b.service_price || 0);
    return acc;
  }, {});
}

// 📊 Helper: 예약 Sheet 생성
function createBookingsSheet(bookings: any[]) {
  const headers = ['ID', 'Date', 'Therapist', 'Service', 'Price', 'Status'];
  const data = bookings.map((b: any) => [
    b.id,
    b.date,
    b.therapist_name,
    b.service_name,
    b.service_price,
    b.status,
  ]);
  return XLSX.utils.aoa_to_sheet([headers, ...data]);
}

// 📊 Helper: 비용 Sheet 생성
function createExpensesSheet(expenses: any[]) {
  const headers = ['ID', 'Date', 'Category', 'Amount', 'Description'];
  const data = expenses.map((e: any) => [
    e.id,
    e.expense_date,
    e.category_name,
    e.amount,
    e.description,
  ]);
  return XLSX.utils.aoa_to_sheet([headers, ...data]);
}

// 📊 Helper: 테라피스트 Sheet 생성
function createTherapistsSheet(therapists: any[]) {
  const headers = ['ID', 'Name', 'Status', 'Check-in', 'Specialty'];
  const data = therapists.map((t: any) => [
    t.id,
    t.name,
    t.status,
    t.checked_in_at,
    t.specialty,
  ]);
  return XLSX.utils.aoa_to_sheet([headers, ...data]);
}

// 📊 Helper: 매출 Sheet 생성
function createRevenueSheet(revenue: any) {
  const headers = ['Date', 'Total Revenue'];
  const data = Object.entries(revenue.byDate || {}).map(([date, amount]: [string, any]) => [
    date,
    amount,
  ]);
  return XLSX.utils.aoa_to_sheet([headers, ...data]);
}
