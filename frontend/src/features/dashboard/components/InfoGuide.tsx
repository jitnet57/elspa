export function InfoGuide() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200 shadow-sm">
        <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
          📱 구현된 UI 페이지 (총 11개)
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">어드민 대시보드</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">카운터 모니터</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">매칭 제어판</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">예약 검색</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">시뮬레이션</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">고객 서비스</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">예약 마법사</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">마이페이지</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">리뷰 페이지</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">워크플로우</span></div>
          <div className="flex items-center gap-2"><span className="text-blue-600">✓</span> <span className="text-gray-700">요구사항</span></div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-sm">
        <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
          🎯 주요 기능
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">•</span>
            <span><strong>AI 매칭:</strong> 70/20/10 점수 기반 자동 배정</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">•</span>
            <span><strong>실시간 모니터:</strong> 86개 침대 상태 추적</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">•</span>
            <span><strong>What-if 시뮬:</strong> 조건별 매칭 미리보기</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">•</span>
            <span><strong>5가지 사용자:</strong> 고객, 매니저, 테라피스트, 드라이버, 카운터</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-orange-600 font-bold">•</span>
            <span><strong>루트 그룹핑:</strong> 마사지룸 1/2, VIP룸, 커플룸 관리</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
