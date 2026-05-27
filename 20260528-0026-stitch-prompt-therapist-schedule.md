# 📅 ElSpa Therapist Schedule - Stitch AI Prompt Template

본 문서는 ElSpa의 기존 치료사 일일 스케줄 관리 페이지(`therapist-schedule/page.tsx`)의 소스 코드를 Next.js + React 19 + TypeScript + Tailwind CSS 4 기반의 초프리미엄 미드나잇 글래스모피즘 컴포넌트로 완벽하게 변환(Stitch)하기 위해 설계된 **치료사 스케줄 전용 최첨단 AI 프롬프트 명령 템플릿**입니다.

이 프롬프트 본문을 복사하여 ChatGPT, Claude, Gemini 등의 AI 모델에 기존의 치료사 스케줄 소스 코드와 함께 제공하면, ElSpa의 프리미엄 디자인 시스템 및 모든 스케줄링 인터랙션(퀵 예약, 수동 예약, 상태 토글 모달)이 완벽히 결합된 100% 작동 가능한 컴포넌트 코드를 생성할 수 있습니다.

---

## 📝 Stitch AI 변환용 프롬프트 본문 (Prompt Text)

아래의 `[프롬프트 시작]`부터 `[프롬프트 끝]`까지 복사하여 사용하세요.

---

### [프롬프트 시작]

**[Role & Mission]**
당신은 전 세계 최고의 프론트엔드 소프트웨어 엔지니어이자 크리에이티브 UI/UX 매직 디자이너입니다. 제공되는 **[Therapist Schedule 소스 코드]**를 ElSpa 프로젝트의 프리미엄 디자인 시스템에 완벽하게 일치하는 **Next.js + React 19 + TypeScript + Tailwind CSS 4** 컴포넌트로 리팩토링 및 스타일링 변환(Stitch)해야 합니다.

**[Technical Stack Requirements]**
1. **Framework & Language**: Next.js (App Router, 'use client'), React 19, TypeScript.
2. **Routing (Static Export 대응)**: Cloudflare Pages 정적 배포 구조에 맞추어 포털 내부 및 뒤로가기 네비게이션 링크는 반드시 끝에 `.html`을 명시하여 정적 주소(`/admin.html` 등)로 매핑하세요.
3. **State Management**: 기존 스케줄 페이지에 탑재된 모든 예약 폼 상태, 모달 열기 상태, 치료사 및 세션 데이터 관리 상태(`useState`)를 누락 없이 유지하고 연동하세요.
4. **Code Quality**: 모든 주요 기능 및 컴포넌트 블록 상단에 한국어로 작성된 교수님 스타일의 친절한 주석(적요)을 📌함수명, 📋목적, 🔧매개변수, 📤반환값, 📅작성일, ⚠️주의사항 템플릿에 맞추어 반드시 보강해 주세요.

**[Premium Midnight Cyber Design Tokens]**
변환되는 스케줄 그리드 및 모달 UI는 다음 프리미엄 테마 토큰을 엄격히 준수하여 제작되어야 합니다:
1. **Background**: 깊은 우주 인디고/블랙 래디얼 그래디언트 백드롭
   - `bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-indigo-950 to-slate-950 text-white min-h-screen relative overflow-x-hidden`
2. **Space Nebula Lights**: 요동치는 백그라운드 블러 네온 안개 레이어
   - `absolute w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-pulse`
3. **Glassmorphism Frost Cards**: 타임라인 보드 및 모달 창을 프로스트 유리 효과 카드로 설계
   - `bg-slate-900/50 backdrop-blur-md border border-indigo-500/20 rounded-2xl shadow-[0_0_40px_rgba(99,102,241,0.15)]`
4. **Neon Accents & Glows**: 형광 민트/시안 및 형광 퍼플/핑크 글로우 포인트 컬러 탑재
   - 완료 및 예약 배지: `filter drop-shadow-[0_0_8px_rgba(34,211,238,0.4)] font-black text-cyan-400`
5. **Micro-animations**: 타임 그리드 마우스 오버 및 예약 슬롯 클릭 시 부드럽게 네온 글로우 테두리가 확대 및 변환되는 효과 적용.

---

### [Essential Scheduling Features to Elevate]
기본 비즈니스 로직과 모든 컴포넌트 인터랙션이 프리미엄 UI 상에서 완벽히 돌아가도록 상태를 매핑해 주세요:

