'use client';

/**
 * ============================================================
 * 📌 컴포넌트: AttendanceView (모니터 - 출결 탭)
 * 📋 목적: 전 직원(6직군)의 그날 출근/퇴근/결근을 한 화면에서 체크·기록
 * 🔌 데이터: payroll-client.ts
 *           getEmployees() + getAttendance({work_date}) 합쳐 직원별 1행
 *           [출근]=clock_in, [퇴근]=clock_out, [결근]=is_absent 토글
 *           기존 출결 기록(id) 있으면 updateAttendance, 없으면 createAttendance
 * 🎨 모니터 라이트 테마(흰 배경/회색 카드)와 일관
 * 📅 작성일: 2026-06-02
 * ============================================================
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getEmployees,
  getAttendance,
  createAttendance,
  updateAttendance,
  type Employee,
  type AttendanceLog,
} from '@/lib/api/payroll-client';
import { useT } from '@/lib/i18n';
import { useAutoSaveSettings } from '@/lib/hooks/useAutoSaveSettings';
import { isOnline } from '@/lib/db/syncService';
import { db } from '@/lib/db/localDb';

// 직군별 이모지 매핑
const TYPE_EMOJI: Record<Employee['employee_type'], string> = {
  therapist: '👨‍⚕️',
  driver: '🚗',
  manager: '👔',
  nail: '💅',
  maintenance: '🔧',
  hollys: '☕',
};

// 직군 필터 순서 (전체 + 6직군)
const TYPE_ORDER: Employee['employee_type'][] = [
  'therapist', 'driver', 'manager', 'nail', 'maintenance', 'hollys',
];

// 현재 시각 "HH:MM" (attendance 페이지의 time 입력 형식과 동일)
const nowHHMM = (): string => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export default function AttendanceView() {
  const t = useT();
  const { enabled: autoSaveEnabled, intervalMs: autoSaveIntervalMs } = useAutoSaveSettings();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [workDate, setWorkDate] = useState(today);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null); // 저장 중인 employee_id
  const [typeFilter, setTypeFilter] = useState<'all' | Employee['employee_type']>('all');
  // 마지막 자동 저장 시각 (HH:MM), null 이면 미저장
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);

  // 직원 목록 (날짜와 무관 — 1회 로드)
  useEffect(() => {
    getEmployees()
      .then((rows) => setEmployees(rows.filter((e) => e.is_active)))
      .catch((e) => console.error('직원 목록 조회 실패', e));
  }, []);

  // 해당일 출결 조회
  const loadAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await getAttendance({ work_date: workDate });
      // 온라인 성공 시 IndexedDB 캐시 업데이트
      db.attendanceLogs.bulkPut(rows as any).catch(() => {});
      setLogs(rows);
    } catch (e) {
      // 오프라인이면 IndexedDB 폴백
      if (!isOnline()) {
        const local = await db.attendanceLogs.where('work_date').equals(workDate).toArray();
        setLogs(local as unknown as AttendanceLog[]);
      } else {
        console.error('출결 조회 실패', e);
      }
    } finally {
      setLoading(false);
    }
  }, [workDate]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  // employee_id → 해당일 출결 기록
  const logByEmp = useMemo(() => {
    const map = new Map<number, AttendanceLog>();
    for (const l of logs) map.set(l.employee_id, l);
    return map;
  }, [logs]);

  // 직군 필터 적용
  const visibleEmployees = useMemo(() => {
    const list = typeFilter === 'all'
      ? employees
      : employees.filter((e) => e.employee_type === typeFilter);
    return list;
  }, [employees, typeFilter]);

  // 상태 판정: 결근 / 퇴근 / 출근 / 미출근
  const statusOf = (log?: AttendanceLog): 'absent' | 'out' | 'in' | 'none' => {
    if (!log) return 'none';
    if (log.is_absent) return 'absent';
    if (log.clock_out) return 'out';
    if (log.clock_in) return 'in';
    return 'none';
  };

  // 상단 요약 (보이는 직원 기준)
  const summary = useMemo(() => {
    let present = 0; let notIn = 0; let absent = 0;
    for (const emp of visibleEmployees) {
      const s = statusOf(logByEmp.get(emp.id));
      if (s === 'absent') absent += 1;
      else if (s === 'in' || s === 'out') present += 1;
      else notIn += 1;
    }
    return { total: visibleEmployees.length, present, notIn, absent };
  }, [visibleEmployees, logByEmp]);

  // 기록 생성/갱신 공통 — 기존 id 있으면 update, 없으면 create
  const upsert = async (emp: Employee, patch: Partial<AttendanceLog>) => {
    const existing = logByEmp.get(emp.id);
    setSavingId(emp.id);
    try {
      if (existing) {
        await updateAttendance(existing.id, patch);
      } else {
        await createAttendance({
          employee_id: emp.id,
          employee_name: emp.name,
          work_date: workDate,
          late_minutes: 0,
          overtime_minutes: 0,
          is_absent: false,
          holiday_type: 'none',
          ...patch,
        });
      }
      await loadAttendance();
    } catch (e) {
      console.error('출결 저장 실패', e);
      alert(t('Failed to save attendance', '출결 저장에 실패했습니다'));
    } finally {
      setSavingId(null);
    }
  };

  // [출근] 현재 시각을 clock_in 으로 기록
  const handleClockIn = (emp: Employee) =>
    upsert(emp, { clock_in: nowHHMM(), is_absent: false });

  // [퇴근] 현재 시각을 clock_out 으로 기록
  const handleClockOut = (emp: Employee) =>
    upsert(emp, { clock_out: nowHHMM(), is_absent: false });

  // [결근] 토글
  const handleToggleAbsent = (emp: Employee) => {
    const existing = logByEmp.get(emp.id);
    const nextAbsent = !(existing?.is_absent);
    upsert(emp, { is_absent: nextAbsent });
  };

  // ============================================================
  // 📌 함수: autoExport
  // 📋 목적: 현재 출결 데이터를 Drive elspa/출결 폴더에 자동 저장
  //         1시간마다 setInterval 로 호출됨
  // 📅 작성일: 2026-06-02
  // ============================================================
  const autoExport = useCallback(async () => {
    // 직원 목록이 없으면 저장 불필요
    if (!employees || employees.length === 0) return;

    // 헤더 행 정의
    const header = ['직원명', '직군', '출근', '퇴근', '상태', '날짜'];

    // 직원별 데이터 행 생성
    const dataRows = employees.map((emp) => {
      const log = logByEmp.get(emp.id);
      const clockIn = log?.clock_in ?? '';
      const clockOut = log?.clock_out ?? '';
      const status = log?.is_absent ? '결근' : log?.clock_in ? '출근' : '미출근';
      return [emp.name, emp.employee_type, clockIn, clockOut, status, workDate];
    });

    try {
      const res = await fetch(`/api/booking/drive/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: '출결',
          title_prefix: workDate,
          rows: [header, ...dataRows],
        }),
      });

      // 401 인증 오류는 조용히 무시
      if (res.status === 401) return;

      if (res.ok) {
        // 성공 시 현재 시각 HH:MM 저장
        const d = window.Date ? window.Date : Date;
        const timeStr = new d().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
        setLastAutoSave(timeStr);
      }
    } catch {
      // 네트워크 오류 등 — 조용히 무시
    }
  }, [employees, logByEmp, workDate]);

  // 설정에 따라 자동 저장 인터벌 설정 (꺼져 있으면 등록 안 함)
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const id = setInterval(autoExport, autoSaveIntervalMs);
    return () => clearInterval(id);
  }, [autoExport, autoSaveEnabled, autoSaveIntervalMs]);

  // 직군 필터 버튼 라벨
  const typeLabel = (ty: Employee['employee_type']): string => {
    switch (ty) {
      case 'therapist': return t('Therapist', '테라피스트');
      case 'driver': return t('Driver', '드라이버');
      case 'manager': return t('Manager', '매니저');
      case 'nail': return t('Nail', '네일');
      case 'maintenance': return t('Maintenance', '시설');
      case 'hollys': return t('Hollys', '홀리스');
    }
  };

  // 상태 배지
  const StatusBadge = ({ s }: { s: ReturnType<typeof statusOf> }) => {
    const cfg = {
      absent: { cls: 'bg-red-100 text-red-700', label: `❌ ${t('Absent', '결근')}` },
      out: { cls: 'bg-gray-200 text-gray-700', label: `🏁 ${t('Clocked Out', '퇴근')}` },
      in: { cls: 'bg-green-100 text-green-700', label: `✅ ${t('Clocked In', '출근')}` },
      none: { cls: 'bg-yellow-100 text-yellow-700', label: `⏳ ${t('Not In', '미출근')}` },
    }[s];
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${cfg.cls}`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="h-full overflow-auto bg-white p-6">
      {/* 상단: 날짜 + 요약 */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-700">{t('Date', '날짜')}</label>
          <input
            type="date"
            value={workDate}
            onChange={(e) => setWorkDate(e.target.value)}
            className="px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-sm font-medium"
          />
          {loading && <span className="text-sm text-gray-400">{t('Loading…', '불러오는 중…')}</span>}
          {!isOnline() && <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">📴 오프라인 — 로컬 데이터</span>}
          {/* 자동 저장 마지막 시각 표시 — 저장된 적 있을 때만 노출 */}
          {lastAutoSave && (
            <span className="text-xs text-gray-400">
              {t('Auto saved', '자동저장')} {lastAutoSave}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <div className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 text-sm font-bold">
            {t('Total', '전체')} {summary.total}
          </div>
          <div className="px-4 py-2 rounded-lg bg-green-100 text-green-700 text-sm font-bold">
            {t('Present', '출근')} {summary.present}
          </div>
          <div className="px-4 py-2 rounded-lg bg-yellow-100 text-yellow-700 text-sm font-bold">
            {t('Not In', '미출근')} {summary.notIn}
          </div>
          <div className="px-4 py-2 rounded-lg bg-red-100 text-red-700 text-sm font-bold">
            {t('Absent', '결근')} {summary.absent}
          </div>
        </div>
      </div>

      {/* 직군 필터 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setTypeFilter('all')}
          className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
            typeFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
          }`}
        >
          {t('All', '전체')}
        </button>
        {TYPE_ORDER.map((ty) => (
          <button
            key={ty}
            onClick={() => setTypeFilter(ty)}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${
              typeFilter === ty ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            {TYPE_EMOJI[ty]} {typeLabel(ty)}
          </button>
        ))}
      </div>

      {/* 직원별 출결 테이블 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left text-sm font-bold text-gray-700">{t('Employee', '직원')}</th>
              <th className="px-5 py-3 text-center text-sm font-bold text-gray-700">{t('Clock In', '출근')}</th>
              <th className="px-5 py-3 text-center text-sm font-bold text-gray-700">{t('Clock Out', '퇴근')}</th>
              <th className="px-5 py-3 text-center text-sm font-bold text-gray-700">{t('Status', '상태')}</th>
              <th className="px-5 py-3 text-center text-sm font-bold text-gray-700">{t('Actions', '동작')}</th>
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-400 text-sm">
                  {t('No employees', '직원이 없습니다')}
                </td>
              </tr>
            ) : (
              visibleEmployees.map((emp) => {
                const log = logByEmp.get(emp.id);
                const s = statusOf(log);
                const busy = savingId === emp.id;
                return (
                  <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* 직군 이모지 + 이름 */}
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">
                      <span className="mr-2">{TYPE_EMOJI[emp.employee_type]}</span>
                      {emp.name}
                    </td>
                    {/* 출근 시각 */}
                    <td className="px-5 py-3 text-center text-sm text-gray-700">
                      {log?.is_absent ? '-' : (log?.clock_in || '—')}
                    </td>
                    {/* 퇴근 시각 */}
                    <td className="px-5 py-3 text-center text-sm text-gray-700">
                      {log?.is_absent ? '-' : (log?.clock_out || '—')}
                    </td>
                    {/* 상태 */}
                    <td className="px-5 py-3 text-center">
                      <StatusBadge s={s} />
                    </td>
                    {/* 동작 버튼 */}
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleClockIn(emp)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white transition"
                        >
                          {t('Clock In', '출근')}
                        </button>
                        <button
                          onClick={() => handleClockOut(emp)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 text-white transition"
                        >
                          {t('Clock Out', '퇴근')}
                        </button>
                        <button
                          onClick={() => handleToggleAbsent(emp)}
                          disabled={busy}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition disabled:bg-gray-300 disabled:text-white ${
                            log?.is_absent
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-100 hover:bg-red-200 text-red-700'
                          }`}
                        >
                          {t('Absent', '결근')}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
