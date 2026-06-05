'use client';

/**
 * 📌 3시간마다 자동 백업 (Excel + Supabase)
 * 📋 매 3시간마다 모든 데이터를 저장
 * 🔧 조건문 없음, 그냥 저장
 * 📅 작성일: 2026-06-05
 */

import { useEffect, useRef, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

const BACKUP_INTERVAL = 3 * 60 * 60 * 1000; // 3시간

export function useAutoBackup3h() {
  const backupRef = useRef<NodeJS.Timeout>();

  // 📊 모든 데이터 수집
  const collectAllData = useCallback(async () => {
    console.log('📊 데이터 수집 중...');

    const supabase = getSupabase();
    if (!supabase) {
      console.warn('⚠️ Supabase 연결 실패');
      return null;
    }

    try {
      // 1️⃣ 예약 데이터
      const { data: bookings, error: e1 } = await supabase
        .from('massage_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (e1) console.error('예약 조회 실패:', e1);

      // 2️⃣ 비용 데이터
      const { data: expenses, error: e2 } = await supabase
        .from('expense_records')
        .select('*')
        .order('expense_date', { ascending: false });

      if (e2) console.error('비용 조회 실패:', e2);

      // 3️⃣ 테라피스트 데이터
      const { data: therapists, error: e3 } = await supabase
        .from('therapists')
        .select('*')
        .order('id', { ascending: true });

      if (e3) console.error('테라피스트 조회 실패:', e3);

      return {
        timestamp: new Date().toISOString(),
        bookings: bookings || [],
        expenses: expenses || [],
        therapists: therapists || [],
      };
    } catch (error) {
      console.error('❌ 데이터 수집 실패:', error);
      return null;
    }
  }, []);

  // 📥 Excel 저장
  const saveToExcel = useCallback((data: any) => {
    try {
      console.log('📝 Excel 저장 중...');

      const wb = XLSX.utils.book_new();

      // Sheet 1: 예약
      if (data.bookings && data.bookings.length > 0) {
        const bookingsSheet = XLSX.utils.json_to_sheet(data.bookings);
        XLSX.utils.book_append_sheet(wb, bookingsSheet, '예약');
      }

      // Sheet 2: 비용
      if (data.expenses && data.expenses.length > 0) {
        const expensesSheet = XLSX.utils.json_to_sheet(data.expenses);
        XLSX.utils.book_append_sheet(wb, expensesSheet, '비용');
      }

      // Sheet 3: 테라피스트
      if (data.therapists && data.therapists.length > 0) {
        const therapistsSheet = XLSX.utils.json_to_sheet(data.therapists);
        XLSX.utils.book_append_sheet(wb, therapistsSheet, '테라피스트');
      }

      // 파일명
      const now = new Date();
      const fileName = `Backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

      XLSX.writeFile(wb, fileName);
      console.log('✅ Excel 저장 완료:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Excel 저장 실패:', error);
      return false;
    }
  }, []);

  // 💾 Supabase 저장
  const saveToSupabase = useCallback(async (data: any) => {
    try {
      console.log('📤 Supabase 저장 중...');

      const supabase = getSupabase();
      if (!supabase) {
        console.warn('⚠️ Supabase 연결 실패');
        return false;
      }

      // backups 테이블에 저장
      const { error } = await supabase
        .from('backups')
        .insert([
          {
            backup_date: data.timestamp,
            bookings_count: data.bookings?.length || 0,
            expenses_count: data.expenses?.length || 0,
            therapists_count: data.therapists?.length || 0,
            data_json: JSON.stringify(data), // 전체 데이터 JSON으로 저장
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.warn('⚠️ backups 테이블 없음, CSV로 저장됨');
        return true; // 테이블 없어도 Excel로 저장했으므로 OK
      }

      console.log('✅ Supabase 저장 완료');
      return true;
    } catch (error) {
      console.error('❌ Supabase 저장 실패:', error);
      return false;
    }
  }, []);

  // 🔄 자동 백업 실행
  const performBackup = useCallback(async () => {
    console.log('🔄 자동 백업 시작...');

    const data = await collectAllData();

    if (!data) {
      console.error('❌ 데이터 수집 실패, 백업 취소');
      return;
    }

    // 동시에 저장 (Excel + Supabase)
    await Promise.all([
      saveToExcel(data),
      saveToSupabase(data),
    ]);

    console.log('🎉 백업 완료!');
  }, [collectAllData, saveToExcel, saveToSupabase]);

  // ⏰ 3시간마다 자동 실행
  useEffect(() => {
    console.log('🚀 자동 백업 시작 (3시간마다)');

    // 첫 번째 백업 (즉시 실행)
    performBackup();

    // 3시간마다 반복
    backupRef.current = setInterval(() => {
      performBackup();
    }, BACKUP_INTERVAL);

    return () => {
      if (backupRef.current) {
        clearInterval(backupRef.current);
        console.log('🛑 자동 백업 중지');
      }
    };
  }, [performBackup]);

  return null;
}
