# 🚀 ElSpa 백엔드 로컬 설치 가이드

> ElSpa FastAPI 백엔드 + Google Sheets 자동 저장을 로컬에서 설치하고 실행

---

## 📋 사전 준비

### Windows
- Python 3.10+ ([python.org](https://www.python.org/downloads/))
- 명령 프롬프트 또는 PowerShell

### Mac/Linux
- Python 3.10+ (`brew install python3`)
- bash 또는 zsh

---

## 🛠️ 설치 방법

### 1️⃣ 저장소 복제

```bash
git clone https://github.com/jitnet57/elspa.git
cd elspa
```

### 2️⃣ 설치 스크립트 실행

#### Windows
```bash
install-server.bat
```

#### Mac/Linux
```bash
chmod +x install-server.sh
./install-server.sh
```

---

## ⚙️ 환경 설정 (.env)

설치 후 `.env` 파일을 편집합니다:

```bash
# Supabase (데이터베이스)
SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (Google Sheets 저장용 - 필수)
GOOGLE_CLIENT_ID=104694066545-vtgespl9ho6b4gmcolgdrpuloankttgq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_here

# 서버
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
```

### Google OAuth 설정 (필수!)

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성: "ElSpa"
3. "OAuth 2.0 클라이언트 ID" 생성
4. 애플리케이션 타입: **웹 애플리케이션**
5. 승인된 리다이렉트 URI 추가:
   ```
   http://localhost:8000/auth/google/callback
   ```
6. 클라이언트 ID와 SECRET을 `.env`에 붙여넣기

---

## 🚀 백엔드 시작

### Windows
```bash
venv\Scripts\activate.bat
python main.py
```

### Mac/Linux
```bash
source venv/bin/activate
python main.py
```

### 확인
```bash
# 브라우저에서
http://localhost:8000        # API 확인
http://localhost:8000/health # 헬스 체크
http://localhost:8000/docs   # Swagger 문서
```

---

## 🔄 자동 실행 설정 (선택사항)

### Linux (systemd)
```bash
# 설치 스크립트가 자동으로 설정합니다
sudo systemctl start elspa-backend
sudo systemctl status elspa-backend
```

### Mac (launchd)
```bash
# 설치 스크립트가 자동으로 설정합니다
# 로그 확인: tail -f /tmp/elspa-backend.out.log
```

### Windows (작업 스케줄러)
1. `Win + R` → `taskschd.msc`
2. "기본 작업 만들기"
3. 트리거: "컴퓨터 시작 시"
4. 작업:
   ```
   프로그램: C:\path\to\elspa\venv\Scripts\python.exe
   인수: main.py
   시작: C:\path\to\elspa
   ```

---

## 🔗 프론트엔드 연결

설정 파일에서 백엔드 URL 입력:

```bash
# frontend/.env.local 또는 .env.production
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🐛 문제 해결

### Python을 찾을 수 없음
```bash
# PATH에 Python 추가
# Windows: 제어판 → 환경 변수 → PATH에 Python 경로 추가
```

### 포트 이미 사용 중
```bash
# 포트 변경
PORT=8001 python main.py

# 또는 기존 프로세스 종료
lsof -i :8000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Google OAuth 오류
```bash
# .env 확인
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
# 리다이렉트 URI: http://localhost:8000/auth/google/callback
```

### Supabase 연결 실패
```bash
# .env 확인
SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
SUPABASE_KEY=... (복사된 anon 키)
```

---

## ✨ 지원되는 기능

✅ **Google Sheets 자동 저장**
- 설정 가능한 간격 (15/30/60/120분)
- 예약, 출근, 비용 자동 저장

✅ **Google Drive 수동 저장**
- "Save to Drive" 버튼으로 수동 저장

✅ **실시간 데이터 동기화**
- Supabase를 통한 실시간 데이터 연동

---

**모든 준비가 완료되었습니다!** 🎉

프론트엔드와 연결하여 ElSpa를 사용할 수 있습니다.
