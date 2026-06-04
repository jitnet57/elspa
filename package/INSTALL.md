# 📦 ElSpa 로컬 설치 가이드

> ElSpa 프로젝트를 로컬 개발 환경에서 설정하고 실행하는 완전 가이드
> 작성일: 2026-06-03

---

## 🎯 5분 빠른 시작

### 한 줄 설치 (권장)
```bash
bash setup.sh
```

이 명령이 다음을 자동으로 수행합니다:
- ✅ 필수 도구 확인 (Node.js, Python, Git)
- ✅ 프론트엔드 npm 패키지 설치
- ✅ 백엔드 Python 가상 환경 + 패키지 설치
- ✅ 환경 변수 파일 생성 (.env, .env.local)

---

## ⚙️ 상세 설치 가이드

### Phase 1️⃣: 필수 요구사항

#### Mac/Linux
```bash
# Homebrew 설치 (Mac용)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js 설치
brew install node@18
brew install python@3.10
brew install git
```

#### Windows
- **Node.js**: https://nodejs.org → v18 이상 다운로드
- **Python**: https://www.python.org → v3.10+ 다운로드
- **Git**: https://git-scm.com 다운로드

#### 설치 확인
```bash
node --version      # v18.0.0 이상
npm --version       # 8.0.0 이상
python3 --version   # 3.10+ 이상
git --version       # 2.30 이상
```

---

### Phase 2️⃣: 저장소 클론

```bash
# GitHub 저장소 클론
git clone https://github.com/jitnet57/elspa.git
cd elspa

# 또는 기존 저장소가 있다면
cd /path/to/elspa
```

---

### Phase 3️⃣: 자동 설치 스크립트 실행

```bash
# setup.sh 실행 (자동으로 모든 설정 수행)
bash setup.sh
```

**스크립트가 수행하는 작업:**

#### 3-1) 프론트엔드 (Next.js)
```bash
cd frontend
npm install
# .env.local 파일 생성:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3-2) 백엔드 (FastAPI)
```bash
# Python 가상 환경 생성
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# 또는
venv\Scripts\activate  # Windows

# 패키지 설치
pip install -r requirements.txt

# .env 파일 생성:
# DATABASE_URL=postgresql://...
# PORT=8000
# CORS_ORIGINS=http://localhost:3000
```

---

### Phase 4️⃣: 환경 변수 설정

#### 백엔드 (.env)
```bash
cd /path/to/elspa
cp .env.example .env
```

**필수 설정:**
```env
DATABASE_URL=postgresql://postgres.xxxxx:password@db.supabase.co:5432/postgres
PORT=8000
ENVIRONMENT=development
```

**Supabase에서 CONNECTION STRING 가져오기:**
1. https://app.supabase.com 접속
2. 프로젝트 선택 → Settings → Database
3. "Connection String" → "URI" 복사
4. .env의 DATABASE_URL에 붙여넣기

#### 프론트엔드 (.env.local)
```bash
cd frontend
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### Phase 5️⃣: 개발 서버 실행

**터미널 1 - 백엔드 실행 (포트 8000)**
```bash
# 프로젝트 루트에서
source venv/bin/activate
python main.py

# 또는 Uvicorn으로 실행
uvicorn app.main:app --reload --port 8000
```

**터미널 2 - 프론트엔드 실행 (포트 3000)**
```bash
cd frontend
npm run dev
```

---

## 🌐 접속

| 서비스 | URL | 설명 |
|--------|-----|------|
| **프론트엔드** | http://localhost:3000 | React/Next.js 앱 |
| **백엔드** | http://localhost:8000 | FastAPI 서버 |
| **API 문서** | http://localhost:8000/docs | Swagger UI (테스트용) |
| **Redoc** | http://localhost:8000/redoc | ReDoc (문서용) |

---

## 🧪 테스트

