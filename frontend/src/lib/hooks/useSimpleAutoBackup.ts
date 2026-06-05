'use client';

/**
 * 📌 3시간마다 자동 백업 (간단 버전)
 * 📋 매 3시간마다 모든 데이터를 Excel로 저장
 * 🔧 조건문 없음, 그냥 저장
 * 📅 작성일: 2026-06-05
 */

import { useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';

const BACKUP_INTERVAL = 3 * 60 * 60 * 1000; // 3시간

export function useSimpleAutoBackup() {
  const backupRef = useRef<NodeJS.Timeout>();

  // 📊 데이터 수집 (간단함)
  const collectData = useCallback(async () => {
    try {
      // Supabase에서 직접 데이터 조회
      const response = await fetch('/api/data', { method: 'GET' });
      const data = await response.json();
      return data;
    } catch (error) {
      console.log('⚠️ API 없음, 로컬 데이터 사용');
      return {
        bookings: [],
        expenses: [],
        therapists: [],
        revenue: 0,
      };
    }
  }, []);

  // 📥 Excel로 저장 (매우 간단)
  const saveExcel = useCallback(async () => {
    console.log('💾 Excel 저장 시작...');

    const data = await collectData();

    // 예약 데이터
    const bookingsSheet = XLSX.utils.json_to_sheet(data.bookings || []);

    // 비용 데이터
    const expensesSheet = XLSX.utils.json_to_sheet(data.expenses || []);

    // 테라피스트 데이터
    const therapistsSheet = XLSX.utils.json_to_sheet(data.therapists || []);

    // Workbook 만들기
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, bookingsSheet, '예약');
    XLSX.utils.book_append_sheet(wb, expensesSheet, '비용');
    XLSX.utils.book_append_sheet(wb, therapistsSheet, '테라피스트');

    // 파일명: Backup_2026-06-05_10-30.xlsx
    const now = new Date();
    const fileName = `Backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}.xlsx`;

    // 파일 저장
    XLSX.writeFile(wb, fileName);

    console.log('✅ Excel 저장 완료:', fileName);
  }, [collectData]);

  // ⏰ 3시간마다 자동 실행
  useEffect(() => {
    console.log('🚀 자동 백업 시작 (3시간마다)');

    // 첫 번째 백업
    saveExcel();

    // 3시간마다 반복
    backupRef.current = setInterval(() => {
      saveExcel();
    }, BACKUP_INTERVAL);

    return () => {
      if (backupRef.current) {
        clearInterval(backupRef.current);
      }
    };
  }, [saveExcel]);

  return null;
}
