# 🚀 ElSpa 서버 자동 시작 가이드

> 초기 설치 이후, 간편하게 서버를 시작/종료하는 방법

---

## 📋 파일 구조

```
elspa/
├── start.sh           # Mac/Linux 시작 스크립트
├── stop.sh            # Mac/Linux 종료 스크립트
├── start.bat          # Windows 시작 배치 파일
├── stop.bat           # Windows 종료 배치 파일
├── setup.sh           # 초기 설치 (처음 1번만)
└── logs/              # 자동 생성 (로그 저장소)
    ├── backend.log    # 백엔드 로그
    └── frontend.log   # 프론트엔드 로그
```

---

## 🎯 빠른 시작

### Mac/Linux

1. 초기 설치 (처음 1번만)
   ```bash
   bash setup.sh
   ```

2. 서버 시작 (매번)
   ```bash
   bash start.sh
   ```

3. 서버 종료
   ```bash
   bash stop.sh
   ```

### Windows

1. 초기 설치 (처음 1번만)
   - Git Bash 열기
   - bash setup.sh 실행

2. 서버 시작 (매번)
   - start.bat 더블클릭

3. 서버 종료
   - stop.bat 더블클릭

---

## 📱 접속

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## ❌ Port already in use

```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
bash start.sh

# Windows - CMD
taskkill /F /IM node.exe
taskkill /F /IM python.exe
start.bat
```

더 자세한 정보는 INSTALL.md를 참고하세요.
