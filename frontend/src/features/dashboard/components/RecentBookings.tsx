import { Booking } from '@/lib/dashboard/types';
import { useStatusColor, useStatusText } from '@/lib/dashboard/hooks';

interface RecentBookingsProps {
  bookings: Booking[];
}

export function RecentBookings({ bookings }: RecentBookingsProps) {
  return (
    <div className="lg:col-span-2">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">최근 예약</h2>
            <p className="text-xs text-gray-500 mt-1 font-light">총 {bookings.length}건</p>
          </div>
          <a href="#" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
            모두 보기 →
          </a>
        </div>

        <div className="space-y-3">
          {bookings.map((booking) => {
            const badge = useStatusColor(booking.status);
            const statusText = useStatusText(booking.status);
            return (
              <div
                key={booking.id}
                className="flex items-center justify-between p-4 border border-stone-100 rounded-lg hover:bg-stone-50 transition-all group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-3 h-3 rounded-full ${badge.dot}`}></div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 text-sm">{booking.customer}</p>
                    <p className="text-xs text-gray-500 font-light mt-1">
                      {booking.therapist} · {booking.service}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600 font-medium mb-1">{booking.time}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${badge.bg} ${badge.text}`}>
                    {statusText}
                  </span>
                </div>
                <p className="text-sm font-bold text-gray-900 ml-4 min-w-fit">{booking.revenue}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
