'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ArrowUp, ArrowDown, ArrowLeftRight } from 'lucide-react';

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

        {/* ============================================================ */}
        {/* 📌 섹션: Systems Audit (시스템 감사)                          */}
        {/* 📋 목적: 대시보드에서 옮겨온 시스템 감사 패널                  */}
        {/*   - BILLING ACCURACY 진행 바 + 로그/검증 바로가기 버튼        */}
        {/* ============================================================ */}
        <div className="mt-8 bg-white rounded-xl border-2 border-gray-200 shadow-lg p-8">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Systems Audit</h2>
            <span className="text-sm text-gray-500 font-light">시스템 감사</span>
          </div>

          {/* BILLING ACCURACY 진행 바 (얇은 막대, 99.8% 채움) */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold tracking-wide text-gray-600">
                BILLING ACCURACY
              </span>
              <span className="text-xs font-bold text-emerald-600">99.8%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: '99.8%' }}
              />
            </div>
          </div>

          {/* 바로가기 버튼 2개 */}
          <div className="flex gap-3 mt-6">
            <Link
              href="/admin/change-logs"
              className="flex-1 text-center px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              LOGS
            </Link>
            <Link
              href="/admin/test-data"
              className="flex-1 text-center px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              VALIDATE
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 베드 그룹 관리 컴포넌트
// ============================================================
interface BedGroup {
  id: number;
  name: string;
  beds: number;
  status: string;
}

const DEFAULT_BED_GROUPS: BedGroup[] = [
  { id: 1, name: '🛏️ 마사지실1', beds: 30, status: '정상' },
  { id: 2, name: '🛏️ 마사지실2', beds: 30, status: '정상' },
  { id: 3, name: '👑 VIP실', beds: 14, status: '정상' },
  { id: 4, name: '🏢 기타실', beds: 12, status: '정상' },
];
const BED_GROUPS_KEY = 'elspa.bedGroups';

function BedGroupsContent() {
  const [groups, setGroups] = useState<BedGroup[]>(DEFAULT_BED_GROUPS);
  const [editing, setEditing] = useState<BedGroup | null>(null);
  const [moveOpen, setMoveOpen] = useState(false);

  // 로드/저장 (localStorage 영속)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(BED_GROUPS_KEY);
      if (raw) setGroups(JSON.parse(raw));
    } catch {}
  }, []);
  const persist = (next: BedGroup[]) => {
    setGroups(next);
    try { localStorage.setItem(BED_GROUPS_KEY, JSON.stringify(next)); } catch {}
  };

  const totalBeds = groups.reduce((s, g) => s + g.beds, 0);

  const addGroup = () => {
    const id = Math.max(0, ...groups.map(g => g.id)) + 1;
    const g: BedGroup = { id, name: '🆕 새 그룹', beds: 0, status: '정상' };
    persist([...groups, g]);
    setEditing(g);
  };
  const removeGroup = (id: number) => {
    if (confirm('이 그룹을 삭제할까요?')) persist(groups.filter(g => g.id !== id));
  };
  const moveGroup = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[idx], next[j]] = [next[j], next[idx]];
    persist(next);
  };
  const saveEdit = (g: BedGroup) => {
    persist(groups.map(x => (x.id === g.id ? g : x)));
    setEditing(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">마사지실 침대 구성</h2>
          <p className="text-sm text-gray-500 mt-1">총 {totalBeds}개 침대 · {groups.length}개 그룹</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMoveOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition">
            <ArrowLeftRight size={18} /> 베드 이동
          </button>
          <button onClick={addGroup} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
            <Plus size={18} /> 새 그룹 추가
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map((group, idx) => (
          <div key={group.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-bold text-lg text-gray-900">{group.name}</div>
                <div className="text-sm text-gray-500">총 {group.beds}개 침대</div>
              </div>
              <div className="flex items-center gap-1">
                {/* 순서 이동 */}
                <button onClick={() => moveGroup(idx, -1)} disabled={idx === 0} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="위로"><ArrowUp size={16} /></button>
                <button onClick={() => moveGroup(idx, 1)} disabled={idx === groups.length - 1} className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-30" title="아래로"><ArrowDown size={16} /></button>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold ml-1">{group.status}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(group)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition">
                <Edit2 size={14} /> 편집
              </button>
              <button onClick={() => removeGroup(group.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50 transition">
                <Trash2 size={14} /> 삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 편집 모달 */}
      {editing && (
        <EditGroupModal group={editing} onClose={() => setEditing(null)} onSave={saveEdit} />
      )}
      {/* 베드 이동 모달 */}
      {moveOpen && (
        <MoveBedsModal groups={groups} onClose={() => setMoveOpen(false)} onMove={persist} />
      )}
    </div>
  );
}

function EditGroupModal({ group, onClose, onSave }: { group: BedGroup; onClose: () => void; onSave: (g: BedGroup) => void }) {
  const [name, setName] = useState(group.name);
  const [beds, setBeds] = useState(group.beds);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold mb-4">그룹 편집</h3>
        <label className="text-sm font-semibold text-gray-700">그룹 이름</label>
        <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 mb-3 px-3 py-2 border rounded-lg text-gray-900" />
        <label className="text-sm font-semibold text-gray-700">침대 수</label>
        <input type="number" value={beds} onChange={e => setBeds(Number(e.target.value) || 0)} className="w-full mt-1 mb-4 px-3 py-2 border rounded-lg text-gray-900" />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-bold">취소</button>
          <button onClick={() => onSave({ ...group, name, beds })} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">저장</button>
        </div>
      </div>
    </div>
  );
}

function MoveBedsModal({ groups, onClose, onMove }: { groups: BedGroup[]; onClose: () => void; onMove: (g: BedGroup[]) => void }) {
  const [from, setFrom] = useState(groups[0]?.id ?? 0);
  const [to, setTo] = useState(groups[1]?.id ?? 0);
  const [count, setCount] = useState(1);
  const [err, setErr] = useState('');

  const apply = () => {
    if (from === to) return setErr('서로 다른 그룹을 선택하세요.');
    const src = groups.find(g => g.id === from)!;
    if (count <= 0 || count > src.beds) return setErr(`이동 수는 1~${src.beds} 사이여야 합니다.`);
    onMove(groups.map(g => g.id === from ? { ...g, beds: g.beds - count } : g.id === to ? { ...g, beds: g.beds + count } : g));
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white text-gray-900 rounded-xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-lg font-bold mb-4">베드 이동</h3>
        <label className="text-sm font-semibold text-gray-700">출발 그룹</label>
        <select value={from} onChange={e => { setFrom(Number(e.target.value)); setErr(''); }} className="w-full mt-1 mb-3 px-3 py-2 border rounded-lg text-gray-900">
          {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.beds})</option>)}
        </select>
        <label className="text-sm font-semibold text-gray-700">도착 그룹</label>
        <select value={to} onChange={e => { setTo(Number(e.target.value)); setErr(''); }} className="w-full mt-1 mb-3 px-3 py-2 border rounded-lg text-gray-900">
          {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.beds})</option>)}
        </select>
        <label className="text-sm font-semibold text-gray-700">이동 침대 수</label>
        <input type="number" value={count} onChange={e => { setCount(Number(e.target.value) || 0); setErr(''); }} className="w-full mt-1 mb-2 px-3 py-2 border rounded-lg text-gray-900" />
        {err && <p className="text-sm text-red-600 mb-2">{err}</p>}
        <div className="flex gap-2 mt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-200 rounded-lg font-bold">취소</button>
          <button onClick={apply} className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg font-bold">이동</button>
        </div>
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
