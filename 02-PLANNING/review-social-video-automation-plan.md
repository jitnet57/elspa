# ElSpa 고객 후기 & 자동 마케팅 영상 시스템
**Review Collection & Gemini Vids Auto-Generation Planning | Date: 2026-05-05**

---

## 📋 목차
1. [개요](#1-개요)
2. [고객 후기 시스템](#2-고객-후기-시스템)
3. [Facebook 자동 업로드](#3-facebook-자동-업로드)
4. [Gemini Vids 영상 자동 생성](#4-gemini-vids-영상-자동-생성)
5. [Social Media 자동 업로드](#5-social-media-자동-업로드)
6. [Admin 관리 대시보드](#6-admin-관리-대시보드)
7. [아키텍처 & 데이터 모델](#7-아키텍처--데이터-모델)
8. [프로세스 흐름도](#8-프로세스-흐름도)
9. [Epic/Stories 추가](#9-epicstories-추가)

---

## 1. 개요

### 1.1 요구사항 정리

```
기능 1: 고객 후기 수집 & 표시
├─ 서비스 완료 후 자동 리뷰 요청
├─ User Site에 후기 섹션 (최신순, 평점순)
├─ 고객 프로필 + 평점 + 텍스트 + 사진 (옵션)
└─ 검증된 리뷰만 표시 (Admin 승인)

기능 2: Facebook 자동 업로드
├─ 새 리뷰 생성 → Facebook 자동 포스트
├─ 포맷: "😊 고객 후기: [이름] | ⭐⭐⭐⭐⭐ [내용]"
├─ 월간 총평 (리뷰 수, 평균 평점)
└─ Facebook Insights 연동 (좋아요, 댓글 추적)

기능 3: Gemini Vids 자동 영상 생성
├─ Admin이 영상 생성 설정
├─ Gemini Vids로 자동 생성 (30-60초)
├─ 템플릿: 후기 쇼케이스, 서비스 소개, 프로모션
└─ AI 나레이션 (한국어/영어)

기능 4: Social Media 자동 업로드
├─ TikTok: 20-60초 숏폼 (자동 업로드)
├─ Facebook: 30-60초 (시드 & 클립)
├─ YouTube: 1-3분 (롱폼, 플레이리스트)
├─ 스케줄링: 매일/주간/월간
└─ 자동 해시태그 & 설명

목표:
✅ 리뷰 수집 자동화 (후기 증가)
✅ 마케팅 영상 자동화 (제작비 절감)
✅ 소셜 미디어 자동 관리 (시간 절감)
✅ 사용자 생성 콘텐츠 (UGC) 활용
✅ 오가닉 리치 증대
```

### 1.2 비즈니스 임팩트

```
현재 상황:
- 마케팅 영상 제작: 전문가 필요 (비용 높음)
- 리뷰 수집: 수동 (회수율 낮음)
- 소셜 미디어: 수동 업로드 (빈번함)

개선 후:
- 영상 제작: Gemini Vids (거의 무료)
- 리뷰 수집: 자동 요청 (회수율 80%+)
- 소셜 미디어: 자동 업로드 (0 수동 작업)

예상 효과:
├─ 마케팅 비용 -40% (영상 제작)
├─ 리뷰 수 +100% (자동 요청)
├─ 소셜 팔로워 +30% (3개월)
├─ 오가닉 리치 +50% (정기 업로드)
└─ 신규 고객 유입 +20%
```

---

## 2. 고객 후기 시스템

### 2.1 리뷰 수집 프로세스

```
Timeline:

Day 0: 서비스 완료
┌────────────────────────────┐
│ 1. 테라피스트가 [완료] 클릭│
│ 2. Booking status = completed
│ 3. 자동 알림 발송 (고객)   │
└────────┬───────────────────┘
         │ 2시간 후 (User Site)

Day 0+2h: 리뷰 요청 알림
┌────────────────────────────┐
│ Push: "서비스 어땠나요?"   │
│ Email: 리뷰 링크           │
│ SMS: 간단 요청             │
│                            │
│ [지금 리뷰 작성]          │
└────────┬───────────────────┘
         │

Day 1-7: 리뷰 작성 가능
┌────────────────────────────┐
│ User Site - 마이페이지     │
│ [리뷰 작성] 버튼           │
│                            │
│ 폼:                        │
│ ├─ 평점 (1-5별)           │
│ ├─ 제목 (선택)            │
│ ├─ 내용 (최소 10자)       │
│ ├─ 사진 업로드 (최대 3장) │
│ └─ 공개 여부 (체크박스)    │
│                            │
│ [저장] [캔슬]             │
└────────┬───────────────────┘
         │

Day 1-7: Admin 검토
┌────────────────────────────┐
│ Admin Site - 리뷰 관리     │
│                            │
│ 대기중 리뷰: 1개           │
│ ├─ [이름] ⭐⭐⭐⭐⭐     │
│ │ "정말 좋았어요!"        │
│ │ [승인] [거부] [수정]    │
│ │ 사진 3장 미리보기       │
│ └─ 공개 일정: 즉시        │
│                            │
│ 승인됨: 42개               │
│ 거부됨: 2개                │
└────────┬───────────────────┘
         │

Day 8: 자동 공개 & Facebook 업로드
┌────────────────────────────┐
│ 1. User Site에 표시       │
│ 2. Facebook 자동 포스트   │
│ 3. 고객 알림              │
│    "리뷰가 게시되었어요!" │
└────────────────────────────┘
```

### 2.2 User Site - 후기 섹션 (Tailwind UI)

```
┌─────────────────────────────────────────────┐
│ 📍 고객 후기                                 │
├─────────────────────────────────────────────┤
│                                             │
│ ⭐ 평균 평점: 4.8/5.0 (148개 리뷰)        │
│                                             │
│ 필터: [최신순▼] [평점높음▼] [사진있는것▼] │
│                                             │
│ ┌───────────────────────────────────────┐ │
│ │ 👤 김영희 | ⭐⭐⭐⭐⭐              │ │
│ │ "스웨디시 정말 좋아요!"               │ │
│ │                                       │ │
│ │ 마사지를 받고 몸이 정말 가벼워졌어요. │
│ │ 손기술도 훌륭하고 친절하셨습니다!    │
│ │ 다음달에 또 올거에요 ☺️             │ │
│ │                                       │ │
│ │ 📅 2026-05-01 | 서비스: 스웨디시 60분 │
│ │                                       │ │
│ │ [좋아요 23] [공유] [신고]            │ │
│ │                                       │ │
│ │ [사진 3장 - 썸네일 표시]             │ │
│ └───────────────────────────────────────┘ │
│                                             │
│ ┌───────────────────────────────────────┐ │
│ │ 👤 박철수 | ⭐⭐⭐⭐               │ │
│ │ "가격 대비 좋은 서비스"                │ │
│ │                                       │ │
│ │ 처음 방문했는데 대만족합니다.        │ │
│ │ 가격도 합리적이고 친절하네요.        │ │
│ │ 5점 아닌 이유: 예약 대기 시간 좀 길었어요│ │
│ │                                       │ │
│ │ 📅 2026-04-28 | 서비스: 핫스톤 90분   │
│ │                                       │ │
│ │ [좋아요 15] [공유] [신고]            │ │
│ └───────────────────────────────────────┘ │
│                                             │
│ ┌───────────────────────────────────────┐ │
│ │ ... (148개 중 15개 표시, 무한 스크롤)  │
│ └───────────────────────────────────────┘ │
│                                             │
│ [내 리뷰 작성하기]                         │
│                                             │
└─────────────────────────────────────────────┘

Tailwind 클래스:
- 카드: bg-white rounded-lg shadow
- 평점: text-yellow-400 (별 아이콘)
- 필터: border-b border-gray-200
- 반응형: grid cols-1 md:cols-2 lg:cols-3
- Dark mode: dark:bg-gray-800 dark:text-gray-100
```

### 2.3 리뷰 데이터 모델

```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  therapist_id UUID NULL,
  service_type VARCHAR(50) NOT NULL,
  
  -- 리뷰 내용
  rating INTEGER NOT NULL (1-5),
  title VARCHAR(100),
  content TEXT NOT NULL,
  
  -- 이미지
  image_urls JSON, -- ['url1', 'url2', 'url3']
  
  -- 상태
  status ENUM('draft', 'pending_approval', 'approved', 'rejected') DEFAULT 'draft',
  is_public BOOLEAN DEFAULT false,
  
  -- 소셜 미디어
  facebook_post_id VARCHAR(100) NULL,
  facebook_posted_at TIMESTAMP NULL,
  
  -- 메타데이터
  verified_purchase BOOLEAN DEFAULT true, -- 실제 예약인지 확인
  helpful_count INTEGER DEFAULT 0,
  unhelpful_count INTEGER DEFAULT 0,
  
  -- 감정 분석 (AI)
  sentiment ENUM('positive', 'neutral', 'negative'),
  sentiment_score DECIMAL(3,2), -- 0-1
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  approved_at TIMESTAMP NULL,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (therapist_id) REFERENCES therapists(id),
  
  INDEX idx_customer_id (customer_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE review_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  display_order INTEGER,
  created_at TIMESTAMP,
  
  FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
);
```

---

## 3. Facebook 자동 업로드

### 3.1 Facebook Graph API 연동

```
설정:

1. Facebook 비즈니스 페이지 연결
   ├─ App ID & Secret
   ├─ Long-lived Access Token
   └─ Page ID

2. 권한 설정
   ├─ pages_manage_posts (포스트 작성)
   ├─ pages_read_engagement (좋아요, 댓글)
   └─ pages_manage_metadata (페이지 정보)

3. Webhook 설정 (댓글 추적)
   ├─ POST /webhooks/facebook (수신)
   ├─ 댓글 알림 (Admin에게)
   └─ 긍정/부정 댓글 분류
```

### 3.2 Facebook 포스트 형식

```
자동 생성 포스트:

포맷 1: 단일 리뷰
┌─────────────────────────────┐
│ 😊 고객 후기                │
│                             │
│ "스웨디시 정말 좋아요!"     │
│ ⭐⭐⭐⭐⭐             │
│                             │
│ "마사지를 받고 몸이        │
│  정말 가벼워졌어요.        │
│  손기술도 훌륭하고        │
│  친절하셨습니다!          │
│  다음달에 또 올거에요 ☺️"  │
│                             │
│ - 김영희님                  │
│                             │
│ 📸 [사진 표시]             │
│                             │
│ #마사지 #스파 #후기 #강남  │
│                             │
│ [예약하기 링크]            │
└─────────────────────────────┘

포맷 2: 주간 총평
┌─────────────────────────────┐
│ 📊 이주 고객 후기 총평      │
│                             │
│ 새 리뷰: 12개               │
│ 평균 평점: 4.9/5.0         │
│ 총 좋아요: 348개            │
│                             │
│ 인기 서비스:                │
│ 🥇 스웨디시 (5건)          │
│ 🥈 핫스톤 (4건)            │
│ 🥉 아로마 (3건)            │
│                             │
│ "감사합니다!" 💬          │
│ 모든 고객님의 소중한 후기를│
│ 여러분과 공유합니다. 🙏   │
│                             │
│ #감사합니다 #고객후기      │
└─────────────────────────────┘

포맷 3: 월간 Top 리뷰
┌─────────────────────────────┐
│ 🌟 5월 Best 후기            │
│                             │
│ [Best 리뷰 3개 이미지]     │
│                             │
│ 이번달 가장 많은 좋아요를  │
│ 받은 후기들입니다! 👍      │
│                             │
│ 📸 클릭해서 전체 후기 보기 │
└─────────────────────────────┘
```

### 3.3 Facebook 자동화 로직

```
API 호출:

POST /api/internal/facebook/post
Body: {
  review_id: "UUID",
  type: "single_review" | "weekly_summary" | "monthly_best",
  scheduled_time: "2026-05-10T10:00:00Z" (선택)
}

응답:
{
  success: true,
  facebook_post_id: "12345678_987654321",
  post_url: "https://facebook.com/elspa/posts/...",
  scheduled_publish: false,
  published_at: "2026-05-05T10:00:00Z"
}

감정 분석 (자동):

POST /api/internal/facebook/analyze-comments
├─ Facebook API로 댓글 수집
├─ Claude API로 감정 분석
├─ 긍정/중립/부정 분류
└─ Admin 대시보드에 표시

Job (매시간):
├─ 새로운 댓글 체크
├─ 부정적 댓글 감지 → Admin 알림
├─ 긍정적 댓글 → 자동 좋아요 (옵션)
└─ 통계 업데이트
```

---

## 4. Gemini Vids 영상 자동 생성

### 4.1 Gemini Vids API 개요

```
Google Gemini Vids:
├─ AI 기반 영상 생성 플랫폼
├─ 텍스트 → 영상 (자동)
├─ AI 나레이션 (한국어 지원)
├─ 음악 & 효과음 자동 추가
├─ 30초 ~ 5분 영상 생성 가능
└─ 비용: 영상당 약 $0.5-2

특징:
✅ 빠른 생성 (5-10분)
✅ 자동 이미지 검색 & 삽입
✅ AI 나레이션 (자연스러운 발음)
✅ 자동 자막
✅ 배경음악 자동 추가
```

### 4.2 영상 템플릿 (3가지)

```
템플릿 1: 고객 후기 쇼케이스 (30초)
┌──────────────────────────────────┐
│ 오프닝 (3초)                      │
│ "✨ ElSpa 고객 후기"             │
│ [로고 애니메이션]                │
│                                  │
│ Body (20초)                      │
│ "스웨디시를 받고 몸이            │
│ 정말 가벼워졌어요!"              │
│ [후기 텍스트 + 고객 사진]        │
│ [마사지 장면 영상]               │
│                                  │
│ CTA (5초)                        │
│ "지금 예약하세요!"               │
│ [예약 링크 QR코드]               │
│ [주소 & 번호]                    │
└──────────────────────────────────┘

템플릿 2: 서비스 소개 (45초)
┌──────────────────────────────────┐
│ 오프닝 (3초)                      │
│ "ElSpa 마사지 & 스파"            │
│                                  │
│ Body (35초)                      │
│ 각 서비스 소개 (5초씩):          │
│ ├─ 스웨디시: 피로 회복           │
│ │  [영상 + 효과음]               │
│ ├─ 핫스톤: 근육 이완             │
│ │  [영상 + 효과음]               │
│ ├─ 아로마: 스트레스 해소         │
│ │  [영상 + 효과음]               │
│ └─ 수치료: 부기 제거             │
│    [영상 + 효과음]               │
│                                  │
│ CTA (5초)                        │
│ "오늘 바로 예약하기!"            │
└──────────────────────────────────┘

템플릿 3: 프로모션 (60초)
┌──────────────────────────────────┐
│ 오프닝 (5초)                      │
│ "🎉 특별 이벤트"                │
│ [프로모션 배너]                  │
│                                  │
│ Body (45초)                      │
│ "신규 고객 10% 할인!"            │
│ "첫 방문하신 분들을 위해"        │
│ "특별한 혜택을 준비했습니다"     │
│ [할인 금액 강조]                 │
│ [시간제한 표시]                  │
│ [고객 후기 자동 재생]            │
│                                  │
│ CTA (10초)                       │
│ "지금 예약하면 할인받으세요!"    │
│ [예약 버튼 + QR코드]             │
└──────────────────────────────────┘
```

### 4.3 Gemini Vids 프롬프트 생성

```typescript
// 고객 후기 기반 영상 프롬프트 자동 생성

function generateVideoPrompt(review: Review): string {
  return `
    다음 고객 후기를 바탕으로 마사지 스파 마케팅 영상 스크립트를 만들어주세요.
    
    고객: ${review.customerName}
    서비스: ${review.serviceType}
    평점: ${review.rating}/5
    후기: ${review.content}
    
    요구사항:
    - 영상 길이: 30초
    - 언어: 한국어 (자연스러운 발음)
    - 톤: 밝고 긍정적
    - 구성: 
      1. 오프닝 (3초): "✨ ElSpa 고객 후기"
      2. 메인 (20초): 후기 내용 강조 + 서비스 장면
      3. CTA (5초): "지금 예약하세요"
    - 자막: 전체 스크립트 자막 추가
    - 배경음: 잔잔한 피아노 음악
    - 시각요소: ${review.images ? '고객 사진 + 마사지 영상' : '마사지 영상'}
    
    JSON 형식:
    {
      "scenes": [
        {
          "duration": 3,
          "text": "✨ ElSpa 고객 후기",
          "images": ["logo", "intro_animation"],
          "voice": "female_korean",
          "caption": "ElSpa 고객 후기"
        },
        ... (메인 콘텐츠)
      ],
      "music": "calm_piano",
      "subtitles": true
    }
  `;
}
```

### 4.4 Gemini Vids API 호출

```typescript
async function generateVideoWithGeminiVids(
  prompt: string,
  templateType: 'review_showcase' | 'service_intro' | 'promotion'
): Promise<VideoGenerationResult> {
  
  // 1. Gemini API 호출 (스크립트 생성)
  const scriptResponse = await googleAI.generateContent({
    model: "gemini-2.0-flash",
    contents: [{
      parts: [{ text: prompt }]
    }]
  });
  
  const script = scriptResponse.response.text();
  
  // 2. Gemini Vids API로 영상 생성
  const videoResponse = await geminiVidsAPI.createVideo({
    script: script,
    template: templateType,
    duration: 30, // seconds
    language: 'ko-KR',
    voiceStyle: 'natural',
    musicStyle: 'calm_background',
    includeSubtitles: true,
    generateHighQuality: true
  });
  
  // 3. 영상 저장 (S3)
  const videoUrl = videoResponse.videoUrl;
  const savedUrl = await uploadToS3(videoUrl, `videos/${Date.now()}.mp4`);
  
  // 4. DB 저장
  await VideoGeneration.create({
    templateType,
    sourceReviewId: review.id,
    videoUrl: savedUrl,
    scriptJson: script,
    status: 'generated',
    generatedAt: new Date()
  });
  
  return {
    success: true,
    videoUrl: savedUrl,
    duration: 30,
    generatedAt: new Date()
  };
}
```

---

## 5. Social Media 자동 업로드

### 5.1 TikTok 자동 업로드

```
설정:

1. TikTok Business Account 연결
   ├─ API Access Token
   ├─ Video Upload Permission
   └─ Content Partner ID

2. 업로드 정책
   ├─ 영상 길이: 20-60초 (권장 30초)
   ├─ 가로세로비: 9:16 (수직 영상)
   ├─ 비트레이트: 1080p 권장
   └─ 포맷: MP4, H.264

프로세스:

매일 09:00 (자동 Job):
┌────────────────────────────────────┐
│ 1. 어제 승인된 리뷰 기반 영상 생성 │
│    (Gemini Vids)                  │
│ 2. TikTok 포스트 생성              │
│ 3. 해시태그 자동 추가              │
│ 4. 설명 텍스트 작성                │
│ 5. 업로드 실행                     │
│ 6. Analytics 추적                  │
│ 7. 스케줄: 18:00 업로드            │
│    (골든 타임)                    │
└────────────────────────────────────┘

TikTok 포스트 요소:

┌──────────────────────────────┐
│ 영상 (30초)                  │
│ [고객 후기 영상]             │
│                              │
│ 설명 텍스트:                 │
│ "✨ ElSpa 마사지 & 스파"    │
│ [후기 텍스트 일부]           │
│ ⭐⭐⭐⭐⭐             │
│                              │
│ 해시태그:                    │
│ #마사지 #스파 #후기 #강남    │
│ #휴식 #자기관리 #피로회복   │
│ #틱톡 #트렌드               │
│                              │
│ 링크: (Bio에서만 가능)      │
│ ElSpa 웹사이트 / 예약 링크 │
└──────────────────────────────┘
```

### 5.2 Facebook 자동 업로드

```
프로세스:

영상 종류 2가지:

1. Feed 포스트 (30초)
   ├─ 설명 텍스트 + 영상
   ├─ 썸네일 커버 이미지
   ├─ CTA 버튼: [지금 예약하기]
   └─ 발행 시간: 매일 10:00 AM

2. Reel (30-60초)
   ├─ 인스타그램 Reels와 동일
   ├─ 해시태그 O (더 효과적)
   ├─ CTA 스티커 추가
   └─ 발행 시간: 매일 6:00 PM

API:

POST /api/facebook/video/upload
Body: {
  videoUrl: "s3://...",
  title: "ElSpa 고객 후기",
  description: "...",
  hashtags: ["#마사지", "#스파"],
  postType: "feed" | "reel",
  scheduledPublishTime: "2026-05-10T10:00:00Z"
}
```

### 5.3 YouTube 자동 업로드

```
프로세스:

매주 월요일 (자동 Job):
┌────────────────────────────────────┐
│ 1. 지난주 영상 3-5개 수집          │
│ 2. 편집 & 통합 (3-5분 영상)       │
│ 3. 썸네일 생성 (AI)                │
│ 4. 설명 & 태그 작성                │
│ 5. 플레이리스트 생성               │
│ 6. 스케줄 업로드 (수요일 10:00 AM)│
│ 7. Analytics 연동                  │
└────────────────────────────────────┘

YouTube 영상 구성:

┌────────────────────────────────┐
│ 제목:                          │
│ "ElSpa 고객 후기 모음 - 5월"  │
│ (또는 서비스별 모음)           │
│                                │
│ 설명:                          │
│ ElSpa는 마사지 & 스파         │
│ 고객 후기:                     │
│ ✨ 스웨디시                   │
│ ✨ 핫스톤                     │
│ ✨ 아로마테라피               │
│                                │
│ 링크: 예약 사이트              │
│ 주소: 서울 강남구 ...         │
│ 연락처: 010-xxxx-xxxx         │
│                                │
│ 태그:                          │
│ #마사지 #스파 #강남           │
│ #휴식 #피로회복               │
│                                │
│ 플레이리스트:                 │
│ "ElSpa 고객 후기"             │
│ "ElSpa 서비스 소개"           │
│ "ElSpa 마케팅 영상"           │
│                                │
│ 영상 길이: 3-5분               │
│ 자막: 한국어                   │
│ 썸네일: AI 생성                │
└────────────────────────────────┘

API:

POST /api/youtube/upload
Body: {
  title: "ElSpa 고객 후기 모음",
  description: "...",
  videoFile: File,
  tags: ["마사지", "스파"],
  privacyStatus: "public",
  playlist: "ElSpa Customer Reviews",
  publishAt: "2026-05-08T10:00:00Z"
}
```

---

## 6. Admin 관리 대시보드

### 6.1 리뷰 관리 페이지

```
Admin Site - 리뷰 & 마케팅:

┌──────────────────────────────────────┐
│ 📊 리뷰 & 마케팅 대시보드            │
├──────────────────────────────────────┤
│                                      │
│ 📈 통계                              │
│ ├─ 총 리뷰: 148개                    │
│ ├─ 평균 평점: 4.8/5.0               │
│ ├─ 이달 신규: 23개 (+15% vs 저달)   │
│ ├─ 회수율: 68% (예약 대비)           │
│ └─ Facebook 도달범위: 2.4K (이주)   │
│                                      │
│ 📋 대기중인 리뷰 (검토 필요)          │
│ ├─ [김영희] ⭐⭐⭐⭐⭐            │
│ │ "정말 좋았어요!"                  │
│ │ [승인] [거부] [수정]              │
│ │ 감정분석: 긍정 (99%)              │
│ │ 사진 3장 미리보기                 │
│ │                                  │
│ └─ [박철수] ⭐⭐⭐ (대기중)         │
│   "괜찮았지만..."                  │
│   [승인] [거부] [수정]              │
│   감정분석: 중립 (60%)              │
│                                      │
│ 📺 영상 생성 & 업로드                │
│ ├─ [영상 생성 설정]                 │
│ │ 템플릿: [고객후기쇼케이스▼]      │
│ │ 일정: [매일▼] [09:00▼]           │
│ │ 대상: [승인된 리뷰▼]             │
│ │ [저장]                           │
│ │                                  │
│ ├─ 생성된 영상                      │
│ │ ├─ [영상1] 30초 (2026-05-04)     │
│ │ │ TikTok ✅ Facebook ✅ YouTube ❌│
│ │ │ 썸네일, 재생 버튼                │
│ │ │ [미리보기] [다운로드] [재생성] │
│ │ │                                │
│ │ └─ [영상2] 45초 (2026-05-03)     │
│ │   [...]                          │
│ │                                  │
│ └─ [수동 생성하기]                 │
│    (리뷰 선택 후 즉시 생성)        │
│                                      │
│ 🌐 소셜 미디어 관리                  │
│ ├─ TikTok                           │
│ │ └─ 팔로워: 1.2K | 조회: 15K/주   │
│ │    업로드 예정: 2개 (이주)        │
│ │    [분석 보기]                    │
│ │                                  │
│ ├─ Facebook                         │
│ │ └─ 팔로워: 8.5K | 도달: 2.4K/주  │
│ │    업로드 예정: 2개 (이주)        │
│ │    [분석 보기]                    │
│ │                                  │
│ └─ YouTube                          │
│   └─ 구독자: 450 | 조회: 1.2K/주   │
│      업로드 예정: 1개 (이주)        │
│      [분석 보기]                    │
│                                      │
└──────────────────────────────────────┘
```

### 6.2 영상 생성 설정

```
┌──────────────────────────────────────┐
│ ⚙️  자동 영상 생성 설정              │
├──────────────────────────────────────┤
│                                      │
│ 📺 Template 선택                     │
│ ├─ [ ] 고객 후기 쇼케이스 (30초)    │
│ │      일정: 매일 09:00             │
│ │      우선순위: 최신 리뷰          │
│ │      Target: TikTok + Facebook    │
│ │                                  │
│ ├─ [ ] 서비스 소개 (45초)           │
│ │      일정: 매주 월요일            │
│ │      우선순위: 인기 서비스        │
│ │      Target: YouTube              │
│ │                                  │
│ └─ [ ] 프로모션 (60초)              │
│      일정: 매월 1일                 │
│      내용: 특별 이벤트              │
│      Target: 모든 채널              │
│                                      │
│ 🎬 Gemini Vids 설정                 │
│ ├─ 영상 길이: [30▼] 초             │
│ ├─ 언어: [한국어▼]                 │
│ ├─ 음성: [여성 자연스러운▼]        │
│ ├─ 배경음: [잔잔한 피아노▼]        │
│ ├─ 자막: [✓ 포함]                  │
│ └─ 화질: [1080p▼]                  │
│                                      │
│ 📤 업로드 설정                       │
│ ├─ TikTok: [✓ 활성화]              │
│ │  └─ 발행시간: [18:00▼]           │
│ ├─ Facebook: [✓ 활성화]            │
│ │  └─ 발행시간: [10:00▼]           │
│ ├─ YouTube: [✓ 활성화]             │
│ │  └─ 발행시간: [10:00AM 수요일▼] │
│ └─ 인스타그램: [미지원]             │
│                                      │
│ [저장] [미리보기]                   │
│                                      │
└──────────────────────────────────────┘
```

### 6.3 Analytics 대시보드

```
┌──────────────────────────────────────┐
│ 📊 소셜 미디어 Analytics             │
├──────────────────────────────────────┤
│                                      │
│ 📈 종합 성과 (최근 30일)             │
│ ├─ TikTok 조회: 45K ⬆️ 15%          │
│ ├─ Facebook 도달: 12K ⬆️ 8%         │
│ ├─ YouTube 조회: 3.2K ⬆️ 25%        │
│ └─ 총 참여도: 2.4K ⬆️ 12%           │
│                                      │
│ TikTok 상세                          │
│ ├─ 팔로워: 1.2K → 1.4K (+200)       │
│ ├─ 업로드: 8개                      │
│ ├─ 평균 조회: 5.6K/영상            │
│ ├─ 평균 참여율: 8.2%                │
│ ├─ 트렌딩 키워드: #마사지, #스파    │
│ └─ Top 3 영상:                      │
│    1️⃣  "스웨디시 체험기" (12K)     │
│    2️⃣  "가격공개" (8K)            │
│    3️⃣  "신규이벤트" (6.5K)        │
│                                      │
│ Facebook 상세                        │
│ ├─ 팔로워: 8.5K → 9.1K (+600)       │
│ ├─ 업로드: 12개                     │
│ ├─ 평균 도달: 1K/포스트             │
│ ├─ 평균 참여: 85 (좋아요+댓글)      │
│ ├─ 댓글 분석:                       │
│ │  긍정 85% | 중립 10% | 부정 5%   │
│ └─ Top 댓글:                        │
│    "정말 좋았어요!" - 23 좋아요   │
│    "다음주 예약할게요!" - 18      │
│                                      │
│ YouTube 상세                         │
│ ├─ 구독자: 450 → 520 (+70)         │
│ ├─ 업로드: 2개                      │
│ ├─ 평균 조회: 1.6K/영상            │
│ ├─ 평균 시청시간: 45초 (영상 70%)  │
│ ├─ 구독 전환: 3.2%                 │
│ └─ 재생목록:                        │
│    "고객후기" (조회 2.1K)           │
│    "서비스소개" (조회 1.2K)         │
│                                      │
└──────────────────────────────────────┘
```

---

## 7. 아키텍처 & 데이터 모델

### 7.1 시스템 흐름도

```
┌────────────────────────────────────────────────┐
│ 1️⃣ 고객 리뷰 작성                              │
├────────────────────────────────────────────────┤
│                                                │
│ 서비스 완료                                     │
│  ↓ (자동)                                      │
│ User Site - 리뷰 요청                         │
│  ↓ (고객 입력)                                │
│ 리뷰 저장 (상태: draft)                       │
│  ↓                                            │
│ Admin - 리뷰 검토                            │
│  │ (감정분석, 이미지 확인)                   │
│  │                                            │
│  ├─ [승인] → status: approved                │
│  │   ↓                                        │
│  │   User Site - 공개 표시                  │
│  │   ↓                                        │
│  │   Facebook - 자동 업로드                 │
│  │                                            │
│  └─ [거부] → status: rejected                │
│      ↓                                        │
│      고객 알림                                 │
│      (피드백 제공)                           │
│                                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 2️⃣ Gemini Vids 자동 영상 생성                  │
├────────────────────────────────────────────────┤
│                                                │
│ 매일 09:00 (자동 Job)                          │
│  ↓                                            │
│ 어제 승인된 리뷰 조회 (평점높은것 우선)      │
│  ↓                                            │
│ 프롬프트 생성                                  │
│ (고객 리뷰 기반)                              │
│  ↓                                            │
│ Gemini Vids API 호출                          │
│  ├─ 스크립트 생성 (Gemini)                  │
│  ├─ 영상 생성 (Gemini Vids)                 │
│  └─ AI 나레이션 추가 (한국어)                │
│  ↓                                            │
│ 영상 S3에 저장                                 │
│  ↓                                            │
│ DB 기록 (VideoGeneration 테이블)             │
│  ↓                                            │
│ Admin 대시보드 - 생성된 영상 표시             │
│                                               │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│ 3️⃣ 소셜 미디어 자동 업로드                     │
├────────────────────────────────────────────────┤
│                                                │
│ TikTok (매일 18:00)                           │
│  ├─ 영상 선택 (어제 생성된 것)                │
│  ├─ 해시태그 자동 생성 (Claude)              │
│  ├─ 설명 작성 (템플릿)                       │
│  └─ API 업로드 (scheduling)                  │
│  ↓                                            │
│ Facebook (매일 10:00)                         │
│  ├─ 영상 업로드                              │
│  ├─ 포스트 설명 (리뷰 기반)                  │
│  ├─ CTA 버튼 추가                            │
│  └─ Webhook 설정 (댓글 추적)                 │
│  ↓                                            │
│ YouTube (매주 수요일 10:00)                   │
│  ├─ 주간 영상 통합 (3-5분 영상)              │
│  ├─ 썸네일 생성 (AI)                        │
│  ├─ 플레이리스트 추가                        │
│  └─ SEO 메타데이터 추가                      │
│  ↓                                            │
│ Analytics 추적                                │
│  ├─ 조회수, 참여도, 도달범위                  │
│  └─ Admin 대시보드 업데이트                  │
│                                               │
└────────────────────────────────────────────────┘
```

### 7.2 데이터베이스 테이블

```sql
-- reviews 테이블 (이미 정의됨)

-- 새로운 테이블:

CREATE TABLE video_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 출처
  review_id UUID NULL,
  template_type VARCHAR(50) NOT NULL, -- 'review_showcase', 'service_intro', 'promotion'
  
  -- 영상 정보
  title VARCHAR(200),
  description TEXT,
  script_json JSONB, -- 스크립트 상세
  video_url VARCHAR(500) NOT NULL, -- S3 URL
  duration_seconds INTEGER,
  thumbnail_url VARCHAR(500),
  
  -- Gemini Vids
  gemini_request_id VARCHAR(100),
  generation_status ENUM('pending', 'generating', 'generated', 'failed'),
  generation_error TEXT NULL,
  
  -- 소셜 미디어 업로드
  tiktok_post_id VARCHAR(100) NULL,
  tiktok_posted_at TIMESTAMP NULL,
  tiktok_views INTEGER DEFAULT 0,
  tiktok_likes INTEGER DEFAULT 0,
  tiktok_shares INTEGER DEFAULT 0,
  
  facebook_post_id VARCHAR(100) NULL,
  facebook_posted_at TIMESTAMP NULL,
  facebook_reach INTEGER DEFAULT 0,
  facebook_engagement INTEGER DEFAULT 0,
  
  youtube_video_id VARCHAR(100) NULL,
  youtube_posted_at TIMESTAMP NULL,
  youtube_views INTEGER DEFAULT 0,
  youtube_likes INTEGER DEFAULT 0,
  youtube_watch_time_seconds INTEGER DEFAULT 0,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (review_id) REFERENCES reviews(id),
  INDEX idx_template_type (template_type),
  INDEX idx_created_at (created_at)
);

CREATE TABLE social_media_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  video_id UUID NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'tiktok', 'facebook', 'youtube'
  
  -- 성과지표
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  
  -- 타이밍
  recorded_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (video_id) REFERENCES video_generations(id),
  INDEX idx_platform_recorded (platform, recorded_at)
);

CREATE TABLE video_generation_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 설정
  admin_id UUID NOT NULL,
  template_type VARCHAR(50), -- NULL이면 전체 설정
  enabled BOOLEAN DEFAULT true,
  
  -- 스케줄
  schedule_type VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  schedule_time TIME,
  schedule_day VARCHAR(20), -- 'monday', 'tuesday', ...
  
  -- 채널 선택
  tiktok_enabled BOOLEAN DEFAULT true,
  facebook_enabled BOOLEAN DEFAULT true,
  youtube_enabled BOOLEAN DEFAULT true,
  
  -- Gemini Vids 설정
  video_duration_seconds INTEGER DEFAULT 30,
  language VARCHAR(10) DEFAULT 'ko-KR',
  voice_style VARCHAR(50) DEFAULT 'natural',
  background_music VARCHAR(100) DEFAULT 'calm_piano',
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES admins(id)
);
```

---

## 8. 프로세스 흐름도

### 8.1 완전한 자동화 흐름

```
Day 1 (서비스 제공 + 리뷰 작성):

10:00 - 고객 서비스 완료 (테라피스트가 [완료] 클릭)
  ↓
  booking.status = 'completed'
  
12:00 - 자동 리뷰 요청 (Push + Email + SMS)
  ↓
  고객이 User Site에서 리뷰 작성
  
14:30 - 리뷰 저장 (상태: draft)
  ↓
  Admin 알림: "새 리뷰 대기중"
  
16:00 - Admin이 리뷰 검토
  ├─ 감정분석 자동 실행 (부정적 리뷰 감지)
  ├─ 이미지 프리뷰 확인
  └─ [승인] 클릭
  
17:00 - 리뷰 공개
  ├─ User Site에 표시
  ├─ 고객에게 알림 발송
  └─ Job Queue: "facebook_post_review" 추가

18:30 - Facebook 자동 업로드
  ├─ 포스트 생성 (리뷰 텍스트 + 사진)
  ├─ 해시태그 추가
  └─ Meta Graph API로 업로드
  
Day 2 (영상 생성 + 업로드):

09:00 - Gemini Vids 자동 생성 (매일)
  ├─ 어제 승인된 리뷰 중 최고평점 선택
  ├─ 프롬프트 생성 (Claude)
  ├─ Gemini Vids API 호출
  ├─ 영상 생성 (5-10분)
  └─ S3 저장 + DB 기록
  
10:00 - Facebook 영상 업로드
  ├─ Feed 포스트로 업로드
  ├─ CTA 버튼 추가
  └─ Webhook 설정 (댓글 추적)
  
18:00 - TikTok 영상 업로드
  ├─ 해시태그 자동 생성
  ├─ 설명 작성 (템플릿)
  └─ TikTok API로 업로드 (스케줄)
  
매주 수요일:

10:00 - YouTube 합본 영상 업로드
  ├─ 지난주 영상 3-5개 편집
  ├─ 썸네일 생성 (AI)
  ├─ 플레이리스트에 추가
  └─ YouTube API로 업로드
  
지속적:

매시간 - Analytics 수집
  ├─ TikTok API: 조회, 좋아요, 공유
  ├─ Facebook API: 도달, 참여, 댓글 감정분석
  ├─ YouTube API: 조회, 시청시간, 구독
  └─ DB 업데이트
  
일일 - Admin 대시보드 업데이트
  ├─ 성과 요약 (KPI)
  ├─ 상위 영상 표시
  └─ 부정적 댓글 알림
```

---

## 9. Epic/Stories 추가

### 9.1 새로운 Epic (v4에 추가)

```
Epic 17: 고객 후기 & Facebook 자동 공유 (신규)
- Points: 60
- Duration: W3-W4
- Stories:
  S17.1: 리뷰 수집 & 검증 시스템 (18pt)
  S17.2: User Site - 후기 섹션 (Tailwind) (18pt)
  S17.3: 감정분석 (Claude AI) (12pt)
  S17.4: Facebook Graph API 연동 (12pt)

Epic 18: Gemini Vids 자동 영상 생성 (신규)
- Points: 70
- Duration: W5-W6
- Stories:
  S18.1: Gemini Vids API 통합 (20pt)
  S18.2: 프롬프트 자동 생성 엔진 (18pt)
  S18.3: 영상 템플릿 (3가지) (18pt)
  S18.4: Admin - 영상 생성 관리 (14pt)

Epic 19: 소셜 미디어 자동 업로드 (신규)
- Points: 80
- Duration: W6-W7
- Stories:
  S19.1: TikTok API 연동 (22pt)
  S19.2: Facebook Reel 업로드 (18pt)
  S19.3: YouTube 자동 업로드 (20pt)
  S19.4: 스케줄링 엔진 (12pt)
  S19.5: Analytics 대시보드 (Admin) (8pt)

총 추가: 3개 Epic, 210pt
```

### 9.2 기존 Epic 영향

```
Epic 3 (User Site): +20pt
  └─ 후기 섹션 추가

Epic 6 (Admin Site): +30pt
  └─ 리뷰 관리, 영상 생성, Analytics

총 추가: 50pt
```

---

## 10. 최종 통합 정보

```
v4 최종 구성:

기존 Epic 1-16: 1,200pt
+ 리뷰/Facebook/영상 (18-19): 210pt
+ 기존 확장 (3,6): 50pt

= 1,460pt (총)

Timeline 변경:
├─ Phase A (W1-4): 300pt (변경없음)
├─ Phase B (W5-8): 520pt (변경없음)
└─ Phase B 추가 (W6-8): 210pt + 50pt = 260pt

Total: 1,100pt → 1,460pt
Duration: 8주 → 10주 (또는 병렬 확대)

팀 구성:
├─ Phase B W6부터: 영상 전문가 1명 추가
├─ Marketing Manager: 1명 (소셜 미디어)
└─ Total: 7명 → 9명
```

---

## 11. 기술 구현 요약

```
외부 API:

1. Gemini Vids
   ├─ API Key 필수
   ├─ 비용: 영상당 $0.5-2
   └─ 처리시간: 5-10분

2. TikTok API
   ├─ Business Account 필수
   ├─ Video Upload Endpoint
   └─ Rate Limit: 50 uploads/hour

3. Facebook Graph API
   ├─ Pages Access Token
   ├─ Video Upload Endpoint
   └─ Webhook: 댓글 실시간 수신

4. YouTube Data API
   ├─ OAuth 2.0 인증
   ├─ Video Upload Endpoint
   └─ Custom Thumbnail 지원

Backend 서비스:

1. Review Service
   ├─ 리뷰 CRUD
   ├─ 감정분석 (Claude)
   └─ 검증 로직

2. Video Generation Service
   ├─ Gemini Vids API 호출
   ├─ 프롬프트 생성
   └─ 영상 저장 & 관리

3. Social Media Service
   ├─ TikTok API 연동
   ├─ Facebook API 연동
   ├─ YouTube API 연동
   └─ Analytics 수집

Infrastructure:

1. Storage
   ├─ S3: 영상 저장 (용량 무제한)
   └─ CloudFront: CDN (빠른 배포)

2. Queue
   ├─ Bull Queue: 영상 생성 Job
   └─ Webhook Queue: 댓글 처리

3. Database
   └─ reviews, video_generations, analytics 테이블
```

---

## 다음 단계

1. ✅ 기획 완료 (이 문서)
2. ⏭️ v4 Final Epic/Stories 작성
   └─ 1,460pt, 10주 계획
3. ⏭️ UX 디자인 (Figma)
   ├─ User Site 후기 섹션
   └─ Admin 영상 생성 & Analytics 대시보드
4. ⏭️ API 명세서 추가
   ├─ Review API
   ├─ Video Generation API
   └─ Social Media API
5. ⏭️ 팀 구성 재검토
   └─ 영상 전문가 + Marketing Manager
