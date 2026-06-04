import { StatusColor, StatusType } from './types';

export const useDashboardData = () => {
  const stats = [
    { label: '활성 테라피스트', value: '12', icon: '👥', change: '+2', changeType: 'positive' as const },
    { label: '오늘 예약', value: '24', icon: '📅', change: '+8', changeType: 'positive' as const },
    { label: '월 매출', value: '₱4.8M', icon: '💰', change: '+12%', changeType: 'positive' as const },
    { label: '고객 만족도', value: '4.8★', icon: '⭐', change: '+0.2', changeType: 'positive' as const },
  ];

  const recentBookings = [
    { id: 1, customer: '김민준', therapist: 'Sarah', service: '스웨디시 60분', time: '10:00 AM', status: 'confirmed' as const, revenue: '₱80,000' },
    { id: 2, customer: '이수연', therapist: 'Emma', service: '타이 마사지 90분', time: '11:30 AM', status: 'confirmed' as const, revenue: '₱120,000' },
    { id: 3, customer: '정현준', therapist: 'Jessica', service: '핫스톤 60분', time: '02:00 PM', status: 'in_progress' as const, revenue: '₱100,000' },
    { id: 4, customer: '박지은', therapist: 'Amanda', service: '커플 마사지 120분', time: '03:00 PM', status: 'pending' as const, revenue: '₱180,000' },
    { id: 5, customer: '최준호', therapist: 'Sarah', service: '발 마사지 30분', time: '04:30 PM', status: 'completed' as const, revenue: '₱50,000' },
  ];

  const therapists = [
    { name: 'Sarah', bookings: 8, rating: 4.9, revenue: '₱640K', availability: '95%', imageColor: 'from-orange-100 to-amber-100' },
    { name: 'Emma', bookings: 6, rating: 4.7, revenue: '₱480K', availability: '87%', imageColor: 'from-pink-100 to-orange-100' },
    { name: 'Jessica', bookings: 7, rating: 4.8, revenue: '₱560K', availability: '92%', imageColor: 'from-amber-100 to-yellow-100' },
    { name: 'Amanda', bookings: 5, rating: 4.6, revenue: '₱400K', availability: '80%', imageColor: 'from-yellow-100 to-orange-100' },
  ];

  const weeklyData = [65, 45, 72, 58, 85, 92, 78];
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const maxValue = Math.max(...weeklyData);

  return { stats, recentBookings, therapists, weeklyData, days, maxValue };
};

export const useStatusColor = (status: StatusType): StatusColor => {
  const colors: Record<StatusType, StatusColor> = {
    confirmed: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    completed: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  };
  return colors[status];
};

export const useStatusText = (status: StatusType): string => {
  const texts: Record<StatusType, string> = {
    confirmed: '확정됨',
    in_progress: '진행 중',
    pending: '대기중',
    completed: '완료',
  };
  return texts[status];
};