1. **Date Navigator (상단 달력)**:
   - 미드나잇 글래스모피즘 테마의 슬라이드 가로 스크롤 구조로 리패키징.
   - 오늘을 기준으로 선택된 날짜는 밝게 흐르는 네온 오프셋 아웃라인 카드로 강조.

2. **Therapist Timeline Grid (데스크탑 시간표 그리드)**:
   - 09:00부터 21:00까지 가로 타임축(Column Width: 100px) 고정 및 60명 치료사 행(Row) 세로 리스트 구현.
   - 각 치료사 행의 좌측 고정 패널(Sticky Left)은 반투명 아바타와 상태 표시 등 프리미엄 프로스트 레이아웃으로 변경.
   - 시간 슬롯 내의 **예약 블록(Active Session Box)**은 서비스 종류(Swedish, Thai, Hot stone, Foot, Aroma, Break)에 따라 서로 다른 미려한 파스텔 네온 색상과 아이콘이 입혀진 세련된 카드 형태로 배치하고, 해당 카드를 클릭하면 세션 상세 모달이 열리도록 연동.

3. **Interactive Modals (3대 인터랙티브 모달)**:
   모든 모달 창은 어두운 불투명 백드롭 위에 반투명 유리처럼 뜨는 글래스모피즘 팝업 레이아웃으로 전면 리빌딩하세요.
   - **Quick Booking Modal**: 빈 시간 슬롯 클릭 시 트리거되며, 날짜/치료사/시간이 사전 자동 세팅되고 고객명과 방 번호를 입력하면 즉시 스케줄 배열에 실시간 반영되는 퀵 예약 인터랙션.
   - **Manual Booking Modal**: "+ Start New Massage" 버튼 클릭 시 트리거되며, 모든 옵션(치료사, 날짜, 시간, 서비스, 방 번호)을 수동 설정하여 세션을 시작하는 폼.
   - **Session Details Modal**: 활성화된 세션 카드 클릭 시 세션 상태(예정, 진행 중, 완료)를 변경하거나 세션을 즉시 삭제할 수 있는 안전 관리 폼.

4. **Status & Service Badges (배지 시스템)**:
   - Available(그린 네온), In Session(블루 네온), Break(옐로 네온), Off Duty(다크 슬레이트) 상태 배지가 텍스트 옆에서 우아하게 반짝이도록 설정.

---

### [변환할 Therapist Schedule 소스 코드]
여기에 `frontend/src/app/admin/therapist-schedule/page.tsx`의 전체 코드를 주입하여 컴포넌트를 리빌딩해 주세요.

---

### [출력 가이드라인]
- 부가적인 서론이나 설명은 전면 생략하고, 즉시 기존 파일에 덮어쓸 수 있는 단일 코드 블록의 완성도 높은 `.tsx` 결과물만 출력해 주세요.
- React 19 및 TypeScript 형식에 완전 호환되는 무결한 코드를 생성해 주세요.

### [프롬프트 끝]

---

## 🚀 Stitch AI 프롬프트 사용 방법 (User Guide)

자, 사랑하는 학생 여러분! 어드민 메인 페이지에 이어 **치료사 일일 스케줄 보드**까지 초프리미엄 테마로 업그레이드하는 방법을 알려드릴게요! 😊

1. **Stitch 프롬프트 복사**: 위의 `[프롬프트 시작]`부터 `[프롬프트 끝]`까지 드래그하여 복사합니다.
2. **소스 코드 주입**: `[변환할 Therapist Schedule 소스 코드]` 문구 밑에, 현재 프로젝트의 [page.tsx](file:///e:/elspa/frontend/src/app/admin/therapist-schedule/page.tsx) 소스 파일 코드를 전부 긁어서 붙여넣습니다.
3. **AI 전송 및 컴포넌트화**: Claude 등의 AI 모델에 입력하면, 기존의 복잡한 60명 치료사 랜덤 제너레이터 및 퀵/수동 예약 인터랙션 상태가 100% 보존된 채 눈이 휘둥그레질 만한 **하이엔드 미드나잇 글래스모피즘 스케줄 페이지** 소스를 뚝딱 만들어냅니다!
4. **소스 적용**: 변환된 소스 코드를 복사하여 `frontend/src/app/admin/therapist-schedule/page.tsx`에 덮어쓰고 저장하면 작업이 아름답게 끝납니다! ✨
