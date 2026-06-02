/**
 * ============================================================
 * 📌 Jest Setup File
 * 📋 목적: 글로벌 테스트 설정 및 폴리필
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

// @testing-library/jest-dom 확장 모듈 설정
import '@testing-library/jest-dom';

// 글로벌 테스트 타임아웃 설정
jest.setTimeout(10000);

// Mock 로컬스토리지
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock 페치 API (필요한 경우)
global.fetch = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
})) as any;

// 테스트 전후 리셋
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.clearAllMocks();
});