### 백엔드 헬스 체크
```bash
curl http://localhost:8000/health
# 응답: {"status":"ok","message":"ElSpa Backend is running!"}
```

### 프론트엔드 테스트
```bash
# 타입 검사
cd frontend
npm run type-check

# 빌드 테스트
npm run build
```

---

## 📝 문제 해결

### 1️⃣ Port Already in Use (포트 이미 사용 중)

**포트 8000이 이미 사용 중인 경우:**
```bash
# 다른 포트로 실행
python main.py --port 8001
# 또는 Frontend의 .env.local 수정:
# NEXT_PUBLIC_API_URL=http://localhost:8001
```

### 2️⃣ DATABASE_URL Not Found

**백엔드 실행 시 에러:**
```
ERROR: DATABASE_URL environment variable not set!
```

**해결:**
```bash
# .env 파일이 있는지 확인
ls -la .env

# DATABASE_URL이 설정되어 있는지 확인
cat .env | grep DATABASE_URL

# 없으면 설정
echo "DATABASE_URL=postgresql://..." >> .env
```

### 3️⃣ CORS Error (프론트엔드에서 백엔드 API 호출 실패)

**브라우저 콘솔:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/...' 
from origin 'http://localhost:3000' has been blocked by CORS policy
```

**해결:**
```bash
# .env의 CORS_ORIGINS 확인
cat .env | grep CORS_ORIGINS
# 출력: CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# 없으면 추가
echo "CORS_ORIGINS=http://localhost:3000" >> .env

# 백엔드 재시작
python main.py
```

### 4️⃣ npm 패키지 설치 실패

**해결:**
```bash
cd frontend

# 캐시 삭제
npm cache clean --force

# node_modules 삭제
rm -rf node_modules package-lock.json

# 다시 설치
npm install
```

### 5️⃣ Python 모듈 찾을 수 없음

**에러:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**해결:**
```bash
# 가상 환경 활성화 확인
which python
# 출력: /path/to/elspa/venv/bin/python (venv 경로여야 함)

# 가상 환경 다시 활성화
source venv/bin/activate

# 패키지 다시 설치
pip install -r requirements.txt
```

---

## 📊 프로덕션 빌드

### 프론트엔드 빌드
```bash
cd frontend
npm run build
# .next 폴더 생성 → Cloudflare Pages에 배포

npm start  # 빌드된 앱 로컬에서 테스트 (포트 3000)
```

### 백엔드 빌드 (Docker)
```bash
# Docker 이미지 빌드
docker build -t elspa-backend .

# Docker 컨테이너 실행
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://... \
  -e PORT=8000 \
  elspa-backend
```

---

## 🚀 배포 체크리스트

배포 전에 확인할 사항:

- [ ] 로컬에서 모든 기능 테스트 완료
- [ ] `npm run build` 성공 (프론트엔드)
- [ ] Git 커밋 완료
- [ ] 환경 변수 설정 확인
- [ ] 데이터베이스 백업 완료
- [ ] API 엔드포인트 테스트 완료

---

## 📚 추가 자료

- **환경.md**: 전체 개발/배포 환경 설정
- **CLAUDE.md**: 프로젝트 개발 가이드
- **history-workflow-book.md**: 개발 히스토리

---

## 💡 유용한 명령어

```bash
# 전체 상태 확인
npm run dev        # 프론트엔드 개발 서버
python main.py     # 백엔드 개발 서버

# 타입 검사
npm run type-check  # TypeScript 검사

# 코드 포맷팅 (선택)
npm run lint        # ESLint 실행

# Git 커밋
git add .
git commit -m "✨ Feat: 기능명"
git push origin main

# 데이터베이스 초기화
# supabase/delete_data.sql 파일의 SQL을 Supabase Dashboard에서 실행
```

---

**설치가 완료되었습니다! 🎉**

이제 환경.md의 "개발 워크플로우" 섹션을 참고하여 개발을 시작하세요.
