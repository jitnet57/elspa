#!/usr/bin/env node

/**
 * ============================================================
 * 📌 빌드 정보 생성 스크립트
 * 📋 목적: 배포 시간을 public/build-info.json에 저장
 * 🔧 실행: npm run prebuild로 자동 실행
 * 📅 작성일: 2026-06-04
 * ============================================================
 */

const fs = require('fs');
const path = require('path');

// 현재 시간
const now = new Date();
const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // KST (+9시간)

const buildInfo = {
  // 배포 시간 (한국 시간)
  buildTime: kstTime.toISOString().split('T')[0], // YYYY-MM-DD
  buildTimeHMS: kstTime.toISOString().split('.')[0].replace('T', ' '), // YYYY-MM-DD HH:MM:SS
  buildTimeShort: kstTime.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(/\./g, '-').replace(/\s/g, ' '),

  // 타임스탐프 (Service Worker 캐시 버전용)
  timestamp: kstTime.toISOString().slice(0, 13).replace('T', '').replace(/:/g, ''), // YYYYMMDDHH

  // 버전 정보
  version: require('../package.json').version,

  // 배포 환경
  environment: process.env.ENVIRONMENT || 'production',
};

// public/build-info.json 생성
const buildInfoPath = path.join(__dirname, '../public/build-info.json');
fs.writeFileSync(buildInfoPath, JSON.stringify(buildInfo, null, 2));

console.log(`
✅ 빌드 정보 생성 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 배포 시간: ${buildInfo.buildTimeShort}
🕐 ISO 시간: ${buildInfo.buildTimeHMS}
📌 버전: ${buildInfo.version}
📦 파일: ${buildInfoPath}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
