# 🚀 **Vercel 배포 가이드**

**상태**: ✅ **배포 준비 완료**  
**시간**: 5분 (로그인 포함)

---

## 📋 **배포 전 체크리스트**

✅ Vercel CLI 설치 완료  
✅ `vercel.json` 설정 파일 생성  
✅ GitHub에 커밋 완료  
✅ `public/` 디렉토리 준비  

---

## 🎯 **배포 단계**

### **Step 1: Vercel 로그인 (첫 배포 시만)**

```bash
cd e:\elspa
vercel login
```

**실행 후:**
1. 브라우저 자동 오픈 (GitHub 인증)
2. "Continue with GitHub" 클릭
3. ElSpa 레포 접근 권한 허용
4. 터미널로 돌아가면 로그인 완료

### **Step 2: 프로덕션 배포**

```bash
cd e:\elspa
vercel --prod
```

**질문 창이 나타나면:**

```
? Set up and deploy "e:\elspa"? [Y/n]
→ y (Enter)

? Which scope do you want to deploy to?
→ jitnet57 (자신의 계정 선택)

? Link to existing project?
→ n (새 프로젝트로 생성)

? What's your project's name?
→ elspa-docs (Enter)

? In which directory is your code located?
→ . (현재 디렉토리, 자동)

? Want to override the settings above?
→ n (기본 설정 사용)
```

### **Step 3: 배포 완료 확인**

```
✅ Deployment complete!

📍 Production URL: https://elspa-docs.vercel.app
🔗 Preview URLs: https://elspa-docs-[branch].vercel.app
📊 Dashboard: https://vercel.com/dashboard
```

---

## ⚡ **배포 후 확인**

### **1️⃣ 웹사이트 접속**

```
https://elspa-docs.vercel.app
```

**확인 항목:**
- ✅ 헤더: "ElSpa Business Strategy" 표시
- ✅ 통계: 111개 문서, Phase별 분포
- ✅ 검색: 문서 검색 기능 작동
- ✅ 필터: Phase 1-4 카테고리 필터 작동

### **2️⃣ 문서 확인**

```
클릭: BOARD-PITCH-DECK-2026-05-30.md
→ 문서 카드 표시
→ "GitHub에서 보기" 링크 작동
```

### **3️⃣ 반응형 테스트**

```
모바일에서 열기 (또는 브라우저 크기 축소)
→ 레이아웃 자동 조정
→ 모든 기능 작동
```

---

## 🔄 **업데이트 배포 (미래)**

새로운 문서를 추가하려면:

```bash
# 1. 문서 추가
cp new-document.md e:\elspa\public\docs\

# 2. HTML 업데이트 (필요 시)
python create_static_website.py

# 3. Git 커밋
cd e:\elspa
git add .
git commit -m "📚 새 문서 추가: [제목]"
git push origin main

# 4. Vercel 자동 배포
# → GitHub 연결되어 있으면 자동 배포됨!
# → 3-5분 후 https://elspa-docs.vercel.app에 반영
```

---

## 🔗 **배포 후 URL**

| 항목 | URL |
|------|-----|
| **메인 사이트** | https://elspa-docs.vercel.app |
| **검색 & 필터** | https://elspa-docs.vercel.app (메인에서) |
| **문서 목록** | https://elspa-docs.vercel.app#documents |
| **GitHub 소스** | https://github.com/jitnet57/elspa |
| **Vercel 대시보드** | https://vercel.com/dashboard |

---

## 📊 **배포 설정 정보**

```json
{
  "projectName": "elspa-docs",
  "outputDirectory": "public",
  "framework": "static",
  "buildCommand": "none",
  "environment": {
    "NEXT_PUBLIC_SITE_NAME": "ElSpa Business Strategy",
    "NEXT_PUBLIC_DOCS_COUNT": "111"
  }
}
```

---

## ⚠️ **문제 해결**

### **Q: "vercel not found" 오류**

```bash
npm install -g vercel  # Vercel CLI 재설치
```

### **Q: GitHub 인증 오류**

```bash
vercel logout
vercel login  # 다시 로그인
```

### **Q: 배포 후 404 오류**

```bash
# vercel.json 재확인
cat e:\elspa\vercel.json

# 또는 재배포
vercel --prod --force
```

### **Q: 검색 기능이 작동하지 않음**

→ 브라우저 개발자 도구 (F12) → Console 확인  
→ JavaScript 오류 있는지 확인  
→ 캐시 삭제 후 새로고침 (Ctrl+Shift+Delete)

---

## 🎊 **배포 완료!**

| 단계 | 상태 | 시간 |
|------|------|------|
| 1. Vercel CLI 설치 | ✅ | 1분 |
| 2. vercel.json 작성 | ✅ | 1분 |
| 3. git push | ✅ | 1분 |
| 4. vercel --prod 실행 | ⏳ | 5분 |
| 5. URL 확인 | ⏳ | 1분 |
| **총 소요 시간** | | **9분** |

---

## 🚀 **다음 단계**

1. **내일 09:00**: Board 회의 (BOARD-PITCH-DECK 사용)
2. **내일 10:00**: Week 1 실행 시작
3. **지속적 업데이트**: git push → Vercel 자동 배포

---

**배포 준비 완료! 🎉**

```
vercel --prod
```

**예상 시간**: 5분  
**예상 URL**: https://elspa-docs.vercel.app  
**예상 QR 코드**: Vercel 대시보드에서 생성 가능
