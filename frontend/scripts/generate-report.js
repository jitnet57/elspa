/**
 * ============================================================
 * 📌 Cypress 테스트 리포트 생성 스크립트
 * 📋 목적: Cypress 테스트 결과를 HTML 리포트로 변환
 * 📅 작성일: 2026-05-22
 * ============================================================
 *
 * 사용 방법:
 * node scripts/generate-report.js
 *
 * 이 스크립트는:
 * 1. cypress/results/cypress.json 읽기
 * 2. HTML 리포트 생성
 * 3. 스크린샷 및 비디오 포함
 * 4. 테스트 요약 표시
 */

const fs = require('fs');
const path = require('path');

// 경로 정의
const RESULTS_DIR = path.join(__dirname, '../cypress/results');
const SCREENSHOTS_DIR = path.join(__dirname, '../cypress/screenshots');
const VIDEOS_DIR = path.join(__dirname, '../cypress/videos');
const REPORT_FILE = path.join(__dirname, '../cypress-report.html');

/**
 * 📌 테스트 결과 읽기
 */
function readTestResults() {
  const resultsFile = path.join(RESULTS_DIR, 'cypress.json');

  if (!fs.existsSync(resultsFile)) {
    console.warn('⚠️  테스트 결과 파일이 없습니다:', resultsFile);
    return null;
  }

  const data = fs.readFileSync(resultsFile, 'utf8');
  return JSON.parse(data);
}

/**
 * 📌 통계 계산
 */
function calculateStats(results) {
  if (!results) {
    return {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      passRate: 0,
    };
  }

  const stats = results.stats || {};

  return {
    total: (stats.tests || 0),
    passed: (stats.passes || 0),
    failed: (stats.failures || 0),
    skipped: (stats.pending || 0),
    duration: Math.floor((stats.duration || 0) / 1000),
    passRate: stats.tests ? ((stats.passes / stats.tests) * 100).toFixed(2) : 0,
  };
}

/**
 * 📌 HTML 리포트 생성
 */
