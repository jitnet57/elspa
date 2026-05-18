(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,60882,e=>{"use strict";var t=e.i(43476),s=e.i(71645);e.s(["default",0,function(){let[e,i]=(0,s.useState)("overview"),l=[{id:"overview",title:"📋 비즈니스 개요",content:`
        회사명: 엘스파 (L'Spa)
        위치: 필리핀 세부
        업종: 스파 / Massage 운영업

        조직 규모:
        • 직원: 21명 이상 (Therapist 60여 명)
        • 베드: 86개 규모
        • 부대사업: 카페, 네일, 투어, 드라이버 서비스
      `},{id:"problems",title:"🔴 현재의 문제점",subsections:[{title:"(1) 예약·매칭·정산 전부 수기 & 엑셀",items:["다음 날 필요 Therapist 매니저가 수기로 예측·배정","손님-Therapist-베드 매칭을 종이 표에 손으로 기록","Massage 종류와 시술자 기록을 일일이 입력","이 기록이 그대로 일·주·월 정산 및 커미션 계산의 기초"]},{title:"(2) 인력 낭비",items:["매니저 2명이 상시 기록 업무에 매달려 있음","그 중 1명은 거의 기록 업무 전담","리셉션 3명이 출근 체크와 예약 응대 병행","대표가 정산·인원 예측·직원 관리에 한 달의 대부분 소진"]},{title:"(3) 데이터 분산 & 통합 부재",items:["데이터가 분산: 엑셀, 종이, 카톡, 수기 노트","클라우드 통합 안 됨 → 사장 외 실시간 확인 어려움","System 간 연동 없음 → 같은 Information 반복 입력","Massage 예약 솔루션 커스터마이징 불가, 엑셀 연동 안 됨"]},{title:"(4) 재정 위험",items:["정산 누락 및 기억 의존으로 인한 매출 누수","가이드 커미션: 한 달 뒤에 정산하러 옴 → 분실·누락 위험","수기 바우처 발행 → 기록 누락 가능성 높음","정확한 실시간 재무 현황 파악 불가능"]}]},{id:"goals",title:"🎯 해결 목표",subsections:[{title:"1차: 작업량 1/10 축소",items:["매니저의 수기 입력·예측·정산 노동을 1/10 수준으로","매니저 2명 중 최소 1명을 다른 업무로 전환 가능","예약 응대 자동화로 리셉션 운영 효율화"]},{title:"2차: 재정 투명성 확보",items:["정산 누락 차단 및 자동 추적","한 달 뒤 가이드 커미션도 자동 추적","실시간 매출·비용·이익 현황 파악","Therapist별 커미션 자동 산출"]},{title:"3차: 경영 집중도 향상",items:["대표가 직원 관리 노동에서 벗어남","마케팅과 신규 시장(중국·일본 관광객) 확장에 집중","전략적 의사결정을 위한 실시간 데이터 Dashboard","부대사업(카페, 네일) 동일 구조 적용 가능"]}]},{id:"tech-vision",title:"🚀 기술 비전",subsections:[{title:"아키텍처: 3-Tier 모바일 앱 구조",items:["👥 손님 앱 (Customer용): 예약, 결제, 평가","💆 Therapist 앱 (직원용): 일정, 팁, 정산","🚗 드라이버 앱 (배송용): Pick & Drop, GPS 추적","⚙️ 어드민 패널 (관리자용): 전체 Dashboard"]},{title:"1️⃣ 스마트 예약 & 인증",items:["QR 1개 → 구글 로그인 연동","국적 자동 인식 (로컬/한국/가이드 가격 자동 분기)","다국어 자동 응대 (한·영·일·중·필리피노)","바우처 디지털화 (QR 코드 기반 영수증)"]},{title:"2️⃣ AI 자동 매칭 & 배정",items:["손님 예약 → AI가 최적 Therapist·베드 자동 할당","Therapist 스킬·위치·가용성 종합 분석","매니저는 클릭 한 번으로 확인·승인 (기록 끝)","베드별 타이머 자동 시작 (시술 시간 자동 기록)"]},{title:"3️⃣ 대표용 AI 에이전트",items:["✅ 예약 현황 실시간 파악","✅ 다음 날 필요 Therapist 인원 자동 예측 (+α 설정값)","✅ 매출·비용 추산 (자동 계산)","✅ 이상 신호 감지 (예: 취소율 높음, 공실 많음)"]},{title:"4️⃣ 자동 정산 & 급여",items:["일일 정산: 매일 자동 계산 (수수료, 팁, 부대비용)","주간 정산: Therapist별 주급 자동 산출","월간 정산: 전체 P&L, 가이드·업체 커미션","클릭 한 번으로 은행 송금 (자동화 예정)"]},{title:"5️⃣ AI 음성·채팅 예약 상담",items:["24시간 AI 상담원 (전화 자동 응대)","채팅 에이전트 (카톡·라인·Telegram)","예약 확정 후 자동으로 System 입력","다국어 자동 번역 (손님과 매니저 언어 다를 때)"]},{title:"6️⃣ CRM & 마케팅 자동화",items:["라이프 이벤트 기반 프로모션 (Mother's Day, 여름 휴가)","Customer 등급별 자동 혜택 발송 (VIP→할인, 리뷰→포인트)",'방문 주기 분석 → "최근 안 오신 손님" 자동 재방문 권유',"추천 친구 가입 시 양쪽에 보너스 자동 지급"]},{title:"7️⃣ 드라이버 GPS & 배차",items:["GPS 기반 드라이버 실시간 위치 추적","손님 요청 → 가장 가까운 드라이버 자동 배차","Pick & Drop 기록 자동 입력","드라이버별 하루 수익·운행 거리 자동 계산"]},{title:"8️⃣ 오프라인 우선 구조",items:["필리핀의 느린 인터넷 환경 고려","앱이 오프라인에서도 데이터 입력 가능","와이파이/3G 연결 시 자동 동기화","데이터 충돌 시 자동 병합 로직"]},{title:"9️⃣ 향후 확장",items:["동일 구조를 카페 사업부에 복제 (테이블 예약, 메뉴 주문)","네일 사업부에 확대 (스타일리스트 예약, 네일 디자인 갤러리)","투어 사업부와 연동 (패키지 예약 + 교통 편성)","멀티 로케이션 지원 (다른 지역 지점 추가)"]}]},{id:"system-design",title:"🏗️ System 설계",subsections:[{title:"UI/UX 흐름",items:['✓ 손님: "예약" → QR 로그인 → Therapist 선택 → 베드 시각화 → 결제 → 완료','✓ Therapist: "일정 확인" → Customer Information 보기 → 체크인 → 시술 시작 → 종료 (자동 기록)','✓ 매니저: "오늘 Dashboard" → 예약 현황 한눈에 → 매칭 클릭 → 확인 (끝)','✓ 대표: "경영진 Dashboard" → KPI 그래프 → 예측값 → 액션 (마케팅, 채용 등)']},{title:"데이터베이스 구조",items:["사용자: 손님, Therapist, 드라이버, 매니저, 대표","예약: 날짜, 시간, 서비스 종류, Therapist, 베드, 상태","정산: 매출, 수수료, 팁, 환불, 가이드 커미션","재고: 베드 상태, 물품 사용량, 비용","분석: 일별/주별/월별 통계, Therapist 성과, Customer 만족도"]},{title:"인프라 & 기술스택",items:["백엔드: Node.js / Python (AI 에이전트)","데이터베이스: PostgreSQL + Redis (캐싱)","프론트엔드: React Native (iOS/Android)","클라우드: AWS / Google Cloud (필리핀 로컬 서버 옵션)","AI/ML: OpenAI API, TensorFlow (수요 예측, 매칭 알고리즘)"]},{title:"보안 & 컴플라이언스",items:["암호화: 모든 데이터 HTTPS 전송 및 DB 암호화","접근제어: 역할별 권한 관리 (RBAC)","감사 로그: 모든 거래 기록 및 인증 추적","필리핀 노동법: 급여, 세금, 보험 자동 계산"]}]},{id:"implementation",title:"📅 구현 로드맵",subsections:[{title:"Phase 1: MVP (2개월)",items:["Core: 예약 관리, Therapist 스케줄, 기본 정산","Admin: 일일 예약 현황 Dashboard","Scope 축소: 한국어 + 영어만, GPS 제외, AI 에이전트 베타"]},{title:"Phase 2: 자동화 (3개월)",items:["AI 매칭 알고리즘 적용","AI 음성 상담 (베타)","자동 정산 엔진","다국어 지원 확대"]},{title:"Phase 3: 확장 (3개월)",items:["CRM 마케팅 자동화","드라이버 GPS & 배차","카페/네일 사업부 통합","오프라인 모드 강화"]},{title:"Phase 4: 최적화 (지속적)",items:["사용자 피드백 기반 개선","ML 모델 성능 향상 (정확도)","확장성 개선 (멀티 로케이션)","모바일 앱 기능 추가"]}]},{id:"benefits",title:"💰 기대 효과",subsections:[{title:"비용 절감",items:["매니저 1명 풀타임 해제 → 월급 절감","리셉션 시간 30% 단축 → 다른 업무 전환","오류·누락으로 인한 매출 누수 차단","수기 정산으로 인한 인건비 감소"]},{title:"수익 증대",items:["AI 예측으로 최적 배정 → 서비스 품질 향상 → 재방문율 ↑","자동 CRM → 휴면 Customer 재활성화 → 매출 ↑","추천 System → 신규 Customer 유입 ↑","24시간 AI 상담 → 영업시간 외 예약 취약 해소"]},{title:"운영 효율화",items:["실시간 Dashboard → 빠른 의사결정","자동 정산 → 월말 스트레스 제거","멀티 태스킹 제거 → 직원 만족도 ↑","데이터 기반 관리 → 편의성 증대"]},{title:"전략적 성장",items:["대표 시간 확보 → 신규 시장(중국·일본) 마케팅 집중","부대사업(카페·네일) 확장 용이","데이터 기반 가격 책정 및 프로모션","장기 목표: 필리핀 내 체인 확대 가능"]}]},{id:"timeline",title:"⏰ 예상 일정",content:`
        총 프로젝트 기간: 8개월 (MVP → 본격 운영)

        📍 Milestone 1 (2개월): MVP 론칭
           → 예약\xb7정산 기본 기능 완성
           → 매니저 작업 50% 감소

        📍 Milestone 2 (5개월): AI 자동화 본격화
           → 예약\xb7매칭\xb7정산 완전 자동화
           → 매니저 작업 90% 감소
           → 대표 AI 에이전트 운영 시작

        📍 Milestone 3 (8개월): 확장 & 최적화
           → 부대사업 통합
           → GPS 드라이버 배차 시작
           → 다국어 완성

        예상 ROI: 3개월 내 초기 투자 회수
      `},{id:"success-metrics",title:"📊 성공 지표",content:`
        1️⃣ 운영 효율성
           • 예약 처리 시간: 5분 → 30초
           • 정산 시간: 2일 → 1시간
           • 매니저 업무 시간: 6시간/일 → 30분/일

        2️⃣ 재무 건전성
           • 월 매출 누락율: 5% → 0%
           • 정산 오류율: 3% → 0%
           • 가이드 커미션 추적율: 70% → 100%

        3️⃣ Customer 만족도
           • 예약 확정율: 85% → 95%
           • 평균 재방문 주기: 45일 → 35일
           • Customer 평가: 4.5★ → 4.8★

        4️⃣ 직원 만족도
           • 업무 스트레스 지수: 8/10 → 4/10
           • 이직률: 15% → 5% (예상)
           • 시간 외 업무: 30시간/월 → 5시간/월

        5️⃣ 사업 성장
           • 월 신규 Customer: 20명 → 50명
           • 신규 시장 진입: 0 → 중국\xb7일본
           • 부대사업 매출 기여도: 20% → 35%
      `}];return(0,t.jsx)("div",{className:"min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8",children:(0,t.jsxs)("div",{className:"max-w-5xl mx-auto",children:[(0,t.jsx)("div",{className:"mb-12",children:(0,t.jsxs)("div",{className:"flex items-center gap-4 mb-4",children:[(0,t.jsx)("div",{className:"w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center",children:(0,t.jsx)("span",{className:"text-2xl",children:"✨"})}),(0,t.jsxs)("div",{children:[(0,t.jsx)("h1",{className:"text-5xl font-bold text-white mb-2",children:"L'Spa 디지털 혁신 프로젝트"}),(0,t.jsx)("p",{className:"text-slate-400 text-lg",children:"필리핀 세부 스파 운영 자동화 · AI 기반 매칭 · 통합 정산 System"})]})]})}),(0,t.jsx)("div",{className:"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-8",children:l.map(s=>(0,t.jsxs)("button",{onClick:()=>i(e===s.id?null:s.id),className:`px-4 py-3 rounded-lg font-medium text-sm transition-all ${e===s.id?"bg-cyan-500 text-white shadow-lg":"bg-slate-700/50 text-slate-300 hover:bg-slate-600/50"}`,children:[s.title.split(" ")[0]," ",s.title.split(" ").slice(1).join(" ").substring(0,8)]},s.id))}),(0,t.jsx)("div",{className:"space-y-4",children:l.map(s=>(0,t.jsxs)("div",{className:`bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden transition-all ${e===s.id?"ring-2 ring-cyan-500/50":""}`,children:[(0,t.jsxs)("button",{onClick:()=>i(e===s.id?null:s.id),className:"w-full p-6 flex items-center justify-between hover:bg-slate-700/30 transition-colors",children:[(0,t.jsx)("h2",{className:"text-2xl font-bold text-white flex items-center gap-3",children:s.title}),(0,t.jsx)("svg",{className:`w-6 h-6 text-cyan-400 transition-transform ${e===s.id?"rotate-180":""}`,fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,t.jsx)("path",{strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:2,d:"M19 14l-7 7m0 0l-7-7m7 7V3"})})]}),e===s.id&&(0,t.jsx)("div",{className:"px-6 pb-6 border-t border-slate-700/50",children:"content"in s?(0,t.jsx)("div",{className:"whitespace-pre-line text-slate-300 leading-relaxed font-mono text-sm",children:s.content}):"subsections"in s&&(0,t.jsx)("div",{className:"space-y-6",children:s.subsections.map((e,s)=>(0,t.jsxs)("div",{children:[(0,t.jsx)("h3",{className:"text-lg font-bold text-cyan-400 mb-3",children:e.title}),(0,t.jsx)("ul",{className:"space-y-2",children:e.items.map((e,s)=>(0,t.jsxs)("li",{className:"flex items-start gap-3 text-slate-300",children:[(0,t.jsx)("span",{className:"text-cyan-400 font-bold min-w-fit mt-1",children:"•"}),(0,t.jsx)("span",{children:e})]},s))})]},s))})})]},s.id))}),(0,t.jsxs)("div",{className:"mt-12 p-8 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl",children:[(0,t.jsx)("h3",{className:"text-xl font-bold text-cyan-400 mb-3",children:"🎯 프로젝트 목표 달성 체크리스트"}),(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-4",children:[(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-2xl",children:"✅"}),(0,t.jsx)("span",{className:"text-slate-300",children:"매니저 작업 1/10로 축소"})]}),(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-2xl",children:"✅"}),(0,t.jsx)("span",{className:"text-slate-300",children:"정산 누락 0%"})]}),(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-2xl",children:"✅"}),(0,t.jsx)("span",{className:"text-slate-300",children:"실시간 데이터 통합"})]}),(0,t.jsxs)("div",{className:"flex items-center gap-3",children:[(0,t.jsx)("span",{className:"text-2xl",children:"✅"}),(0,t.jsx)("span",{className:"text-slate-300",children:"대표 경영 집중 가능"})]})]})]})]})})}])}]);