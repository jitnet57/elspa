'use client';
import { useState, useEffect, useMemo } from 'react';
import { getEmployees, type Employee } from '@/lib/api/payroll-client';

const TYPE_EMOJI: Record<string, string> = {
  therapist: '👨‍⚕️', driver: '🚗', manager: '👔', nail: '💅', maintenance: '🔧', hollys: '☕',
};
const inputCls =
  'px-3 py-2 bg-slate-800 border border-slate-600 rounded text-slate-100 text-sm focus:border-blue-500 focus:outline-none placeholder-slate-500';

export default function EmployeePicker({ value, onChange }: { value: string; onChange: (id: string, emp?: Employee) => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    setLoading(true);
    getEmployees()
      .then(setEmployees)
      .catch((e) => setError(e instanceof Error ? e.message : '직원 로드 실패'))
      .finally(() => setLoading(false));
  }, []);

  const selected = useMemo(() => employees.find((e) => String(e.id) === String(value)), [employees, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      e.name?.toLowerCase().includes(q) || String(e.id).includes(q) || (e.employee_type || '').toLowerCase().includes(q));
  }, [employees, query]);

  return (
    <div className="w-full space-y-2">
      {/* 선택된 직원 = 드롭존 */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const id = e.dataTransfer.getData('text/plain');
          const emp = employees.find((x) => String(x.id) === id);
          if (id) onChange(id, emp);
        }}
        className={`flex items-center gap-2 px-3 py-2 rounded border-2 border-dashed text-sm transition-colors ${
          dragOver ? 'border-blue-400 bg-blue-500/10' : 'border-slate-600 bg-slate-800'
        }`}
      >
        {selected ? (
          <>
            <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded-full text-xs font-semibold">
              {TYPE_EMOJI[selected.employee_type] ?? '👤'} {selected.name} <span className="opacity-60">#{selected.id}</span>
            </span>
            <button type="button" onClick={() => onChange('')} className="text-slate-400 hover:text-red-300 ml-auto">✕</button>
          </>
        ) : value ? (
          <span className="text-slate-300">직원 #{value}</span>
        ) : (
          <span className="text-slate-500">여기로 직원을 끌어다 놓거나 아래에서 선택하세요</span>
        )}
      </div>
      {/* 검색창 */}
      <input
        className={inputCls + ' w-full'}
        type="text"
        placeholder="🔍 직원 검색 (이름·ID·직군)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* 직원 칩 목록 (드래그 가능) */}
      {loading ? (
        <div className="text-xs text-slate-400 py-2">직원 불러오는 중…</div>
      ) : error ? (
        <div className="text-xs text-red-300 py-2">⚠️ {error}</div>
      ) : (
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <span className="text-xs text-slate-500 py-1">검색 결과 없음</span>
          ) : (
            filtered.map((emp) => {
              const isSel = String(emp.id) === String(value);
              return (
                <button
                  key={emp.id}
                  type="button"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', String(emp.id))}
                  onClick={() => onChange(String(emp.id), emp)}
                  title="클릭 또는 드래그로 선택"
                  className={`px-2 py-1 rounded-full text-xs font-medium cursor-grab active:cursor-grabbing transition-colors ${
                    isSel ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {TYPE_EMOJI[emp.employee_type] ?? '👤'} {emp.name} <span className="opacity-50">#{emp.id}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
