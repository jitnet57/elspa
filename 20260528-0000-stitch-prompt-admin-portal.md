# 🌌 ElSpa Admin Portal - Stitch AI Prompt Template

본 문서는 ElSpa의 기존 HTML 어드민 사이트 또는 랜딩 페이지 소스 코드를 Next.js + React 19 + TypeScript + Tailwind CSS 4 기반의 초프리미엄 미드나잇 글래스모피즘 컴포넌트로 완벽하게 변환(Stitch)하기 위해 설계된 **최첨단 AI 프롬프트 명령 템플릿**입니다.

이 프롬프트 본문을 복사하여 ChatGPT, Claude, Gemini 등의 AI 모델에 입력 소스 코드와 함께 제공하면, ElSpa의 기술 스택 및 디자인 규격에 맞추어 주석이 완벽히 포함된 100% 작동 가능한 React 컴포넌트를 얻을 수 있습니다.

---

## 📝 Stitch AI 변환용 프롬프트 본문 (Prompt Text)

아래의 `[프롬프트 시작]`부터 `[프롬프트 끝]`까지 복사하여 사용하세요.

---

### [프롬프트 시작]

**[Role & Mission]**
당신은 최고의 프론트엔드 아키텍트이자 UI/UX 마술사입니다. 제공되는 **[HTML 원본 소스]**를 ElSpa 프로젝트의 기술 스택과 프리미엄 디자인 시스템에 완벽하게 일치하는 **Next.js + React 19 + TypeScript + Tailwind CSS 4** 컴포넌트로 변환(Stitch)해야 합니다.

**[Technical Stack Requirements]**
1. **Framework & Language**: Next.js (App Router, 'use client'), React 19, TypeScript.
2. **Styling**: Tailwind CSS 4 기반의 유틸리티 클래스 적용.
3. **Routing (Static Export 대응)**: Cloudflare Pages의 정적 배포 구조에서 404 에러가 발생하는 것을 방지하기 위해, 내부 네비게이션 링크(`/admin`, `/admin/therapists` 등)는 반드시 끝에 `.html`을 명시하여 `/admin.html`, `/admin/therapists.html`과 같이 정적 주소로 매핑하세요.
4. **State Management**: React `useState`를 우선 사용하고, 복잡한 글로벌 상태가 필요한 부분은 Zustand 5 라이브러리 연동 구조로 설계하세요.
5. **Code Quality**: 모든 함수와 주요 컴포넌트에 한국어 주석(적요)을 📌함수명, 📋목적, 🔧매개변수, 📤반환값, 📅작성일, ⚠️주의사항 형식으로 아주 친절하게 기술해 주세요.

**[Premium Midnight Cyber Design Tokens]**
변환되는 UI는 어설픈 MVP 디자인이 아닌, 사용자를 압도할 수 있는 **초프리미엄 하이엔드 테마**로 빌드되어야 합니다. 다음 디자인 토큰을 반드시 엄격히 준수하세요:
1. **Background**: 미드나잇 인디고/퍼플 우주 방사형 그라데이션 백드롭 적용
   - `bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950`
2. **Space Nebula Lights**: 우주 안개 빛 네온 효과 백그라운드 블러 레이어 삽입
   - `absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse`
3. **Glassmorphism Frost Cards**: 반투명 글래스모피즘 카드 레이아웃
   - `bg-slate-900/40 backdrop-blur-md border border-indigo-500/20 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)]`
