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
var TABLES = [
  { table: 'beds',       sheet: 'beds',       order: 'id' },
  { table: 'therapists', sheet: 'therapists', order: 'id' },
  { table: 'bookings',   sheet: 'bookings',   order: 'booking_date' },
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
    writeSheet(ss, cfg.sheet, rows, stamp);
  });

  Logger.log('✅ ' + stamp + ' Supabase → Sheet 동기화 완료');
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
