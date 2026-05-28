'use client';

import React, { useState } from 'react';
import { therapyBeds, BedGroup } from '../mockData/bookingData';
import { Plus, Trash2, Edit2, Save, Copy, AlertCircle } from 'lucide-react';
import { splitBedGroup, validateSplitCount } from '@/lib/services/bed-split-service';

/**
 * 📌 컴포넌트: BedGroupingSettings
 * 📋 목적: 마사지 침대를 그룹으로 분리 및 합칠 수 있도록 관리
 * 🎨 기능: 그룹 생성, 수정, 삭제 및 침대 할당
 * 📅 작성일: 2026-05-28
 */

export default function BedGroupingSettings() {
  const [groups, setGroups] = useState<BedGroup[]>([
    {
      id: 'group-001',
      name: '마사지실1 - Group A',
      description: '마사지실1의 A-1~A-15',
      bedIds: ['BED-001', 'BED-002', 'BED-003', 'BED-004', 'BED-005', 'BED-006', 'BED-007', 'BED-008', 'BED-009', 'BED-010', 'BED-011', 'BED-012', 'BED-013', 'BED-014', 'BED-015'],
      createdAt: '2026-05-28T00:00:00Z',
      updatedAt: '2026-05-28T00:00:00Z',
    },
    {
      id: 'group-002',
      name: '마사지실1 - Group B',
      description: '마사지실1의 A-16~A-30',
      bedIds: ['BED-016', 'BED-017', 'BED-018', 'BED-019', 'BED-020', 'BED-021', 'BED-022', 'BED-023', 'BED-024', 'BED-025', 'BED-026', 'BED-027', 'BED-028', 'BED-029', 'BED-030'],
      createdAt: '2026-05-28T00:00:00Z',
      updatedAt: '2026-05-28T00:00:00Z',
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedBedIds, setSelectedBedIds] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [splittingGroupId, setSplittingGroupId] = useState<string | null>(null);
  const [splitCount, setSplitCount] = useState<number>(2);
  const [splitPreview, setSplitPreview] = useState<BedGroup[]>([]);
  const [splitError, setSplitError] = useState<string | null>(null);
  const [isSplitting, setIsSplitting] = useState(false);

  const handleAddGroup = () => {
    if (newGroupName.trim() && selectedBedIds.length > 0) {
      const newGroup: BedGroup = {
        id: `group-${Date.now()}`,
        name: newGroupName,
        description: newGroupDesc,
        bedIds: selectedBedIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setGroups([...groups, newGroup]);
      setNewGroupName('');
      setNewGroupDesc('');
      setSelectedBedIds([]);
      setShowForm(false);
    }
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
  };

  const handleEditGroup = (group: BedGroup) => {
    setEditingId(group.id);
    setNewGroupName(group.name);
    setNewGroupDesc(group.description || '');
    setSelectedBedIds(group.bedIds);
  };

  const handleSaveEdit = (id: string) => {
    setGroups(groups.map(g =>
      g.id === id
        ? {
            ...g,
            name: newGroupName,
            description: newGroupDesc,
            bedIds: selectedBedIds,
            updatedAt: new Date().toISOString(),
          }
        : g
    ));
    setEditingId(null);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedBedIds([]);
  };

  const handleBedSelect = (bedId: string) => {
    setSelectedBedIds(prev =>
      prev.includes(bedId)
        ? prev.filter(id => id !== bedId)
        : [...prev, bedId]
    );
  };

  // ============================================================
  // 📌 함수명: generateSplitPreview
  // 📋 목적: 그룹 분할 미리보기 생성
  // 🔧 매개변수: groupId (string), count (number)
  // 📤 반환값: BedGroup[] - 분할된 그룹 배열
  // 📅 작성일: 2026-05-28
  // ============================================================
  const generateSplitPreview = (groupId: string, count: number) => {
    const group = groups.find(g => g.id === groupId);
    if (!group || count < 2) return [];

    const bedIds = group.bedIds;
    const bedsPerGroup = Math.ceil(bedIds.length / count);
    const preview: BedGroup[] = [];

    for (let i = 0; i < count; i++) {
      const start = i * bedsPerGroup;
      const end = Math.min(start + bedsPerGroup, bedIds.length);
      const newBedIds = bedIds.slice(start, end);

      preview.push({
        id: `${group.id}-split-${i}`,
        name: `${group.name} - Part ${i + 1}`,
        description: `${group.description} (분할 파트 ${i + 1})`,
        bedIds: newBedIds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return preview;
  };

  // ============================================================
  // 📌 함수명: handleSplitGroup
  // 📋 목적: 그룹 분할 확인 및 미리보기 표시
  // 🔧 매개변수: groupId (string)
  // 📤 반환값: void
  // 📅 작성일: 2026-05-28
  // ============================================================
  const handleSplitGroup = (groupId: string) => {
    setSplittingGroupId(groupId);
    setSplitCount(2);
    const preview = generateSplitPreview(groupId, 2);
    setSplitPreview(preview);
  };

  // ============================================================
  // 📌 함수명: handleSplitCountChange
  // 📋 목적: 분할 수 변경 시 미리보기 업데이트
  // 🔧 매개변수: count (number)
  // 📤 반환값: void
  // 📅 작성일: 2026-05-28
  // ============================================================
  const handleSplitCountChange = (count: number) => {
    if (count < 2 || !splittingGroupId) return;
    setSplitCount(count);
    const preview = generateSplitPreview(splittingGroupId, count);
    setSplitPreview(preview);
  };

  // ============================================================
  // 📌 함수명: handleConfirmSplit
  // 📋 목적: 그룹 분할 저장 (기존 그룹 제거 + 새 그룹 추가 + API 호출)
  // 🔧 매개변수: groupId (string)
  // 📤 반환값: void
  // 📅 작성일: 2026-05-28
  // ============================================================
  const handleConfirmSplit = async (groupId: string) => {
    // 유효성 검사
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const validation = validateSplitCount(splitCount, group.bedIds.length);
    if (!validation.valid) {
      setSplitError(validation.error || '유효하지 않은 분할 수입니다.');
      return;
    }

    setIsSplitting(true);
    setSplitError(null);

    try {
      // API 호출
      const result = await splitBedGroup(
        groupId,
        splitCount,
        splitPreview.map(g => ({
          name: g.name,
          description: g.description || '',
          bedIds: g.bedIds,
        }))
      );

      if (!result.success) {
        setSplitError(result.error || '그룹 분할에 실패했습니다.');
        return;
      }

      // 로컬 상태 업데이트
      const newGroups = groups.filter(g => g.id !== groupId);

      // 분할된 그룹 추가 (실제 ID 재생성)
      const splitGroups = splitPreview.map(group => ({
        ...group,
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      }));

      setGroups([...newGroups, ...splitGroups]);
      setSplittingGroupId(null);
      setSplitCount(2);
      setSplitPreview([]);
    } catch (error) {
      setSplitError(
        error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
      );
    } finally {
      setIsSplitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-white">🛏️ 침대 그룹 설정</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <Plus size={20} />
          새 그룹 추가
        </button>
      </div>

      {/* 새 그룹 추가 폼 */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-white mb-2">그룹명</label>
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="예: 마사지실1 - Group A"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-2">설명</label>
            <input
              type="text"
              value={newGroupDesc}
              onChange={e => setNewGroupDesc(e.target.value)}
              placeholder="예: 마사지실1의 A-1~A-15"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-white mb-3">침대 선택</label>
            <div className="grid grid-cols-10 gap-2 max-h-48 overflow-y-auto bg-slate-800 p-4 rounded-lg">
              {therapyBeds.map(bed => (
                <button
                  key={bed.id}
                  onClick={() => handleBedSelect(bed.id)}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    selectedBedIds.includes(bed.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {bed.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">선택된 침대: {selectedBedIds.length}개</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddGroup}
              disabled={!newGroupName.trim() || selectedBedIds.length === 0}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg font-bold transition"
            >
              그룹 생성
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 그룹 목록 */}
      <div className="space-y-3">
        {groups.map(group => (
          <div key={group.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            {editingId === group.id ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                />
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                />
                <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto bg-slate-800 p-3 rounded">
                  {therapyBeds.map(bed => (
                    <button
                      key={bed.id}
                      onClick={() => handleBedSelect(bed.id)}
                      className={`px-2 py-1 rounded text-xs font-bold transition ${
                        selectedBedIds.includes(bed.id)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {bed.name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveEdit(group.id)}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-bold transition"
                  >
                    <Save size={16} />
                    저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-bold transition"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{group.name}</h3>
                    <p className="text-sm text-gray-400">{group.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      침대: {group.bedIds.map(id => {
                        const bed = therapyBeds.find(b => b.id === id);
                        return bed?.name;
                      }).join(', ')} ({group.bedIds.length}개)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSplitGroup(group.id)}
                      className="flex items-center gap-2 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition"
                      title="그룹 분할하기"
                    >
                      <Copy size={16} />
                      분할
                    </button>
                    <button
                      onClick={() => handleEditGroup(group)}
                      className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 그룹 분할 UI */}
                {splittingGroupId === group.id && (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 space-y-4">
                    <h4 className="text-sm font-bold text-white">
                      🔀 '{group.name}' 분할하기
                    </h4>

                    {/* 분할 수 선택 */}
                    <div>
                      <label className="block text-xs font-bold text-gray-300 mb-2">
                        분할할 그룹 수 선택 (현재: {group.bedIds.length}개 침대)
                      </label>
                      <div className="flex gap-2">
                        {[2, 3, 4, 5].map(num => (
                          <button
                            key={num}
                            onClick={() => handleSplitCountChange(num)}
                            className={`px-3 py-1 rounded text-sm font-bold transition ${
                              splitCount === num
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                            }`}
                          >
                            {num}개로 분할
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 분할 미리보기 */}
                    {splitPreview.length > 0 && (
                      <div>
                        <label className="block text-xs font-bold text-gray-300 mb-2">
                          📊 분할 미리보기
                        </label>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {splitPreview.map((previewGroup, idx) => (
                            <div
                              key={idx}
                              className="bg-slate-700 rounded p-2 text-xs text-gray-300"
                            >
                              <p className="font-bold text-white">
                                {previewGroup.name}
                              </p>
                              <p className="text-gray-400">
                                {previewGroup.bedIds.length}개 침대
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 확인/취소 버튼 */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirmSplit(group.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-bold transition"
                      >
                        ✅ 분할 저장
                      </button>
                      <button
                        onClick={() => setSplittingGroupId(null)}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-bold transition"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