4. **Neon Accents & Glows**: 형광 시안/민트(#22d3ee) 및 네온 오렌지 포인트 컬러 탑재
   - 텍스트 섀도우: `filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] font-black text-cyan-400`
5. **Micro-animations**: 호버 상태에서의 세련된 크기 및 네온 오프셋 변경 효과 적용
   - `transition-all hover:border-indigo-500/60 hover:shadow-[0_0_30px_-5px_rgba(99,102,241,0.25)] hover:-translate-y-1 active:scale-95 duration-300`

**[Interactive Features to Build]**
HTML에 정적으로 정의되어 있는 모든 데이터와 메뉴들을 React의 인터랙티브한 상태로 격상시켜야 합니다:
1. **Security Access Gate**: 비밀번호 입력 모달 또는 화면을 기본 탑재하고, `password === 'admin123'` 검증을 통과해야만 대시보드 메인 화면이 노출되는 라우트 가드 상태(`useState`)를 구현하세요.
2. **Interactive Payroll Panel**: 대시보드 내에 급여 정산 테이블(Embedded Payroll Summary)을 내장하고, 다음과 같은 실시간 인터랙션을 구현하세요:
   - **실시간 검색**: 사번(ID) 및 이름 기준 실시간 필터링.
   - **직군 필터링**: '전체', '테라피스트', '정직원' 탭 클릭 시 동적 렌더링.
   - **상세 한글 적요 아코디언**: 각 직원의 'Verify ▼' 버튼 클릭 시, 해당 직원의 수입/차감 내역이 상세하게 기술된 한국어 적요란(`notes`)이 부드럽게 토글 확장/축소되는 기능(`expandedNotesId` 상태 연동).
3. **Mock Data Set**: 다음 ElSpa의 실제 비즈니스 검증용 데이터를 컴포넌트 내부에 배열 객체로 삽입하세요:
   - `TH-01 (Therapist_Ana)`: 기본급 15,000, 커미션 3,800 (38세션), 보건소 차감 -500, 13개월 누적 차감 -50,000, Net Pay: 0 (음수 방지 안전장치 작동).
   - `TH-03 (Therapist_Chloe)`: 기본급 15,000, 커미션 4,000 (40세션), CA 차감 -5,000, 보건소 차감 -500, 13개월 누적 차감 -45,000, Net Pay: 0 (음수 방지 안전장치 작동).
   - `EMP-01 (Staff_Kevin / Manager)`: 기본급 30,000, 결근 차감 -2,000 (5/20 1일 결근 반영), 13개월 누적 차감 -162,500, Net Pay: 0 (음수 방지 안전장치 작동).
   - `EMP-03 (Staff_Mason / Driver)`: 기본급 20,000, OT 수당 70, 식대 200, 13개월 누적 차감 -80,000 (PENDING CA는 차감 제외), Net Pay: 0 (음수 방지 안전장치 작동).

**[Stitch Conversion Steps]**
1. **Step 1. Code Analysis**: 제공된 HTML의 시맨틱 태그 구조와 CSS 스타일(Inline 또는 외부 CSS)을 면밀히 분석합니다.
2. **Step 2. Architecture Setup**: React 19 및 TypeScript의 엄격한 타입 준수를 위한 타입 정의(`interface`)를 설계합니다.
3. **Step 3. CSS Mapping**: 모든 스타일을 Tailwind CSS 4 유틸리티 클래스로 1:1 리매핑하고, 앞서 선언한 프리미엄 미드나잇 테마 스타일로 대치합니다.
4. **Step 4. Dynamic Refactoring**: 정적 요소를 동적 맵핑(`map`), 조건부 렌더링(`&&`, `? :`), 그리고 필터링 함수로 전면 재코딩합니다.
5. **Step 5. Commenting & Polishing**: 한국어로 이해하기 쉽도록 친절한 주석을 보강하고 전체 빌드가 깨지지 않는 독립형 컴포넌트로 완성합니다.

---

### [변환할 HTML 원본 소스]
 여기에 변환하고자 하는 HTML 파일의 소스 코드를 붙여넣어 주세요. 

---

### [출력 가이드라인]
- 부가적인 설명 없이 즉시 복사해서 사용할 수 있는 완전한 `.tsx` 코드 블록 하나로만 답변을 시작해 주세요.
- 코드 상단에는 한국어로 작성된 친절한 주석(적요)을 반드시 달아주세요.
- React 19와 최신 Next.js 규칙에 어긋나는 구식 API나 window 객체 직접 참조(SSR 에러 유발 요소)는 철저히 배제해 주세요.

### [프롬프트 끝]

---

## 🚀 Stitch AI 프롬프트 사용 방법 (User Guide)

자, 학생 여러분! 이 템플릿 프롬프트를 어떻게 사용하는지 차근차근 알려드릴게요! 😊

1. **AI 인터페이스 접속**: Claude 3.5 Sonnet이나 ChatGPT-4o 같은 고성능 AI 채팅창을 엽니다.
2. **프롬프트 및 소스 복사**: 위의 `[프롬프트 시작]`부터 `[프롬프트 끝]`까지 내용을 복사하여 프롬프트 입력창에 붙여넣습니다.
3. **HTML 소스 붙여넣기**: `[변환할 HTML 원본 소스]`라고 적혀 있는 곳 아래에, 변환하고 싶은 HTML 코드(예: `admin-landing.html` 등)를 그대로 붙여넣습니다.
4. **실행 및 변환**: AI에게 전송하면, AI가 자동으로 글래스모피즘 어드민 포털 스타일과 급여 테이블, 로그인 가이드 상태가 포함된 프리미엄 Next.js 컴포넌트를 한 번에 생성해 줄 것입니다!
5. **프로젝트 적용**: 생성된 코드 블록을 복사하여 `frontend/src/app/admin/page.tsx` 또는 원하는 경로에 붙여넣고 저장하면 즉시 환상적인 디자인이 화면에 펼쳐집니다! ✨
