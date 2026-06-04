'use client';

import React, { useState } from 'react';
import { Save, Download, Printer } from 'lucide-react';

interface TreatmentRecord {
  treatment: string;
  startTime: string;
  endTime: string;
  room: string;
  clientName: string;
  notes: string;
  payment: string;
  tip: string;
}

interface TimeSlotRecord {
  slotNumber: number;
  name: string;
  duty: TreatmentRecord;
  firstTreatment: TreatmentRecord;
  secondTreatment: TreatmentRecord;
}

export default function MassageScheduleTable() {
  const [schedule, setSchedule] = useState<TimeSlotRecord[]>(
    Array.from({ length: 30 }, (_, idx) => ({
      slotNumber: idx + 1,
      name: '',
      duty: {
        treatment: '',
        startTime: '',
        endTime: '',
        room: '',
        clientName: '',
        notes: '',
        payment: '',
        tip: '',
      },
      firstTreatment: {
        treatment: '',
        startTime: '',
        endTime: '',
        room: '',
        clientName: '',
        notes: '',
        payment: '',
        tip: '',
      },
      secondTreatment: {
        treatment: '',
        startTime: '',
        endTime: '',
        room: '',
        clientName: '',
        notes: '',
        payment: '',
        tip: '',
      },
    }))
  );

  const updateField = (slotIdx: number, section: string, field: string, value: string) => {
    const newSchedule = [...schedule];
    if (section === 'name') {
      newSchedule[slotIdx].name = value;
    } else {
      (newSchedule[slotIdx][section as keyof TimeSlotRecord] as any)[field] = value;
    }
    setSchedule(newSchedule);
  };

  const handleSave = () => {
    console.log('Saving schedule...', schedule);
    alert('일정이 저장되었습니다!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const csv = generateCSV();
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', 'massage-schedule.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const generateCSV = () => {
    let csv = '시간,9-5PM DUTY (시술),9-5PM DUTY (시작),9-5PM DUTY (종료),9-5PM DUTY (방),9-5PM DUTY (고객명),1ST TREATMENT (시술),1ST TREATMENT (시작),1ST TREATMENT (종료),1ST TREATMENT (방),1ST TREATMENT (고객명),2ND TREATMENT (시술),2ND TREATMENT (시작),2ND TREATMENT (종료),2ND TREATMENT (방),2ND TREATMENT (고객명)\n';
    schedule.forEach((slot) => {
      csv += `${slot.slotNumber},${slot.duty.treatment},${slot.duty.startTime},${slot.duty.endTime},${slot.duty.room},${slot.duty.clientName},${slot.firstTreatment.treatment},${slot.firstTreatment.startTime},${slot.firstTreatment.endTime},${slot.firstTreatment.room},${slot.firstTreatment.clientName},${slot.secondTreatment.treatment},${slot.secondTreatment.startTime},${slot.secondTreatment.endTime},${slot.secondTreatment.room},${slot.secondTreatment.clientName}\n`;
    });
    return csv;
  };

  return (
    <div className="min-h-screen bg-surface pb-8">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-14 bg-white border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-primary">ElSpa Daily Schedule</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg hover:opacity-90 transition font-bold"
          >
            <Save size={18} />
            Save
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition"
          >
            <Printer size={18} />
            Print
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container transition"
          >
            <Download size={18} />
            CSV
          </button>
        </div>
      </header>

      <main className="pt-20 px-4">
        {/* Table Container */}
        <div className="overflow-x-auto bg-white border border-outline-variant rounded-2xl">
          <table className="w-full border-collapse text-sm">
            {/* Header */}
            <thead className="bg-surface-container border-b-2 border-outline-variant">
              <tr>
                {/* Time Column */}
                <th className="p-2 border border-outline-variant bg-surface-container-high font-bold text-on-surface min-w-[60px]">
                  시간
                </th>

                {/* 9-5PM DUTY Section */}
                <th colSpan={8} className="p-2 border border-outline-variant font-bold text-on-surface text-center bg-blue-100">
                  9-5PM DUTY
                </th>

                {/* 1ST TREATMENT Section */}
                <th colSpan={8} className="p-2 border border-outline-variant font-bold text-on-surface text-center bg-purple-100">
                  1ST TREATMENT
                </th>

                {/* 2ND TREATMENT Section */}
                <th colSpan={8} className="p-2 border border-outline-variant font-bold text-on-surface text-center bg-pink-100">
                  2ND TREATMENT
                </th>
              </tr>

              {/* Sub-headers */}
              <tr className="bg-surface-container">
                <th className="p-1 border border-outline-variant text-xs font-bold">시간</th>

                {/* 9-5PM DUTY Sub-headers */}
                <th className="p-1 border border-outline-variant text-xs font-bold">시술</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">시작</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">종료</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">방</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">고객명</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">비고</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">결제</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">팁</th>

                {/* 1ST TREATMENT Sub-headers */}
                <th className="p-1 border border-outline-variant text-xs font-bold">시술</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">시작</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">종료</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">방</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">고객명</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">비고</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">결제</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">팁</th>

                {/* 2ND TREATMENT Sub-headers */}
                <th className="p-1 border border-outline-variant text-xs font-bold">시술</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">시작</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">종료</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">방</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">고객명</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">비고</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">결제</th>
                <th className="p-1 border border-outline-variant text-xs font-bold">팁</th>
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {schedule.map((slot, idx) => (
                <tr key={slot.slotNumber} className={idx % 2 === 0 ? 'bg-white' : 'bg-surface'}>
                  {/* Time Slot Number */}
                  <td className="p-1 border border-outline-variant font-bold text-center bg-surface-container-high">
                    {slot.slotNumber}
                  </td>

                  {/* 9-5PM DUTY */}
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.duty.treatment}
                      onChange={(e) => updateField(idx, 'duty', 'treatment', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="시술"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="time"
                      value={slot.duty.startTime}
                      onChange={(e) => updateField(idx, 'duty', 'startTime', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="time"
                      value={slot.duty.endTime}
                      onChange={(e) => updateField(idx, 'duty', 'endTime', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.duty.room}
                      onChange={(e) => updateField(idx, 'duty', 'room', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="방"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.duty.clientName}
                      onChange={(e) => updateField(idx, 'duty', 'clientName', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="고객명"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.duty.notes}
                      onChange={(e) => updateField(idx, 'duty', 'notes', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="비고"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.duty.payment}
                      onChange={(e) => updateField(idx, 'duty', 'payment', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="결제"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.duty.tip}
                      onChange={(e) => updateField(idx, 'duty', 'tip', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="팁"
                    />
                  </td>

                  {/* 1ST TREATMENT */}
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.firstTreatment.treatment}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'treatment', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="시술"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="time"
                      value={slot.firstTreatment.startTime}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'startTime', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="time"
                      value={slot.firstTreatment.endTime}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'endTime', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.firstTreatment.room}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'room', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="방"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.firstTreatment.clientName}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'clientName', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="고객명"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.firstTreatment.notes}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'notes', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="비고"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.firstTreatment.payment}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'payment', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="결제"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.firstTreatment.tip}
                      onChange={(e) => updateField(idx, 'firstTreatment', 'tip', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="팁"
                    />
                  </td>

                  {/* 2ND TREATMENT */}
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.secondTreatment.treatment}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'treatment', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="시술"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="time"
                      value={slot.secondTreatment.startTime}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'startTime', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="time"
                      value={slot.secondTreatment.endTime}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'endTime', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.secondTreatment.room}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'room', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="방"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.secondTreatment.clientName}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'clientName', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="고객명"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.secondTreatment.notes}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'notes', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="비고"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.secondTreatment.payment}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'payment', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="결제"
                    />
                  </td>
                  <td className="p-1 border border-outline-variant">
                    <input
                      type="text"
                      value={slot.secondTreatment.tip}
                      onChange={(e) => updateField(idx, 'secondTreatment', 'tip', e.target.value)}
                      className="w-full px-1 py-0.5 text-xs border-0 focus:ring-1 focus:ring-primary"
                      placeholder="팁"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
