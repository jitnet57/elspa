# 🚀 ElSpa 백엔드 서버 설치 가이드

> ElSpa FastAPI 백엔드를 서버에 설치하고 자동 실행하도록 설정하는 완벽 가이드

---

## 📋 사전 준비

### Windows
- Python 3.10+ ([python.org](https://www.python.org/downloads/) 다운로드)
- 관리자 권한 (선택사항)
- 명령 프롬프트 또는 PowerShell

### Mac
- Python 3.10+ (`brew install python3`)
- Terminal

### Linux (Ubuntu/Debian)
- Python 3.10+ (`apt-get install python3`)
- bash 쉘

---

## 🛠️ 설치 방법

### 1️⃣ 저장소 복제

```bash
git clone https://github.com/jitnet57/elspa.git
cd elspa
```

### 2️⃣ 설치 스크립트 실행

#### **Windows**
```bash
install-server.bat
```

#### **Mac/Linux**
```bash
chmod +x install-server.sh
./install-server.sh
```

---

## ⚙️ 환경 설정 (.env)

설치 후 `.env` 파일을 편집합니다:

```bash
# 데이터베이스 (PostgreSQL/Supabase)
DATABASE_URL=postgresql://user:password@host:5432/elspa

# Supabase (ElSpa 데이터베이스)
SUPABASE_URL=https://qnqhqrpvqjhqarbufzqd.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (Google Sheets 저장용)
GOOGLE_CLIENT_ID=104694066545-vtgespl9ho6b4gmcolgdrpuloankttgq.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_secret_from_google_cloud

# 서버
HOST=0.0.0.0           # 모든 IP에서 접근 가능
PORT=8000
ENVIRONMENT=production
```

### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성: "ElSpa"
3. "OAuth 2.0 클라이언트 ID" 생성
4. 허용 리다이렉트 URI: `http://your-server-ip:8000/auth/google/callback`
5. 클라이언트 ID/SECRET을 `.env`에 입력

---

## 🚀 백엔드 시작

### 첫 실행 (수동)

#### **Windows**
```bash
venv\Scripts\activate.bat
python main.py
```

#### **Mac/Linux**
```bash
source venv/bin/activate
python main.py
```

브라우저에서 확인:
```
http://localhost:8000        # API
http://localhost:8000/docs   # Swagger API 문서
http://localhost:8000/health # 헬스체크
```

---

## 🔄 자동 실행 설정

### Linux (systemd)

설치 스크립트가 자동으로 설정합니다:

```bash
# 시작
sudo systemctl start elspa-backend

# 중지
sudo systemctl stop elspa-backend

# 상태 확인
sudo systemctl status elspa-backend

# 자동 시작 활성화
sudo systemctl enable elspa-backend

# 로그 확인
sudo journalctl -u elspa-backend -f
```

### Mac (launchd)

설치 스크립트가 자동으로 설정합니다:

```bash
# 시작
launchctl load ~/Library/LaunchAgents/com.elspa.backend.plist

# 중지
launchctl unload ~/Library/LaunchAgents/com.elspa.backend.plist

# 로그 확인
tail -f /tmp/elspa-backend.out.log
```

### Windows (작업 스케줄러)

#### 방법 A: 작업 스케줄러 (권장)

1. `Win + R` → `taskschd.msc` 실행
2. "기본 작업 만들기"
3. 이름: "ElSpa Backend"
4. 트리거: "컴퓨터 시작 시"
5. 작업:
   ```
   프로그램: C:\path\to\elspa\venv\Scripts\python.exe
   인수: main.py
   시작: C:\path\to\elspa
   ```

#### 방법 B: NSSM (Non-Sucking Service Manager)

```bash
# NSSM 다운로드: https://nssm.cc/download

# 서비스 등록
nssm install ElSpaBackend "C:\path\to\elspa\venv\Scripts\python.exe" "main.py"

# 서비스 시작
net start ElSpaBackend

# 서비스 중지
net stop ElSpaBackend

# 서비스 제거
nssm remove ElSpaBackend
```

---

## 🐛 문제 해결

### Python을 찾을 수 없음
```bash
# PATH에 Python 추가 (Windows)
# 제어판 → 시스템 → 고급 시스템 설정 → 환경 변수 → PATH
# "C:\Program Files\Python310" 추가
```

### 포트 이미 사용 중
```bash
# 포트 변경
PORT=8001 python main.py

# 또는 기존 프로세스 종료
lsof -i :8000          # Mac/Linux
taskkill /PID xxxx     # Windows
```

### 데이터베이스 연결 실패
```bash
# .env 확인
DATABASE_URL=postgresql://user:password@localhost:5432/elspa

# Supabase 활성화 확인
SUPABASE_URL, SUPABASE_KEY 설정 확인
```

### Google OAuth 오류
```bash
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET 확인
# 리다이렉트 URI 설정 확인: http://server-ip:8000/auth/google/callback
```

---

## 📊 서버 모니터링

### 헬스 체크
```bash
curl http://localhost:8000/health
```

### API 테스트
```bash
curl http://localhost:8000/docs
```

### 데이터베이스 상태
```bash
# Supabase 대시보드 확인
https://app.supabase.com/
```

---

## 🔐 보안 설정

```bash
# .env에서 ENVIRONMENT=production 설정
ENVIRONMENT=production

# SSL/TLS 설정 (권장)
# Nginx 또는 Apache 리버스 프록시 사용
# 또는 Let's Encrypt로 무료 SSL 인증서 발급
```

### Nginx 설정 예시
```nginx
server {
    listen 443 ssl http2;
    server_name api.elspa.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 📈 성능 최적화

### Gunicorn으로 프로덕션 실행

```bash
# 설치
pip install gunicorn

# 실행 (4 workers, 2 threads)
gunicorn main:app --workers 4 --threads 2 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 데이터베이스 풀 설정
```python
# app/config.py
DATABASE_POOL_SIZE = 20        # 기본값: 5
DATABASE_MAX_OVERFLOW = 10     # 기본값: 10
```

---

## 🆘 지원

문제가 있으면:
1. 로그 확인: `tail -f /tmp/elspa-backend.out.log`
2. GitHub Issues: https://github.com/jitnet57/elspa/issues
3. 환경 변수 재확인: `cat .env`

---

**설치 완료! 🎉**

프론트엔드에서 `NEXT_PUBLIC_API_URL=http://your-server-ip:8000` 설정하면 연동됩니다.
