'use client';

/**
 * 📌 메뉴 이동 시 캐시 삭제
 * 📋 페이지 변경 감지 & 캐시 초기화
 * 🔧 localStorage, sessionStorage, IndexedDB 정리
 * 📅 작성일: 2026-06-05
 */

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { db } from '@/lib/db/localDb';

export function useCacheClear() {
  const pathname = usePathname();

  useEffect(() => {
    console.log('🧹 캐시 삭제 시작 - 경로 변경:', pathname);

    // 1️⃣ localStorage 정리
    const localStorageKeys = [
      'elspa_backup_data',
      'selected_date',
      'booking_cache',
      'therapist_cache',
      'expense_cache',
    ];

    localStorageKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
        console.log(`  ✅ localStorage 삭제: ${key}`);
      } catch (error) {
        console.warn(`  ⚠️ localStorage 삭제 실패: ${key}`);
      }
    });

    // 2️⃣ sessionStorage 정리
    try {
      sessionStorage.clear();
      console.log('  ✅ sessionStorage 전체 삭제');
    } catch (error) {
      console.warn('  ⚠️ sessionStorage 삭제 실패');
    }

    // 3️⃣ IndexedDB 정리 (선택사항)
    // 주의: 모든 데이터를 삭제할 수 있으므로 필요한 것만 삭제
    const clearIndexedDB = async () => {
      try {
        // 특정 테이블만 비우기
        await db.expenseRecords.clear();
        console.log('  ✅ IndexedDB expense_records 삭제');

        await db.attendanceLogs.clear(); // 출근(체크인) 로그 테이블 (therapistCheckIn 은 존재하지 않음)
        console.log('  ✅ IndexedDB attendance_logs 삭제');
      } catch (error) {
        console.warn('  ⚠️ IndexedDB 삭제 실패:', error);
      }
    };

    clearIndexedDB();

    console.log('🎉 캐시 정리 완료');
  }, [pathname]);

  return null;
}
