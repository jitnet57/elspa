/**
 * ============================================================
 * 📌 파일 저장 클라이언트
 * 📋 목적: IndexedDB → 로컬 파일 (XLSX + 백업)
 * 🔧 사용: autoSaveToLocal(), 또는 saveNow()
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { db } from '@/lib/db/localDb';

// 설정
const FILE_SERVER_URL = 'http://localhost:5000/api';
const AUTO_SAVE_INTERVAL = 15 * 60 * 1000; // 15분마다

let autoSaveTimer: NodeJS.Timeout | null = null;

/**
 * 🔄 IndexedDB에서 데이터 로드
 */
async function loadDataFromIndexedDB() {
  try {
    const [bookings, expenses, attendanceLogs, employees] = await Promise.all([
      db.bookings.toArray(),
      db.expenses.toArray(),
      db.attendanceLogs.toArray(),
      db.employees.toArray(),
    ]);

    return {
      bookings: bookings || [],
      expenses: expenses || [],
      attendance: attendanceLogs || [],
      payroll: [], // TODO: payroll 테이블 추가 필요
    };
  } catch (error) {
    console.error('❌ IndexedDB 로드 실패:', error);
    return {
      bookings: [],
      expenses: [],
      attendance: [],
      payroll: [],
    };
  }
}

/**
 * 💾 로컬 파일 서버에 저장
 */
export async function saveToLocalServer() {
  try {
    console.log('📝 로컬 파일 저장 중...');

    // 1. IndexedDB에서 데이터 로드
    const data = await loadDataFromIndexedDB();

    // 2. 서버로 전송
    const response = await fetch(`${FILE_SERVER_URL}/save-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ 파일 저장 완료:', result.message);
      console.log('📁 저장된 파일:');
      Object.entries(result.results).forEach(([key, val]: [string, any]) => {
        console.log(`  - ${val.file} (${val.rows} 행)`);
        console.log(`  - ${val.backup} (백업)`);
      });
      return result;
    } else {
      console.error('❌ 저장 실패:', result.error);
      return null;
    }
  } catch (error) {
    console.error('❌ 네트워크 오류:', error);
    return null;
  }
}

/**
 * ⏰ 주기적 자동 저장 시작
 */
export function startAutoSave(intervalMs: number = AUTO_SAVE_INTERVAL) {
  if (autoSaveTimer) {
    console.log('⚠️  자동 저장이 이미 실행 중입니다');
    return;
  }

  console.log(`🔄 자동 저장 시작 (매 ${Math.round(intervalMs / 1000 / 60)}분마다)`);

  // 첫 번째 저장 (즉시)
  saveToLocalServer();

  // 이후 정기적 저장
  autoSaveTimer = setInterval(() => {
    saveToLocalServer();
  }, intervalMs);
}

/**
 * 🛑 자동 저장 중지
 */
export function stopAutoSave() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log('⏹️  자동 저장 중지');
  }
}

/**
 * 📊 파일 목록 조회
 */
export async function listSavedFiles() {
  try {
    const response = await fetch(`${FILE_SERVER_URL}/list-files`);
    const result = await response.json();

    if (result.success) {
      console.log('📁 저장된 파일 목록:');
      result.files.forEach((f: any) => {
        console.log(`  - ${f.name} (${(f.size / 1024).toFixed(1)} KB)`);
      });
      return result.files;
    }
    return [];
  } catch (error) {
    console.error('❌ 파일 목록 조회 실패:', error);
    return [];
  }
}

/**
 * 🏥 서버 상태 체크
 */
export async function checkFileServer() {
  try {
    const response = await fetch(`${FILE_SERVER_URL.replace('/api', '')}/health`);
    const result = await response.json();

    if (result.status === 'ok') {
      console.log('✅ 파일 저장 서버 연결됨');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ 파일 저장 서버 연결 실패:', error);
    return false;
  }
}