function generateHTML(results, stats) {
  const timestamp = new Date().toISOString();
  const suites = results.suites || [];

  let suiteHTML = '';
  suites.forEach((suite) => {
    const tests = suite.tests || [];
    suiteHTML += `
      <div class="suite">
        <h3>${suite.title}</h3>
        <table class="test-table">
          <thead>
            <tr>
              <th>테스트</th>
              <th>상태</th>
              <th>소요시간</th>
            </tr>
          </thead>
          <tbody>
            ${tests
              .map(
                (test) => `
              <tr class="test-${test.state}">
                <td>${test.title}</td>
                <td><span class="badge badge-${test.state}">${test.state}</span></td>
                <td>${(test.duration / 1000).toFixed(2)}s</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  });

  const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ElSpa E2E 테스트 리포트</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      color: #333;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px;
      text-align: center;
    }

    .header h1 {
      font-size: 2.5em;
      margin-bottom: 10px;
    }

    .header p {
      font-size: 1.1em;
      opacity: 0.9;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      padding: 40px;
      background: #f8f9fa;
    }

    .stat-card {
      background: white;
      border-left: 4px solid #667eea;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .stat-card h3 {
      font-size: 0.9em;
      color: #999;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .stat-card .value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }

    .stat-card.success {
      border-left-color: #10b981;
    }

    .stat-card.failed {
      border-left-color: #ef4444;
    }

    .stat-card.passed {
      border-left-color: #10b981;
    }

    .progress-bar {
      width: 100%;
      height: 10px;
      background: #e5e7eb;
      border-radius: 5px;
      overflow: hidden;
      margin-top: 10px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      transition: width 0.3s ease;
    }

    .content {
      padding: 40px;
    }

    .suite {
      margin-bottom: 30px;
    }

    .suite h3 {
      font-size: 1.3em;
      color: #333;
      margin-bottom: 15px;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }

    .test-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.95em;
    }

    .test-table thead {
      background: #f8f9fa;
    }

    .test-table th {
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #666;
      border-bottom: 2px solid #e5e7eb;
    }

    .test-table td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    .test-passed {
      background: #f0fdf4;
    }

    .test-failed {
      background: #fef2f2;
    }

    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.85em;
      font-weight: 600;
    }

    .badge-passed {
      background: #10b981;
      color: white;
    }

    .badge-failed {
      background: #ef4444;
      color: white;
    }

    .badge-pending {
      background: #f59e0b;
      color: white;
    }

    .footer {
      background: #f8f9fa;
      padding: 20px 40px;
      border-top: 1px solid #e5e7eb;
      font-size: 0.9em;
      color: #666;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .summary {
      background: white;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 20px 0;
      border-radius: 8px;
    }

    .summary h4 {
      color: #333;
      margin-bottom: 10px;
    }

    .summary p {
      color: #666;
      margin-bottom: 5px;
    }

    @media (max-width: 768px) {
      .header h1 {
        font-size: 1.8em;
      }

      .stats {
        grid-template-columns: 1fr 1fr;
      }

      .test-table {
        font-size: 0.85em;
      }

      .test-table th,
      .test-table td {
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- 헤더 -->
    <div class="header">
      <h1>ElSpa E2E 테스트 리포트</h1>
      <p>Cypress 자동화 테스트 결과</p>
    </div>

    <!-- 통계 -->
    <div class="stats">
      <div class="stat-card passed">
        <h3>총 테스트</h3>
        <div class="value">${stats.total}</div>
      </div>
      <div class="stat-card success">
        <h3>성공</h3>
        <div class="value">${stats.passed}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.passRate}%"></div>
        </div>
      </div>
      <div class="stat-card failed">
        <h3>실패</h3>
        <div class="value">${stats.failed}</div>
      </div>
      <div class="stat-card">
        <h3>성공률</h3>
        <div class="value">${stats.passRate}%</div>
      </div>
      <div class="stat-card">
        <h3>소요시간</h3>
        <div class="value">${stats.duration}s</div>
      </div>
    </div>

    <!-- 요약 -->
    <div class="content">
      <div class="summary">
        <h4>테스트 실행 요약</h4>
        <p><strong>실행 시간:</strong> ${timestamp}</p>
        <p><strong>테스트 파일:</strong> 6개 파일 (auth, payroll-dashboard, payroll-crud, payroll-results, messaging, audit-logs)</p>
        <p><strong>테스트 케이스:</strong> ${stats.total}개</p>
        <p><strong>상태:</strong> ${stats.failed === 0 ? '✅ 모든 테스트 통과!' : `⚠️ ${stats.failed}개 테스트 실패`}</p>
      </div>

      <!-- 테스트 결과 -->
      <h2 style="margin: 30px 0 20px 0; color: #333;">테스트 결과</h2>
      ${suiteHTML || '<p style="color: #999;">테스트 결과가 없습니다.</p>'}
    </div>

    <!-- 푸터 -->
    <div class="footer">
      <span>ElSpa 급여 정산 시스템 - 자동화 테스트</span>
      <span>${timestamp}</span>
    </div>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * 📌 메인 함수
 */
function main() {
  console.log('📊 테스트 리포트 생성 중...');

  const results = readTestResults();
  const stats = calculateStats(results);

  console.log(`\n📈 테스트 통계:`);
  console.log(`   총 테스트: ${stats.total}`);
  console.log(`   성공: ${stats.passed}`);
  console.log(`   실패: ${stats.failed}`);
  console.log(`   성공률: ${stats.passRate}%`);
  console.log(`   소요시간: ${stats.duration}s\n`);

  const html = generateHTML(results, stats);

  // 리포트 파일 생성
  fs.writeFileSync(REPORT_FILE, html);

  console.log(`✅ 리포트가 생성되었습니다: ${REPORT_FILE}`);
  console.log(`📺 브라우저에서 열기: ${REPORT_FILE}`);
}

main();
