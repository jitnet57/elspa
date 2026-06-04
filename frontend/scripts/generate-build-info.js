#!/usr/bin/env node

/**
 * ============================================================
 * 📌 빌드 정보 생성 스크립트
 * 📋 목적: 배포 시간 & 최근 커밋 정보를 public/build-info.json에 저장
 * 🔧 실행: npm run prebuild로 자동 실행
 * 📅 작성일: 2026-06-04
 * ============================================================
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 현재 시간 (시스템 시간대 그대로 사용)
const now = new Date();

// 🔄 Git 정보 추출
let commitHash = '';
let commitMessage = '';
let commitAuthor = '';
let commitDate = '';

try {
  commitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim();
  commitMessage = execSync('git log -1 --pretty=%B', { encoding: 'utf-8' }).trim();
  commitAuthor = execSync('git log -1 --pretty=%an', { encoding: 'utf-8' }).trim();
  commitDate = execSync('git log -1 --pretty=%ai', { encoding: 'utf-8' }).trim();
} catch (error) {
  console.warn('⚠️  Git 정보를 읽을 수 없습니다. (오프라인 환경일 수 있음)');
  commitHash = 'unknown';
  commitMessage = '업데이트됨';
}

const buildInfo = {
  // 배포 시간 (현재 시스템 시간)
  buildTime: now.toISOString().split('T')[0], // YYYY-MM-DD
  buildTimeHMS: now.toISOString().split('.')[0].replace('T', ' '), // YYYY-MM-DD HH:MM:SS
  buildTimeShort: (() => {
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = now.getHours() % 12 || 12;
    return `${year}-${month}-${day} ${ampm} ${String(displayHours).padStart(2, '0')}:${minutes}`;
  })(),

  // 타임스탐프 (Service Worker 캐시 버전용)
  timestamp: now.toISOString().slice(0, 13).replace('T', '').replace(/:/g, ''), // YYYYMMDDHH

  // 버전 정보
  version: require('../package.json').version,

  // 배포 환경
  environment: process.env.ENVIRONMENT || 'production',

  // 🔄 Git 정보
  commit: {
    hash: commitHash,
    shortHash: commitHash.slice(0, 7),
    message: commitMessage,
    author: commitAuthor,
    date: commitDate,
  },
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
📦 Git Hash: ${buildInfo.commit.shortHash}
📝 커밋: ${buildInfo.commit.message.split('\n')[0]}
👤 작성자: ${buildInfo.commit.author}
📍 파일: ${buildInfoPath}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
