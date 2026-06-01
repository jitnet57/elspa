'use client';

/**
 * ============================================================
 * 📌 급여 설정 (Payroll Settings)
 * 📋 야근수당 시급 / 지각 차감 분당단가 / 공휴일(국가·일반) 배율 등록
 * 💾 localStorage 저장 → 급여정산(records) 계산 루틴에 반영
 * 📅 작성일: 2026-06-01
 * ============================================================
 */

import { useEffect, useState } from 'react';
import {
  getPayrollSettings,
  savePayrollSettings,
  DEFAULT_PAYROLL_SETTINGS,
  type PayrollSettings,
} from '@/lib/payroll-settings';

export default function PayrollSettingsPage() {
  const [s, setS] = useState<PayrollSettings>(DEFAULT_PAYROLL_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setS(getPayrollSettings());
  }, []);

  const num = (v: string) => (v === '' ? 0 : Number(v));
  const update = (patch: Partial<PayrollSettings>) => {
    setS((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  };
  const handleSave = () => {
    savePayrollSettings(s);
    setSaved(true);
  };
  const reset = () => {
    setS(DEFAULT_PAYROLL_SETTINGS);
    setSaved(false);
  };

  const Field = ({
    label,
    desc,
    value,
    suffix,
    onChange,
    step,
  }: {
    label: string;
    desc: string;
    value: number;
    suffix: string;
    onChange: (v: number) => void;
    step?: string;
  }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <label className="block font-bold text-gray-800">{label}</label>
      <p className="text-xs text-gray-500 mb-2">{desc}</p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          step={step || '1'}
          value={value}
          onChange={(e) => onChange(num(e.target.value))}
          className="w-40 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-right font-bold"
        />
        <span className="text-sm text-gray-600">{suffix}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 px-4 py-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">⚙️ 급여 설정</h1>
        <p className="text-gray-600 mt-1 text-sm">야근·지각·공휴일 단가/배율을 등록하면 급여정산에 자동 반영됩니다.</p>
      </div>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-4">
        <Field
          label="🌙 야근수당 시급"
          desc="야근수당 = (야근분 ÷ 60) × 시급"
          value={s.overtimeHourlyRate}
          suffix="₱ / 시간"
          onChange={(v) => update({ overtimeHourlyRate: v })}
        />
        <Field
          label="🌙 야근 인정 최소 분"
          desc="야근이 이 분 이상일 때만 야근수당 지급 (예: 40분 미만은 미인정)"
          value={s.overtimeMinThreshold}
          suffix="분 이상"
          onChange={(v) => update({ overtimeMinThreshold: v })}
        />
        <Field
          label="⏰ 지각 유예 (분)"
          desc="이 분까지는 지각 차감 없음 (유예 초과분부터 차감)"
          value={s.lateGraceMinutes}
          suffix="분 유예"
          onChange={(v) => update({ lateGraceMinutes: v })}
        />
        <Field
          label="⏰ 지각 차감 (분당)"
          desc="지각 차감 = (지각분 − 유예분) × 분당 단가"
          value={s.latePerMinute}
          suffix="₱ / 분"
          onChange={(v) => update({ latePerMinute: v })}
        />
        <Field
          label="🇵🇭 국가 공휴일 배율"
          desc="국가 공휴일 근무 시 일급 × 배율 (예: 2.0 = 2배). 가산액 = 일급 × (배율−1)"
          value={s.nationalHolidayMultiplier}
          suffix="× 배"
          step="0.05"
          onChange={(v) => update({ nationalHolidayMultiplier: v })}
        />
        <Field
          label="🎌 일반(특별) 공휴일 배율"
          desc="특별 공휴일 근무 시 일급 × 배율 (예: 1.3). 가산액 = 일급 × (배율−1)"
          value={s.specialHolidayMultiplier}
          suffix="× 배"
          step="0.05"
          onChange={(v) => update({ specialHolidayMultiplier: v })}
        />

        <div className="flex gap-3 pt-2">
          <button onClick={reset} className="px-5 py-3 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-800">
            기본값
          </button>
          <button onClick={handleSave} className="flex-1 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
            저장
          </button>
        </div>
        {saved && <p className="text-center text-green-600 font-bold">✅ 저장됨 — 급여정산에 반영됩니다.</p>}

        <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-sm text-indigo-800">
          <p className="font-bold mb-1">계산 루틴</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>야근수당 = 야근시간 × 야근시급</li>
            <li>지각차감 = 지각분 × 분당단가</li>
            <li>공휴일 가산 = 일급 × (배율−1) × 공휴일 근무일수 (국가/일반 각각)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
