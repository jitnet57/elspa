# 📑 Phase 10-1 CI/CD 파이프라인 - 문서 인덱스

> ElSpa 프로젝트 Phase 10-1 (Wave 5-1 배포 단계) 최종 완료  
> 2026-05-22 기준

---

## 🎯 빠른 시작

### 1단계: 이 문서 읽기 (5분)
→ **지금 읽는 문서**

### 2단계: 빠른 참고 가이드 (10분)
→ [QUICK-REFERENCE.md](./QUICK-REFERENCE.md)
- 주요 파일 위치
- 자주 사용하는 명령어
- GitHub Secrets 체크리스트

### 3단계: 설정 가이드 (30분)
→ [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md)
- GitHub Secrets 설정
- 로컬 환경 테스트
- Docker 빌드 테스트
- 첫 배포 테스트

### 4단계: 배포 전 확인 (15분)
→ [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Pre-Deployment 체크리스트
- Deployment 단계
- Rollback 절차
- 모니터링 지표

### 5단계: 상세 가이드 (필요시)
→ [CI-CD-GUIDE.md](./CI-CD-GUIDE.md)
- 개요 & 아키텍처
- 구성 요소 상세 설명
- 배포 프로세스 단계별 설명
- 트러블슈팅 Q&A

---

## 📚 문서 가이드

### 📋 배포 관련 문서

| 문서 | 읽는 대상 | 소요 시간 | 목적 |
|------|----------|---------|------|
| [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) | 모두 | 10분 | 빠른 참고 |
| [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md) | DevOps/배포담당자 | 30분 | 초기 설정 |
| [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) | 배포 담당자 | 15분 | 배포 전/중/후 확인 |
| [CI-CD-GUIDE.md](./CI-CD-GUIDE.md) | 개발자/DevOps | 45분 | 상세 가이드 |

### 📖 개발 관련 문서

| 문서 | 읽는 대상 | 목적 |
|------|----------|------|
| [CLAUDE.md](./CLAUDE.md) | 개발자 | 개발 가이드 & 기술 스택 |
| [PHASE-10-1-SUMMARY.md](./PHASE-10-1-SUMMARY.md) | 관리자 | 완료 요약 |
| [PHASE-10-1-COMPLETION.md](./PHASE-10-1-COMPLETION.md) | 관리자 | 최종 완료 보고서 |

---

## 🗂️ 생성된 파일 위치

### Docker 파일
```
elspa/
├── Dockerfile.backend      ← FastAPI 컨테이너
├── Dockerfile.frontend     ← Next.js 컨테이너
└── docker-compose.yml      ← 로컬 환경 정의
```

### GitHub Actions 워크플로우
```
elspa/.github/workflows/
├── pr-check.yml            ← PR 자동 검증
├── deploy.yml              ← 자동 배포
├── health-check.yml        ← 정기 헬스 체크
└── e2e-tests.yml           ← E2E 테스트 (기존)
```

### 환경 설정
```
elspa/
├── .env.development        ← 개발 환경 (Git 추적)
├── .env.staging            ← Staging 환경 (Git 추적)
└── .env.production         ← 프로덕션 템플릿 (.gitignore)
```

### 스크립트
```
elspa/scripts/
└── run_migrations.sh       ← DB 마이그레이션 자동화
```

### 문서
```
elspa/
├── QUICK-REFERENCE.md              ← 빠른 참고
├── SETUP-INSTRUCTIONS.md           ← 설정 방법
├── DEPLOYMENT_CHECKLIST.md         ← 배포 체크리스트
├── CI-CD-GUIDE.md                  ← 상세 가이드
├── PHASE-10-1-SUMMARY.md           ← 완료 요약
├── PHASE-10-1-COMPLETION.md        ← 최종 보고서
└── PHASE-10-1-INDEX.md             ← 이 파일
```

---

## 👥 역할별 읽기 순서

### 👨‍💼 프로젝트 관리자
1. [PHASE-10-1-SUMMARY.md](./PHASE-10-1-SUMMARY.md) - 5분 (완료 요약)
2. [PHASE-10-1-COMPLETION.md](./PHASE-10-1-COMPLETION.md) - 10분 (최종 보고서)
3. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 시 (확인)

### 👨‍💻 개발자
1. [QUICK-REFERENCE.md](./QUICK-REFERENCE.md) - 10분 (빠른 참고)
2. [CI-CD-GUIDE.md](./CI-CD-GUIDE.md) - 45분 (상세 학습)
3. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 시 (확인)

### 🔧 DevOps/배포담당자
1. [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md) - 30분 (초기 설정)
2. [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 전/중/후 (확인)
3. [CI-CD-GUIDE.md](./CI-CD-GUIDE.md) - 필요시 (문제 해결)

---

## 🚀 배포 프로세스 흐름도

```
┌─────────────────────────────────────────┐
│ 1. 개발 완료 (로컬)                      │
│    읽기: QUICK-REFERENCE.md             │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 2. GitHub에 푸시 & PR 생성              │
│    자동: PR Check (15-20분)             │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 3. 코드 리뷰 & 승인                     │
│    읽기: DEPLOYMENT_CHECKLIST.md        │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 4. Main 브랜치에 머지                   │
│    자동: Deploy (25-30분)               │
└────────────┬────────────────────────────┘
             ↓
┌─────────────────────────────────────────┐
│ 5. 배포 완료 & 헬스 체크                │
│    확인: QUICK-REFERENCE.md             │
└─────────────────────────────────────────┘
```

---

## 🎯 주요 단계별 확인사항

### 1️⃣ 설정 단계 (처음 1회)
- [ ] [SETUP-INSTRUCTIONS.md](./SETUP-INSTRUCTIONS.md) 읽기
- [ ] GitHub Secrets 설정
- [ ] 로컬 Docker 테스트
- [ ] 첫 배포 테스트

### 2️⃣ 배포 전 (매 배포마다)
- [ ] [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Pre-Deployment 섹션 확인
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료

### 3️⃣ 배포 중 (자동화됨)
- GitHub Actions 워크플로우 자동 실행
- 25-30분 소요

### 4️⃣ 배포 후 (매 배포마다)
- [ ] [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment 섹션 확인
- [ ] 헬스 체크 통과
- [ ] 프로덕션 서비스 정상 작동 확인

---

## 📞 문제 해결

### 일반적인 문제
→ [CI-CD-GUIDE.md](./CI-CD-GUIDE.md#트러블슈팅)

### PR Check 실패
→ [CI-CD-GUIDE.md](./CI-CD-GUIDE.md#q1-pr-check-실패---backend-tests-failed)

### Docker 빌드 실패
→ [CI-CD-GUIDE.md](./CI-CD-GUIDE.md#q2-docker-빌드-실패---run-pip-install-failed)

### 배포 후 헬스 체크 실패
→ [CI-CD-GUIDE.md](./CI-CD-GUIDE.md#q3-배포-후-헬스-체크-실패)

### 데이터베이스 마이그레이션 실패
→ [CI-CD-GUIDE.md](./CI-CD-GUIDE.md#q4-데이터베이스-마이그레이션-실패)

---

## ⚙️ 기술 스택

### Backend
- Python 3.11 + FastAPI
- PostgreSQL 15
- Docker

### Frontend
- Node.js 20 + Next.js 16.2.4
- React 19 + TypeScript
- Docker

### DevOps
- GitHub Actions
- Docker Compose
- GitHub Container Registry

---

## 📊 파일 통계

| 카테고리 | 파일 수 | 전체 라인 수 |
|---------|--------|------------|
| Docker | 3개 | ~300줄 |
| GitHub Actions | 3개 | ~600줄 |
| 환경 설정 | 3개 | ~150줄 |
| 스크립트 | 1개 | ~100줄 |
| 문서 | 7개 | ~2000줄 |
| **합계** | **14개** | **~3150줄** |

---

## 🎓 학습 자료

### Docker 관련
- [Docker 공식 문서](https://docs.docker.com/)
- [Docker Compose 가이드](https://docs.docker.com/compose/)
- [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

### GitHub Actions 관련
- [GitHub Actions 공식 문서](https://docs.github.com/en/actions)
- [Workflow 구문 참고](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

### ElSpa 관련
- [CLAUDE.md](./CLAUDE.md) - 개발 가이드
- [history-workflow-book.md](./history-workflow-book.md) - 개발 히스토리

---

## ✅ 체크리스트

### 읽어야 할 문서
- [ ] QUICK-REFERENCE.md
- [ ] 역할별 필수 문서 3개

### 설정해야 할 항목
- [ ] GitHub Secrets 6개
- [ ] 로컬 환경 테스트
- [ ] Docker 빌드 테스트

### 배포 전 확인
- [ ] DEPLOYMENT_CHECKLIST.md 모든 항목

### 배포 후 확인
- [ ] 헬스 체크 통과
- [ ] 프로덕션 서비스 정상 작동

---

## 📞 질문 & 피드백

### 문서 관련
- 이 인덱스가 도움이 되었나요?
- 더 추가되어야 할 문서가 있나요?

### 구현 관련
- 워크플로우가 예상대로 작동하나요?
- 추가 기능이 필요한가요?

→ GitHub Issues에서 질문해주세요!

---

## 🔄 버전 관리

| 버전 | 날짜 | 변경사항 |
|------|------|--------|
| 1.0.0 | 2026-05-22 | 초판 완료 |

---

**최종 업데이트:** 2026-05-22  
**문서 버전:** 1.0.0  
**상태:** ✅ 완료
