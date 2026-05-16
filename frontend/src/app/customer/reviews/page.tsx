'use client';

import { useState } from 'react';

export default function ReviewsPage() {
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const reviews = [
    {
      id: 1,
      rating: 5,
      title: '정말 최고의 경험이었어요!',
      content: '처음 방문했는데 시설도 깨끗하고 테라피스트님이 정말 전문적이었어요. 몸의 피로가 싹 풀렸습니다. 꼭 다시 방문하고 싶습니다!',
      author: '김민지',
      service: '스웨디시 마사지',
      therapist: 'Sarah',
      date: '2026-05-08',
      helpful: 127,
      images: ['💆‍♀️'],
    },
    {
      id: 2,
      rating: 5,
      title: '커플 패키지 정말 좋아요!',
      content: '남편과 함께 다녀왔는데 둘 다 너무 만족했어요. 프리미엄 서비스라는 느낌이 들었고, 가격도 합리적입니다.',
      author: '박수진',
      service: '커플 패키지',
      therapist: 'Sarah, Emma',
      date: '2026-05-01',
      helpful: 89,
      images: ['👫'],
    },
    {
      id: 3,
      rating: 5,
      title: '만성 피로가 개선됐어요',
      content: '타이 마사지를 받았는데 예상 이상으로 좋았어요. 특히 경추 부분이 많이 풀렸고, 다음날 몸 상태가 정말 좋았습니다.',
      author: '이준호',
      service: '타이 마사지',
      therapist: 'Emma',
      date: '2026-04-24',
      helpful: 156,
      images: ['🧘'],
    },
    {
      id: 4,
      rating: 4,
      title: '좋은데 조금 비싼 편',
      content: '서비스 품질은 정말 좋은데, 가격이 조금 비싼 편 같아요. 그래도 가성비는 좋은 것 같습니다.',
      author: '정현준',
      service: '핫스톤 테라피',
      therapist: 'Jessica',
      date: '2026-04-15',
      helpful: 42,
      images: ['🔥'],
    },
    {
      id: 5,
      rating: 5,
      title: '발 마사지 정말 좋습니다!',
      content: '30분 코스인데 정말 알차게 해주셨어요. 발이 시원해졌고, 다음날 컨디션이 훨씬 좋았습니다. 추천합니다!',
      author: '최유미',
      service: '발 마사지',
      therapist: 'Amanda',
      date: '2026-04-10',
      helpful: 203,
      images: ['🦶'],
    },
  ];

  const filteredReviews =
    filterRating === 'all'
      ? reviews
      : reviews.filter((r) => r.rating === parseInt(filterRating));

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === 'recent') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'helpful') return b.helpful - a.helpful;
    if (sortBy === 'rating') return b.rating - a.rating;
    return 0;
  });

  const averageRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  const ratingCounts = {
    5: reviews.filter((r) => r.rating === 5).length,
    4: reviews.filter((r) => r.rating === 4).length,
    3: reviews.filter((r) => r.rating === 3).length,
    2: reviews.filter((r) => r.rating === 2).length,
    1: reviews.filter((r) => r.rating === 1).length,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* Header - 모바일 최적화 */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">고객 후기</h1>
        <p className="text-sm sm:text-lg text-gray-600">
          ElSpa 경험담들을 만나보세요
        </p>
      </div>

      {/* Rating Summary - 모바일 최적화 */}
      <div className="bg-white rounded-2xl sm:rounded-xl p-6 sm:p-8 shadow-sm border border-stone-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-4xl sm:text-5xl font-bold text-gray-900">
                {averageRating}
              </span>
              <span className="text-xl sm:text-2xl">⭐</span>
            </div>
            <p className="text-xs sm:text-base text-gray-600">
              {reviews.length}명의 고객 평가 기반
            </p>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-medium text-gray-700 w-8">
                  {rating}★
                </span>
                <div className="flex-1 h-2 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500"
                    style={{
                      width: `${
                        (ratingCounts[rating as keyof typeof ratingCounts] /
                          reviews.length) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="text-xs sm:text-sm text-gray-600 w-8">
                  {ratingCounts[rating as keyof typeof ratingCounts]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters - 모바일 최적화 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between bg-stone-50 rounded-lg p-3 sm:p-4">
        <div className="flex gap-2 sm:gap-3 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <button
            onClick={() => setFilterRating('all')}
            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap hover:scale-105 active:scale-95 ${
              filterRating === 'all'
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-900 border border-stone-200 hover:border-orange-300'
            }`}
          >
            전체 ({reviews.length})
          </button>
          {[5, 4, 3].map((rating) => (
            <button
              key={rating}
              onClick={() => setFilterRating(rating.toString())}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap hover:scale-105 active:scale-95 ${
                filterRating === rating.toString()
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-900 border border-stone-200 hover:border-orange-300'
              }`}
            >
              {rating}★ ({ratingCounts[rating as keyof typeof ratingCounts]})
            </button>
          ))}
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-stone-200 rounded-lg text-xs sm:text-sm text-gray-900 focus:outline-none focus:border-orange-500"
        >
          <option value="recent">최신순</option>
          <option value="helpful">도움이 되는 순</option>
          <option value="rating">평점 높은 순</option>
        </select>
      </div>

      {/* Reviews List - 모바일 최적화 */}
      <div className="space-y-4 sm:space-y-6">
        {sortedReviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 shadow-sm border border-stone-100 hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-300"
          >
            {/* Review Header */}
            <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className={i < review.rating ? 'text-base sm:text-lg' : 'text-gray-300'}
                    >
                      ⭐
                    </span>
                  ))}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {review.title}
                </h3>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap">{review.date}</span>
            </div>

            {/* Service Info */}
            <div className="flex gap-2 mb-3 sm:mb-4 text-xs sm:text-sm flex-wrap">
              <span className="px-2 sm:px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                {review.service}
              </span>
              <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                {review.therapist}
              </span>
            </div>

            {/* Review Content */}
            <p className="text-xs sm:text-base text-gray-700 mb-3 sm:mb-4 leading-relaxed">
              {review.content}
            </p>

            {/* Review Footer */}
            <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-stone-200">
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold">{review.author}</span>님
              </p>
              <button className="flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm text-gray-600 hover:text-orange-600 transition-colors hover:scale-105 active:scale-95">
                <span>👍</span>
                <span className="font-medium">{review.helpful}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CTA - 모바일 최적화 */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl sm:rounded-xl p-6 sm:p-8 text-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          ElSpa를 경험해보세요!
        </h2>
        <p className="text-xs sm:text-base text-gray-600 mb-4 sm:mb-6">
          지금 바로 예약하세요.
        </p>
        <button className="w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-all font-semibold text-sm sm:text-base hover:scale-105 active:scale-95">
          지금 예약하기
        </button>
      </div>
    </div>
  );
}
