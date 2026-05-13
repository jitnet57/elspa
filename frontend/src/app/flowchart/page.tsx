'use client';

export default function FlowchartPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-2">Servio 업무 플로우</h1>
          <p className="text-slate-400 text-lg">드라이버 + 마사지사 자동 매칭 시스템</p>
        </div>

        {/* Main Flowchart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Customer Flow */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur">
            <h2 className="text-2xl font-bold text-cyan-400 mb-8 flex items-center gap-2">
              👥 고객 플로우
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-white font-bold">서비스 요청</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  앱에서 서비스 선택<br/>
                  드라이버 또는 마사지사 선택
                </p>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-cyan-600"></div>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-white font-bold">위치/시간 입력</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  픽업 위치 설정<br/>
                  원하는 시간 설정
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-cyan-600"></div>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-white font-bold">결제 진행</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  신용카드/모바일 결제<br/>
                  보증금 결제 (선택)
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-cyan-600"></div>
              </div>

              {/* Step 4 */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <h3 className="text-white font-bold">매칭 대기</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  가용 드라이버/테라피스트 검색<br/>
                  자동 할당 진행 중...
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-cyan-500 to-cyan-600"></div>
              </div>

              {/* Step 5 */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    5
                  </div>
                  <h3 className="text-white font-bold">서비스 제공</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  드라이버: 픽업 → 이동 → 드롭<br/>
                  테라피스트: 마사지 시술
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600"></div>
              </div>

              {/* Step 6 */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    6
                  </div>
                  <h3 className="text-white font-bold">평가 & 완료</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  서비스 만족도 평가<br/>
                  팁 설정 (선택)
                </p>
              </div>
            </div>
          </div>

          {/* Driver Flow */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur">
            <h2 className="text-2xl font-bold text-orange-400 mb-8 flex items-center gap-2">
              🚗 드라이버 플로우
            </h2>

            <div className="space-y-4">
              {/* Ready */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ①
                  </div>
                  <h3 className="text-white font-bold">준비 상태</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  드라이버 로그인<br/>
                  준비 상태로 변경
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600"></div>
              </div>

              {/* Request Match */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ②
                  </div>
                  <h3 className="text-white font-bold">요청 매칭</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  거리/시간 기반 매칭<br/>
                  고객 요청 알림 수신
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600"></div>
              </div>

              {/* Accept */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ③
                  </div>
                  <h3 className="text-white font-bold">요청 수락</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  고객 정보 확인<br/>
                  요청 수락/거절
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600"></div>
              </div>

              {/* Navigate */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-orange-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ④
                  </div>
                  <h3 className="text-white font-bold">픽업 진행</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  고객 위치로 네비게이션<br/>
                  도착 알림
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-orange-500 to-orange-600"></div>
              </div>

              {/* Transport */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ⑤
                  </div>
                  <h3 className="text-white font-bold">운송 진행</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  고객 탑승<br/>
                  실시간 위치 공유
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600"></div>
              </div>

              {/* Drop-off */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ⑥
                  </div>
                  <h3 className="text-white font-bold">드롭 완료</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  목적지 도착<br/>
                  서비스 완료 기록
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600"></div>
              </div>

              {/* Rating */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    ⑦
                  </div>
                  <h3 className="text-white font-bold">평가 수신</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  고객 평가 받음<br/>
                  보상금 정산
                </p>
              </div>
            </div>
          </div>

          {/* Therapist Flow */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur">
            <h2 className="text-2xl font-bold text-pink-400 mb-8 flex items-center gap-2">
              💆 테라피스트 플로우
            </h2>

            <div className="space-y-4">
              {/* Register */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-pink-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    Ⓐ
                  </div>
                  <h3 className="text-white font-bold">프로필 등록</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  프로필 작성<br/>
                  자격증/경력 등록
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-pink-600"></div>
              </div>

              {/* Availability */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-pink-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    Ⓑ
                  </div>
                  <h3 className="text-white font-bold">가용 시간 설정</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  일일 가용 시간 입력<br/>
                  전문 분야 선택
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-pink-600"></div>
              </div>

              {/* Matching Algo */}
              <div className="bg-blue-700/30 rounded-lg p-4 border border-blue-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    Ⓒ
                  </div>
                  <h3 className="text-white font-bold">자동 매칭</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  AI 알고리즘 실행<br/>
                  - 전문성 매칭 (70%)<br/>
                  - 거리 기반 (20%)<br/>
                  - 평점 순 (10%)
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-blue-500 to-blue-600"></div>
              </div>

              {/* Notification */}
              <div className="bg-slate-700/50 rounded-lg p-4 border border-pink-500/30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    Ⓓ
                  </div>
                  <h3 className="text-white font-bold">매칭 알림</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  예약 요청 수신<br/>
                  고객 프로필 확인
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-pink-500 to-pink-600"></div>
              </div>

              {/* Service */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    Ⓔ
                  </div>
                  <h3 className="text-white font-bold">서비스 제공</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  마사지 시술<br/>
                  진행 기록 저장
                </p>
              </div>

              <div className="flex justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 to-green-600"></div>
              </div>

              {/* Complete */}
              <div className="bg-green-700/30 rounded-lg p-4 border border-green-500/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    Ⓕ
                  </div>
                  <h3 className="text-white font-bold">완료 & 정산</h3>
                </div>
                <p className="text-sm text-slate-300 ml-11">
                  서비스 완료 기록<br/>
                  수익금 정산
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Matching Algorithm Detail */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur mb-12">
          <h2 className="text-2xl font-bold text-blue-400 mb-6">🤖 자동 매칭 알고리즘</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Expertise Matching */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-blue-500/30">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-white font-bold mb-3">전문성 매칭 (70%)</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ 고객이 요청한 마사지 종류</li>
                <li>✓ 테라피스트의 전문 분야</li>
                <li>✓ 경력 년수</li>
                <li>✓ 자격증 보유 여부</li>
              </ul>
            </div>

            {/* Distance & Time */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-blue-500/30">
              <div className="text-3xl mb-3">📍</div>
              <h3 className="text-white font-bold mb-3">거리 & 시간 (20%)</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ 고객과의 거리</li>
                <li>✓ 가용 시간대</li>
                <li>✓ 예상 이동 시간</li>
                <li>✓ 현재 업무 상태</li>
              </ul>
            </div>

            {/* Rating & History */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-blue-500/30">
              <div className="text-3xl mb-3">⭐</div>
              <h3 className="text-white font-bold mb-3">평점 & 이력 (10%)</h3>
              <ul className="text-sm text-slate-300 space-y-2">
                <li>✓ 전체 평점</li>
                <li>✓ 최근 리뷰</li>
                <li>✓ 완료 건수</li>
                <li>✓ 취소율</li>
              </ul>
            </div>
          </div>

          {/* Matching Score */}
          <div className="mt-6 bg-blue-900/30 rounded-lg p-6 border border-blue-500/50">
            <h3 className="text-white font-bold mb-4">최종 매칭 점수 계산</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">전문성 (70%) × 테라피스트 전문 점수</span>
                <div className="text-right">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-5/6 h-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">거리/시간 (20%) × 근처도 점수</span>
                <div className="text-right">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-1/2 h-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">평점 (10%) × 평점 점수</span>
                <div className="text-right">
                  <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-blue-500"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-blue-500/30">
                <span className="text-white font-bold">총 매칭 점수</span>
                <span className="text-2xl font-bold text-blue-400">92/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur">
          <h2 className="text-2xl font-bold text-purple-400 mb-6">🔄 시스템 상호작용 다이어그램</h2>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Customer App */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-purple-500/30 text-center">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="text-white font-bold">고객 앱</h3>
              <p className="text-xs text-slate-400 mt-2">서비스 요청<br/>결제<br/>평가</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            </div>

            {/* Backend Server */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-purple-500/30 text-center">
              <div className="text-4xl mb-3">⚙️</div>
              <h3 className="text-white font-bold">백엔드 서버</h3>
              <p className="text-xs text-slate-400 mt-2">매칭 알고리즘<br/>결제 처리<br/>실시간 추적</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center">
              <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-purple-600"></div>
            </div>

            {/* Provider Apps */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-purple-500/30 text-center">
              <div className="text-4xl mb-3">👨‍💼</div>
              <h3 className="text-white font-bold">제공자 앱</h3>
              <p className="text-xs text-slate-400 mt-2">요청 수신<br/>서비스 제공<br/>정산</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
