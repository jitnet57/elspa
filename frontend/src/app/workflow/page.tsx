'use client';

import { useState } from 'react';

type UserType = 'customer' | 'admin' | 'therapist' | 'driver' | 'counter';

interface WorkflowStep {
  time: string;
  title: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
  icon: string;
  details?: string[];
}

const workflows: Record<UserType, WorkflowStep[]> = {
  customer: [
    {
      time: '10:00',
      title: '서비스 검색',
      description: '스마트폰 앱에서 서비스 카탈로그 보기',
      status: 'completed',
      icon: '🔍',
      details: ['서비스 종류 확인', '가격/시간 비교', '평점 확인']
    },
    {
      time: '10:15',
      title: '예약하기',
      description: '4단계 예약 마법사 시작',
      status: 'completed',
      icon: '📋',
      details: ['1단계: 스웨디시 선택', '2단계: 14:30 시간 선택', '3단계: 테라피스트 선택', '4단계: 개인정보 입력']
    },
    {
      time: '10:20',
      title: '예약 완료',
      description: '확인 문자/이메일 수신',
      status: 'completed',
      icon: '✅',
      details: ['예약번호: #12345', '서비스: 스웨디시 60분', '테라피스트: 이소영']
    },
    {
      time: '14:00',
      title: '매장 도착',
      description: '카운터에서 체크인',
      status: 'active',
      icon: '🏢',
      details: ['"스웨디시 예약한 김민준입니다"', '신분증 확인', '동의서 작성']
    },
    {
      time: '14:30',
      title: '서비스 시작',
      description: 'B05 침대에서 이소영과 함께',
      status: 'pending',
      icon: '💆',
      details: ['침대 안내', '타올 제공', '서비스 시작']
    },
    {
      time: '15:30',
      title: '서비스 완료',
      description: '마사지 종료 및 결제',
      status: 'pending',
      icon: '💳',
      details: ['결제: 80,000원', '현금/카드/모바일페이']
    },
    {
      time: '15:40',
      title: '후기 남기기',
      description: '앱에서 평점과 코멘트 작성',
      status: 'pending',
      icon: '⭐',
      details: ['별점: 5개', '코멘트: "매우 만족합니다"', '이소영 평점 올림']
    }
  ],
  admin: [
    {
      time: '08:00',
      title: '어드민 대시보드 확인',
      description: '오늘의 주요 지표 확인',
      status: 'completed',
      icon: '📊',
      details: ['활성 테라피스트: 24명', '오늘 예약: 42건', '월 매출: ₩4.8M']
    },
    {
      time: '08:30',
      title: '대기 예약 확인',
      description: '/admin/matching 열기',
      status: 'completed',
      icon: '📋',
      details: ['대기 예약: 3건', '김민준 - 스웨디시 14:30', '이수연 - 타이 15:00']
    },
    {
      time: '08:35',
      title: '[매칭 실행] 클릭',
      description: 'AI가 자동으로 점수 계산',
      status: 'completed',
      icon: '🤖',
      details: ['이소영 92점 (1위)', '박유진 87점 (2위)', '최정은 81점 (3위)']
    },
    {
      time: '08:37',
      title: '[✓ 이소영 배정] 클릭',
      description: '테라피스트 배정 확정',
      status: 'completed',
      icon: '✅',
      details: ['데이터 저장', 'DB 업데이트', 'Realtime 브로드캐스트']
    },
    {
      time: '08:40',
      title: '/monitor 확인',
      description: '배정이 카운터 모니터에 반영됨',
      status: 'active',
      icon: '📺',
      details: ['B05 침대: 파란색으로 변경', '타이머: 60:00 시작', '이소영 상태: in_service']
    },
    {
      time: '14:30',
      title: '[서비스 시작] 클릭',
      description: '고객 도착 확인',
      status: 'pending',
      icon: '🚀',
      details: ['고객 체크인 완료', '침대 배정 확인', '서비스 시작']
    },
    {
      time: '15:30',
      title: '[서비스 완료] 클릭',
      description: '서비스 종료 처리',
      status: 'pending',
      icon: '✔️',
      details: ['침대 상태: cleaning (회색)', '다음 예약 자동 매칭', '이소영 상태: resting']
    },
    {
      time: '16:00',
      title: '월간 분석 보기',
      description: '/admin/fairness 대시보드',
      status: 'pending',
      icon: '📈',
      details: ['공정성 지수: 72점', '이소영 일감: 92%', '최정은 일감: 38%']
    }
  ],
  therapist: [
    {
      time: '08:00',
      title: '출근',
      description: '/therapist/checkin에서 [📋 출근] 클릭',
      status: 'completed',
      icon: '📋',
      details: ['상태: checked_in', 'GPS 활성화', '시스템 등록']
    },
    {
      time: '08:15',
      title: '오늘 일정 확인',
      description: '/therapist/schedule 열기',
      status: 'completed',
      icon: '📅',
      details: ['배정된 예약 5건 확인', '시간대별 정렬', '고객 프로필 미리 보기']
    },
    {
      time: '08:30',
      title: '첫 번째 고객 알림',
      description: '매니저가 배정했다는 푸시 알림',
      status: 'completed',
      icon: '🔔',
      details: ['고객명: 박지은', '서비스: 스웨디시 60분', '시간: 08:30 (곧 시작!)']
    },
    {
      time: '08:30',
      title: '침대로 이동',
      description: 'B01 침대 준비',
      status: 'completed',
      icon: '🚶',
      details: ['침대 정리', '타올 준비', '고객 맞이 준비']
    },
    {
      time: '08:35',
      title: '[서비스 시작] 클릭',
      description: '마사지 시작',
      status: 'active',
      icon: '💆',
      details: ['상태: in_service', '타이머: 60:00 시작', '어드민에게 보고']
    },
    {
      time: '09:35',
      title: '서비스 거의 끝남',
      description: '마무리 단계',
      status: 'active',
      icon: '⏱️',
      details: ['남은 시간: 5분', '마사지 마무리', '타올로 닦기']
    },
    {
      time: '09:37',
      title: '[서비스 완료] 클릭',
      description: '타이머 종료',
      status: 'pending',
      icon: '✔️',
      details: ['상태: resting', '휴식 시작', '다음 예약 준비']
    },
    {
      time: '09:50',
      title: '[준비 완료] 클릭',
      description: '다음 예약 대기',
      status: 'pending',
      icon: '✅',
      details: ['상태: idle', '매니저 자동 매칭 대기', '평균 대기: 10분']
    },
    {
      time: '10:00',
      title: '다음 고객 알림',
      description: '두 번째 예약 자동 배정',
      status: 'pending',
      icon: '🔔',
      details: ['고객명: 이수연', '서비스: 타이 마사지 90분', '침대: B03']
    },
    {
      time: '18:00',
      title: '퇴근',
      description: '/therapist/checkout에서 [🚪 퇴근] 클릭',
      status: 'pending',
      icon: '🚪',
      details: ['상태: off_duty', '오늘 수익 확인', '고객수: 5명']
    }
  ],
  driver: [
    {
      time: '08:00',
      title: '출근',
      description: '/driver/checkin에서 [🚗 출근] 클릭',
      status: 'completed',
      icon: '🚗',
      details: ['상태: checked_in', 'GPS 활성화', '배차 시스템 등록']
    },
    {
      time: '08:15',
      title: '픽업 큐 확인',
      description: '/driver/queue에서 대기 중인 요청 확인',
      status: 'completed',
      icon: '📍',
      details: ['대기 픽업: 3건', '거리, 예정 시간 표시', '고객명 확인']
    },
    {
      time: '08:20',
      title: '픽업 요청 받음',
      description: 'AI 자동 배정 (가장 가까운 고객)',
      status: 'completed',
      icon: '🎯',
      details: ['고객: 김민준', '주소: 강남구 테헤란로 123', '거리: 2.3km, 5분']
    },
    {
      time: '08:25',
      title: '픽업 가기',
      description: '[네비게이션] GPS 시작',
      status: 'active',
      icon: '🗺️',
      details: ['실시간 GPS 추적', 'ETA 표시 (08:30)', '매니저도 위치 추적 가능']
    },
    {
      time: '08:30',
      title: '고객 픽업',
      description: '도착 후 고객 탑승',
      status: 'active',
      icon: '✅',
      details: ['[픽업 완료] 클릭', '상태: delivering', '목적지: ElSpa']
    },
    {
      time: '08:32',
      title: '운송 중',
      description: '/driver/delivery로 이동 모니터링',
      status: 'active',
      icon: '🚙',
      details: ['실시간 위치', '남은 거리: 1.8km', '도착 ETA: 08:38']
    },
    {
      time: '08:40',
      title: '매장 도착',
      description: '[도착] 버튼 클릭',
      status: 'pending',
      icon: '🏢',
      details: ['고객 하차', '상태: idle', '수수료 자동 계산 (₩8,000)']
    },
    {
      time: '08:45',
      title: '다음 픽업 요청 대기',
      description: '/driver/queue로 돌아가기',
      status: 'pending',
      icon: '⏳',
      details: ['대기 중', '다음 요청 받을 준비', '평균 대기: 15분']
    },
    {
      time: '22:00',
      title: '퇴근',
      description: '[🚗 퇴근] 클릭',
      status: 'pending',
      icon: '🚪',
      details: ['상태: off_duty', '오늘 수익: ₩240,000', '픽업 건수: 30건']
    }
  ],
  counter: [
    {
      time: '08:00',
      title: '/monitor 화면 켜기',
      description: '카운터 모니터 시작 (읽기만 함)',
      status: 'completed',
      icon: '📺',
      details: ['86개 침대 상태 표시', '테라피스트 현황 패널', '실시간 시계']
    },
    {
      time: '08:15',
      title: '침대 상태 모니터링',
      description: '각 침대의 색상으로 상태 파악',
      status: 'completed',
      icon: '👀',
      details: ['초록색: 비어있음 (45개)', '파랑색: 마사지중 (28개)', '주황색: 예약됨 (13개)']
    },
    {
      time: '14:20',
      title: '고객 "김민준" 도착',
      description: '카운터에서 체크인 시작',
      status: 'completed',
      icon: '🧑',
      details: ['"스웨디시 예약했습니다"', '예약번호 #12345 확인', '신분증 확인']
    },
    {
      time: '14:25',
      title: '/monitor에서 확인',
      description: '이소영이 B05 침대에 배정됨을 확인',
      status: 'completed',
      icon: '✅',
      details: ['B05가 파란색 (마사지중)', '이소영 상태 확인', '예약 정보 맞음']
    },
    {
      time: '14:28',
      title: '고객 안내',
      description: '"B05 침대로 가세요"',
      status: 'active',
      icon: '🗺️',
      details: ['"이소영 테라피스트입니다"', '"60분 서비스입니다"', '"편히 쉬세요"']
    },
    {
      time: '14:30',
      title: '모니터 계속 관찰',
      description: 'B05 침대 타이머 시작: 60:00',
      status: 'active',
      icon: '⏱️',
      details: ['59:45 → 59:30 → ... (카운트다운)', '다른 침대 상태도 확인', '다음 종료 예정 침대 파악']
    },
    {
      time: '15:20',
      title: 'B05 침대 10분 남음',
      description: '모니터에서 자동으로 표시됨',
      status: 'active',
      icon: '⚠️',
      details: ['10:00 카운트다운', '카운터 직원이 알아서 봄', '타올 준비 (수동 작업)']
    },
    {
      time: '15:25',
      title: 'B05 침대 5분 남음',
      description: '빨간 색으로 깜빡임!',
      status: 'active',
      icon: '🔴',
      details: ['5:00 카운트다운 시작', '긴급 알림 (자동)', '타올 최종 준비']
    },
    {
      time: '15:30',
      title: '서비스 완료',
      description: 'B05 침대가 회색(정리중)으로 변경',
      status: 'pending',
      icon: '🧹',
      details: ['상태: cleaning', '고객 일어나기', '카운터에서 결제 준비']
    },
    {
      time: '15:35',
      title: '고객 결제',
      description: '태블릿에서 결제 처리',
      status: 'pending',
      icon: '💳',
      details: ['금액: ₩80,000', '현금/카드/모바일페이', '영수증 출력']
    },
    {
      time: '15:40',
      title: '고객 배웅',
      description: '"감사합니다! 다음에 뵙겠습니다"',
      status: 'pending',
      icon: '👋',
      details: ['인사', '포인트 카드 제공', '재방문 권장']
    },
    {
      time: '15:45',
      title: '침대 청소',
      description: '청소팀이 B05 청소 시작',
      status: 'pending',
      icon: '🧼',
      details: ['매트리스 소독', '침구류 교체', '침대 정렬']
    },
    {
      time: '15:55',
      title: '청소 완료',
      description: 'B05 침대가 초록색(비어있음)으로 변경',
      status: 'pending',
      icon: '✅',
      details: ['상태: available', '다음 예약 대기', '모니터: 계속 관찰 중']
    }
  ]
};

