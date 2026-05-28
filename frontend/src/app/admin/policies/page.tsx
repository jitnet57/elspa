'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface SettingsSection {
  id: string;
  name: string;
  description: string;
  color: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    id: 'bed-groups',
    name: '🛏️ 베드 그룹 관리',
    description: '마사지실별 침대 그룹 설정',
    color: 'bg-blue-50 border-blue-200',
  },
  {
    id: 'company',
    name: '🏢 업체 등록',
    description: '회사/업체 정보 관리',
    color: 'bg-emerald-50 border-emerald-200',
  },
  {
    id: 'guide',
    name: '📖 가이드 등록',
    description: '운영 규칙 및 정책 설정',
    color: 'bg-amber-50 border-amber-200',
  },
  {
    id: 'therapist',
    name: '테라피스트 등록',
    description: '테라피스트 정보 관리',
    color: 'bg-pink-50 border-pink-200',
  },
  {
    id: 'staff',
    name: '👥 직원 등록',
    description: '일반 직원 정보 관리',
    color: 'bg-purple-50 border-purple-200',
  },
];

export default function PoliciesPage() {
  const [selectedSection, setSelectedSection] = useState<string>('bed-groups');
  const selectedData = SETTINGS_SECTIONS.find(s => s.id === selectedSection);

  const renderContent = () => {
    switch (selectedSection) {
      case 'bed-groups':
        return <BedGroupsContent />;
      case 'company':
        return <CompanyContent />;
      case 'guide':
        return <GuideContent />;
      case 'therapist':
        return <TherapistContent />;
      case 'staff':
        return <StaffContent />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
            ⚙️ Settings
          </h1>
          <p className="text-lg text-gray-600 font-light">
            관리 설정 및 정책 관리
          </p>
        </div>

        {/* Section Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          {SETTINGS_SECTIONS.map(section => (
            <button
              key={section.id}
              onClick={() => setSelectedSection(section.id)}
              className={`p-6 rounded-xl border-2 transition-all text-left ${
                selectedSection === section.id
                  ? `${section.color} border-current shadow-lg scale-105`
                  : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              <div className="font-bold text-base text-gray-900 mb-2">
                {section.name}
              </div>
              <div className="text-xs text-gray-600">
                {section.description}
              </div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 베드 그룹 관리 컴포넌트
// ============================================================
function BedGroupsContent() {
  const [bedGroups] = useState([
    { id: 1, name: '🛏️ 마사지실1', beds: 30, status: '정상' },
    { id: 2, name: '🛏️ 마사지실2', beds: 30, status: '정상' },
    { id: 3, name: '👑 VIP실', beds: 14, status: '정상' },
    { id: 4, name: '🏢 기타실', beds: 12, status: '정상' },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">마사지실 침대 구성</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
          <Plus size={18} />
          새 그룹 추가
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {bedGroups.map(group => (
          <div key={group.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-lg text-gray-900">{group.name}</div>
                <div className="text-sm text-gray-500">총 {group.beds}개 침대</div>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                {group.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition">
                <Edit2 size={14} />
                편집
              </button>
              <button className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition">
                <Trash2 size={14} />
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 업체 등록 컴포넌트
// ============================================================
function CompanyContent() {
  const [companies] = useState([
    { id: 1, name: 'ElSpa Plaza', address: 'Seoul, Korea', phone: '02-1234-5678', status: '활성' },
    { id: 2, name: 'Wellness Center', address: 'Busan, Korea', phone: '051-2345-6789', status: '활성' },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">등록된 업체</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition">
          <Plus size={18} />
          업체 추가
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">업체명</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">주소</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">연락처</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">상태</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">작업</th>
            </tr>
          </thead>
          <tbody>
            {companies.map(company => (
              <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{company.name}</td>
                <td className="px-4 py-3 text-gray-600">{company.address}</td>
                <td className="px-4 py-3 text-gray-600">{company.phone}</td>
                <td className="px-4 py-3">
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                    {company.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 transition">
                    <Edit2 size={16} />
                  </button>
                  <button className="text-red-600 hover:text-red-800 transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 가이드 등록 컴포넌트
// ============================================================
function GuideContent() {
  const [guides] = useState([
    { id: 1, title: '서비스 운영 규칙', category: '운영 정책', status: '활성' },
    { id: 2, title: '고객 응대 가이드', category: '교육', status: '활성' },
    { id: 3, title: '안전 수칙', category: '안전', status: '활성' },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">운영 가이드</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
          <Plus size={18} />
          가이드 추가
        </button>
      </div>

      <div className="space-y-4">
        {guides.map(guide => (
          <div key={guide.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-bold text-gray-900">{guide.title}</div>
                <div className="text-sm text-gray-500">분류: {guide.category}</div>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                {guide.status}
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="text-blue-600 hover:text-blue-800 transition">
                <Edit2 size={16} />
              </button>
              <button className="text-red-600 hover:text-red-800 transition">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 테라피스트 등록 컴포넌트
// ============================================================
function TherapistContent() {
  const [therapists] = useState([
    { id: 1, name: 'Maria Santos', specialty: 'Swedish Massage', experience: '5년', status: '활동 중' },
    { id: 2, name: 'Ana Mercado', specialty: 'Thai Massage', experience: '3년', status: '활동 중' },
    { id: 3, name: 'Rosa Chavez', specialty: 'Hot Stone', experience: '4년', status: '휴직' },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">테라피스트 관리</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition">
          <Plus size={18} />
          테라피스트 추가
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">이름</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">전문</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">경력</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">상태</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">작업</th>
            </tr>
          </thead>
          <tbody>
            {therapists.map(therapist => (
              <tr key={therapist.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{therapist.name}</td>
                <td className="px-4 py-3 text-gray-600">{therapist.specialty}</td>
                <td className="px-4 py-3 text-gray-600">{therapist.experience}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    therapist.status === '활동 중'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {therapist.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 transition">
                    <Edit2 size={16} />
                  </button>
                  <button className="text-red-600 hover:text-red-800 transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 직원 등록 컴포넌트
// ============================================================
function StaffContent() {
  const [staff] = useState([
    { id: 1, name: 'John Doe', position: '매니저', department: '운영', status: '근무 중' },
    { id: 2, name: 'Jane Smith', position: '어시스턴트', department: '고객서비스', status: '근무 중' },
    { id: 3, name: 'Mike Johnson', position: '청소원', department: '시설', status: '휴무' },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">직원 관리</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition">
          <Plus size={18} />
          직원 추가
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left font-semibold text-gray-900">이름</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">직책</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">부서</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">상태</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-900">작업</th>
            </tr>
          </thead>
          <tbody>
            {staff.map(employee => (
              <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{employee.name}</td>
                <td className="px-4 py-3 text-gray-600">{employee.position}</td>
                <td className="px-4 py-3 text-gray-600">{employee.department}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    employee.status === '근무 중'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button className="text-blue-600 hover:text-blue-800 transition">
                    <Edit2 size={16} />
                  </button>
                  <button className="text-red-600 hover:text-red-800 transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
