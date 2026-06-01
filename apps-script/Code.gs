/**
 * ============================================================
 * 📌 ELSPA — Supabase → Google Sheet 1시간 단위 백업
 * 📋 목적: 백엔드 없이, Apps Script 시간 트리거가 매시간 Supabase의
 *         beds / therapists / bookings 를 읽어 시트 탭에 기록(스냅샷)
 * 📅 작성일: 2026-05-31
 *
 * [설치 방법]
 *  1) 백업 대상 Google Sheet 열기 → 확장 프로그램 → Apps Script
 *  2) 이 코드를 붙여넣기
 *  3) 프로젝트 설정 → 스크립트 속성에 다음 추가:
 *       SUPABASE_URL       = https://xxxx.supabase.co
 *       SUPABASE_ANON_KEY  = (anon public 키)
 *  4) setupHourlyTrigger() 1회 실행 (권한 승인) → 매시간 자동 동기화
 *  5) 수동 테스트는 syncAll() 실행
 * ============================================================
 */

// 동기화할 테이블 → 시트 탭 이름 매핑
// ⚠️ Supabase → Sheets 단방향 전체 복사 (매 sync 마다 시트를 Supabase 와 100% 일치시킴)
var TABLES = [
  { table: 'beds',                sheet: 'beds',                order: 'id' },
  { table: 'therapists',          sheet: 'therapists',          order: 'id' },
  { table: 'bookings',            sheet: 'bookings',            order: 'booking_date' },
  // 정산(settlement) 테이블 — 무결성 미러
  { table: 'companies',           sheet: 'companies',           order: 'id' },
  { table: 'guides',              sheet: 'guides',              order: 'id' },
  { table: 'monthly_settlements', sheet: 'monthly_settlements', order: 'settlement_month' },
];

/** 매시간 트리거 설치 (1회 실행) */
function setupHourlyTrigger() {
  // 중복 방지: 기존 syncAll 트리거 제거
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'syncAll') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncAll').timeBased().everyHours(1).create();
  Logger.log('✅ 매시간 동기화 트리거 설치 완료');
}

/** 전체 테이블을 시트로 동기화 */
function syncAll() {
  var props = PropertiesService.getScriptProperties();
  var url = props.getProperty('SUPABASE_URL');
  var key = props.getProperty('SUPABASE_ANON_KEY');
  if (!url || !key) {
    throw new Error('스크립트 속성 SUPABASE_URL / SUPABASE_ANON_KEY 를 먼저 설정하세요.');
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');

  TABLES.forEach(function (cfg) {
    var rows = fetchTable(url, key, cfg.table, cfg.order);
    // bookings 는 30행 단위로 1st/2nd/3rd 시트 분할 (예약 날짜/시간 컬럼 포함)
    if (cfg.table === 'bookings') {
      writePaginatedSheets(ss, cfg.sheet, rows, stamp, PAGE_SIZE);
    } else {
      writeSheet(ss, cfg.sheet, rows, stamp);
    }
  });

  Logger.log('✅ ' + stamp + ' Supabase → Sheet 동기화 완료');
}

// 한 시트당 최대 예약 행 수 (초과 시 다음 시트로)
var PAGE_SIZE = 30;

/** 1→"1st", 2→"2nd", 3→"3rd", 11→"11th" ... 서수 변환 */
function ordinal(n) {
  var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * bookings 를 pageSize(30) 행씩 분할해 "<base> 1st", "<base> 2nd" ... 시트로 기록.
 * 이전 동기화의 잔여 페이지 시트는 정리.
 */
function writePaginatedSheets(ss, baseName, rows, stamp, pageSize) {
  rows = rows || [];
  var pages = Math.max(1, Math.ceil(rows.length / pageSize));
  for (var p = 0; p < pages; p++) {
    var chunk = rows.slice(p * pageSize, (p + 1) * pageSize);
    var name = baseName + ' ' + ordinal(p + 1); // 예: "bookings 1st"
    writeSheet(ss, name, chunk, stamp + '  (' + ordinal(p + 1) + ' sheet, ' + chunk.length + ' rows)');
  }
  // 잔여(과거에 만들어졌던) 페이지 시트 제거
  var extra = pages + 1;
  while (true) {
    var stale = ss.getSheetByName(baseName + ' ' + ordinal(extra));
    if (!stale) break;
    ss.deleteSheet(stale);
    extra++;
  }
  // 단일 'bookings' 시트가 있으면 안내만 남기고 정리(중복 방지)
  var legacy = ss.getSheetByName(baseName);
  if (legacy) {
    legacy.clearContents();
    legacy.getRange(1, 1).setValue('→ "' + baseName + ' 1st/2nd/..." 시트로 분할 저장됨 (' + stamp + ')');
  }
}

/** Supabase REST 로 한 테이블 전체 조회 */
function fetchTable(url, key, table, order) {
  var endpoint = url.replace(/\/$/, '') +
    '/rest/v1/' + table + '?select=*&order=' + encodeURIComponent(order);
  var res = UrlFetchApp.fetch(endpoint, {
    method: 'get',
    muteHttpExceptions: true,
    headers: { apikey: key, Authorization: 'Bearer ' + key },
  });
  var code = res.getResponseCode();
  if (code !== 200) {
    throw new Error('Supabase 조회 실패 (' + table + '): HTTP ' + code + ' ' + res.getContentText());
  }
  return JSON.parse(res.getContentText());
}

/** 시트 탭에 행 데이터를 덮어쓰기 (헤더 + 행 + 동기화 시각) */
function writeSheet(ss, sheetName, rows, stamp) {
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clearContents();

  // 동기화 메타
  sheet.getRange(1, 1).setValue('Last synced: ' + stamp);

  if (!rows || rows.length === 0) {
    sheet.getRange(2, 1).setValue('(no rows)');
    return;
  }

  // 컬럼 순서 = 첫 행의 키 순서
  var headers = Object.keys(rows[0]);
  var matrix = [headers];
  rows.forEach(function (r) {
    matrix.push(headers.map(function (h) {
      var v = r[h];
      return v === null || v === undefined ? '' : (typeof v === 'object' ? JSON.stringify(v) : v);
    }));
  });

  sheet.getRange(2, 1, matrix.length, headers.length).setValues(matrix);
  sheet.setFrozenRows(2);
}