const userTypeInfo = {
  customer: { label: '고객', color: 'from-pink-500 to-rose-500', icon: '🧑' },
  admin: { label: '매니저', color: 'from-blue-500 to-cyan-500', icon: '👔' },
  therapist: { label: '테라피스트', color: 'from-green-500 to-emerald-500', icon: '💆' },
  driver: { label: '드라이버', color: 'from-yellow-500 to-orange-500', icon: '🚗' },
  counter: { label: '카운터', color: 'from-purple-500 to-indigo-500', icon: '📺' }
};

export default function WorkflowPage() {
  const [activeType, setActiveType] = useState<UserType>('customer');

  const workflow = workflows[activeType];
  const userInfo = userTypeInfo[activeType];
  const stepCount = workflow.length;
  const completedCount = workflow.filter(s => s.status === 'completed').length;
  const progress = (completedCount / stepCount) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            {userInfo.icon} ElSpa 워크플로우
          </h1>
          <p className="text-lg text-gray-300 font-light">
            5가지 사용자의 완전한 업무 흐름을 확인하세요
          </p>
        </div>

        {/* 사용자 타입 선택 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          {(Object.keys(userTypeInfo) as UserType[]).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`p-4 rounded-xl font-bold text-white transition-all ${
                activeType === type
                  ? `bg-gradient-to-r ${userTypeInfo[type].color} shadow-2xl scale-105`
                  : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <div className="text-2xl mb-2">{userTypeInfo[type].icon}</div>
              <div className="text-sm">{userTypeInfo[type].label}</div>
            </button>
          ))}
        </div>

        {/* 현재 사용자 정보 */}
        <div className={`bg-gradient-to-r ${userInfo.color} rounded-2xl p-8 mb-12 text-white shadow-2xl`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold">{userInfo.label}의 하루</h2>
              <p className="text-sm opacity-90 mt-2">총 {stepCount}개 단계 · {completedCount}개 완료</p>
            </div>
            <div className="text-6xl">{userInfo.icon}</div>
          </div>

          {/* 진행률 바 */}
          <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm mt-2 opacity-90">{Math.round(progress)}% 진행됨</p>
        </div>

        {/* 워크플로우 타임라인 */}
        <div className="space-y-6 mb-12">
          {workflow.map((step, idx) => {
            const statusConfig = {
              completed: { bg: 'bg-green-900/30', border: 'border-green-500', dot: 'bg-green-500' },
              active: { bg: 'bg-blue-900/30', border: 'border-blue-500', dot: 'bg-blue-500 animate-pulse' },
              pending: { bg: 'bg-gray-800/30', border: 'border-gray-600', dot: 'bg-gray-500' }
            };
            const config = statusConfig[step.status];

            return (
              <div key={idx} className="flex gap-6">
                {/* 타임라인 막대 */}
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${config.dot} border-4 border-slate-900`} />
                  {idx < workflow.length - 1 && (
                    <div className={`w-1 h-20 ${config.dot === 'bg-green-500' ? 'bg-green-500' : config.dot === 'bg-blue-500 animate-pulse' ? 'bg-blue-500' : 'bg-gray-600'}`} />
                  )}
                </div>

                {/* 단계 상세 정보 */}
                <div className={`flex-1 p-6 rounded-xl border-2 ${config.bg} ${config.border} transition-all hover:shadow-lg`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{step.icon}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white">{step.title}</h3>
                          <p className="text-sm text-gray-400">{step.time}</p>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm font-light">{step.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      step.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      step.status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-600/20 text-gray-400'
                    }`}>
                      {step.status === 'completed' ? '✓ 완료' : step.status === 'active' ? '● 진행중' : '○ 대기중'}
                    </span>
                  </div>

                  {/* 세부사항 */}
                  {step.details && (
                    <div className="mt-4 pt-4 border-t border-gray-600/30 space-y-2">
                      {step.details.map((detail, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <span className="text-gray-500">→</span>
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 워크플로우 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-green-900/20 border border-green-500 rounded-xl p-6">
            <div className="text-3xl mb-2">✅</div>
            <h3 className="font-bold text-white mb-2">시작</h3>
            <p className="text-sm text-green-300">{workflow[0].title}</p>
            <p className="text-xs text-gray-400 mt-1">{workflow[0].time}</p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500 rounded-xl p-6">
            <div className="text-3xl mb-2">🔄</div>
            <h3 className="font-bold text-white mb-2">진행중</h3>
            <p className="text-sm text-blue-300">{workflow.find(s => s.status === 'active')?.title || '없음'}</p>
            <p className="text-xs text-gray-400 mt-1">{workflow.find(s => s.status === 'active')?.time || '-'}</p>
          </div>

          <div className="bg-gray-800/20 border border-gray-600 rounded-xl p-6">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-bold text-white mb-2">목표</h3>
            <p className="text-sm text-gray-300">{workflow[workflow.length - 1].title}</p>
            <p className="text-xs text-gray-400 mt-1">{workflow[workflow.length - 1].time}</p>
          </div>
        </div>

        {/* 팁 */}
        <div className="bg-amber-900/20 border border-amber-500 rounded-xl p-6 text-center">
          <p className="text-amber-300 font-light">
            💡 <span className="font-semibold">팁:</span> 왼쪽 버튼을 클릭해서 5가지 사용자의 완전한 워크플로우를 비교해보세요!
          </p>
        </div>
      </div>
    </div>
  );
}
