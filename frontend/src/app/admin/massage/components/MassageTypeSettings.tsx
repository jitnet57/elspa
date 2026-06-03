'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, AlertCircle } from 'lucide-react';
import { massageTypesApi, MassageType as ApiMassageType } from '@/lib/api/massage-types-client';

/**
 * 📌 컴포넌트: MassageTypeSettings
 * 📋 목적: 마사지 종류 관리 (추가, 수정, 삭제)
 * 🎨 기능: 마사지 종류별 가격, 시간, 설명 관리
 * 📅 작성일: 2026-05-28
 */

interface MassageType {
  id: number;
  name: string;
  basePrice: number;
  baseDurationMinutes: number;
  description: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================
// 기본 마사지 종류 데이터
// ============================================================
const DEFAULT_MASSAGE_TYPES: MassageType[] = [
  {
    id: 1,
    name: 'Swedish',
    basePrice: 60000,
    baseDurationMinutes: 60,
    description: '근육 이완과 혈액 순환을 촉진하는 고전적인 유럽식 마사지',
    isActive: true,
    createdAt: '2026-05-28T00:00:00Z',
  },
  {
    id: 2,
    name: 'Thai',
    basePrice: 70000,
    baseDurationMinutes: 90,
    description: '몸의 에너지 경로를 자극하여 유연성과 균형을 회복하는 태국 전통 마사지',
    isActive: true,
    createdAt: '2026-05-28T00:00:00Z',
  },
  {
    id: 3,
    name: 'Hot Stone',
    basePrice: 80000,
    baseDurationMinutes: 60,
    description: '따뜻한 돌을 이용하여 근육을 이완시키고 스트레스를 완화하는 마사지',
    isActive: true,
    createdAt: '2026-05-28T00:00:00Z',
  },
  {
    id: 4,
    name: 'Deep Tissue',
    basePrice: 75000,
    baseDurationMinutes: 60,
    description: '깊은 근육층을 집중적으로 자극하여 만성 근육통을 완화하는 마사지',
    isActive: true,
    createdAt: '2026-05-28T00:00:00Z',
  },
  {
    id: 5,
    name: 'Aroma',
    basePrice: 65000,
    baseDurationMinutes: 60,
    description: '에센셜 오일을 사용하여 심신을 이완시키는 향기 마사지',
    isActive: true,
    createdAt: '2026-05-28T00:00:00Z',
  },
  {
    id: 6,
    name: 'Facial',
    basePrice: 55000,
    baseDurationMinutes: 45,
    description: '얼굴과 목, 어깨의 피부 건강과 긴장을 해소하는 페이셜 마사지',
    isActive: true,
    createdAt: '2026-05-28T00:00:00Z',
  },
];

export default function MassageTypeSettings() {
  const [massageTypes, setMassageTypes] = useState<MassageType[]>(DEFAULT_MASSAGE_TYPES);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 폼 입력 상태
  const [formData, setFormData] = useState({
    name: '',
    basePrice: 0,
    baseDurationMinutes: 30,
    description: '',
  });

  // API에서 마사지 종류 로드
  useEffect(() => {
    const loadMassageTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await massageTypesApi.list(false); // 모든 타입 로드
        setMassageTypes(data);
      } catch (err) {
        console.error('마사지 종류 로드 실패:', err);
        setError('마사지 종류를 로드할 수 없습니다. 기본 데이터를 사용합니다.');
        // 폴백: 기본 데이터 사용
        setMassageTypes(DEFAULT_MASSAGE_TYPES);
      } finally {
        setLoading(false);
      }
    };
    loadMassageTypes();
  }, []);

  // ============================================================
  // 새 마사지 종류 추가
  // ============================================================
  const handleAddMassageType = async () => {
    if (!formData.name.trim() || formData.basePrice <= 0 || formData.baseDurationMinutes <= 0) {
      setError('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await massageTypesApi.create({
        name: formData.name,
        basePrice: formData.basePrice,
        baseDurationMinutes: formData.baseDurationMinutes,
        description: formData.description,
        isActive: true,
      });

      setMassageTypes([...massageTypes, response]);
      setFormData({ name: '', basePrice: 0, baseDurationMinutes: 30, description: '' });
      setShowForm(false);
    } catch (error) {
      console.error('마사지 종류 추가 실패:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 마사지 종류 수정
  // ============================================================
  const handleEditMassageType = async () => {
    if (!formData.name.trim() || formData.basePrice <= 0 || formData.baseDurationMinutes <= 0) {
      setError('모든 필드를 올바르게 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await massageTypesApi.update(editingId!, {
        name: formData.name,
        basePrice: formData.basePrice,
        baseDurationMinutes: formData.baseDurationMinutes,
        description: formData.description,
      });

      setMassageTypes(
        massageTypes.map(m => (m.id === editingId ? response : m))
      );
      handleCancelEdit();
    } catch (error) {
      console.error('마사지 종류 수정 실패:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 마사지 종류 삭제
  // ============================================================
  const handleDeleteMassageType = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await massageTypesApi.delete(id, false); // soft delete
      setMassageTypes(massageTypes.filter(m => m.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('마사지 종류 삭제 실패:', error);
      setError(String(error));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // 편집 모드 시작
  // ============================================================
  const handleEditStart = (massageType: MassageType) => {
    setEditingId(massageType.id);
    setFormData({
      name: massageType.name,
      basePrice: massageType.basePrice,
      baseDurationMinutes: massageType.baseDurationMinutes,
      description: massageType.description,
    });
    setShowForm(false);
  };

  // ============================================================
  // 편집 취소
  // ============================================================
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: '', basePrice: 0, baseDurationMinutes: 30, description: '' });
  };

  // ============================================================
  // 새 항목 추가 폼 열기
  // ============================================================
  const handleShowAddForm = () => {
    setEditingId(null);
    setFormData({ name: '', basePrice: 0, baseDurationMinutes: 30, description: '' });
    setShowForm(true);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 overflow-hidden">
      {/* 헤더 */}
      <div className="px-6 py-4 border-b border-slate-700 bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">💆 마사지 종류 관리</h2>
            <p className="text-sm text-gray-400 mt-1">마사지 종류별 가격, 시간, 설명을 관리합니다</p>
          </div>
          {!editingId && (
            <button
              onClick={handleShowAddForm}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-semibold transition"
            >
              <Plus size={18} />
              새 마사지 종류 추가
            </button>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="px-6 py-3 bg-red-900 border-b border-red-700 flex items-center gap-2 text-red-100">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-300 hover:text-red-100"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 내용 */}
      <div className="flex-1 overflow-auto">
        {/* 추가/편집 폼 */}
        {(showForm || editingId) && (
          <div className="p-6 border-b border-slate-700 bg-slate-900">
            <div className="bg-slate-800 rounded-lg p-6 max-w-2xl">
              <h3 className="text-lg font-bold text-white mb-4">
                {editingId ? '✏️ 마사지 종류 수정' : '➕ 새 마사지 종류 추가'}
              </h3>

              <div className="space-y-4">
                {/* 마사지 종류 이름 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    마사지 종류 이름 *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="예: Swedish, Thai, Hot Stone"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    disabled={loading}
                  />
                </div>

                {/* 기본 가격 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      기본 가격 (원) *
                    </label>
                    <input
                      type="number"
                      value={formData.basePrice}
                      onChange={e => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                      placeholder="60000"
                      min="0"
                      step="1000"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                      disabled={loading}
                    />
                  </div>

                  {/* 기본 시간 */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      기본 시간 (분) *
                    </label>
                    <input
                      type="number"
                      value={formData.baseDurationMinutes}
                      onChange={e =>
                        setFormData({ ...formData, baseDurationMinutes: Number(e.target.value) })
                      }
                      placeholder="60"
                      min="15"
                      step="15"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* 설명 */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    설명
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="마사지 종류에 대한 상세 설명을 입력해주세요"
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
                    disabled={loading}
                  />
                </div>

                {/* 버튼 */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={editingId ? handleEditMassageType : handleAddMassageType}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold transition"
                  >
                    <Save size={16} />
                    {editingId ? '수정 완료' : '추가'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 font-semibold transition"
                  >
                    <X size={16} />
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 마사지 종류 테이블 */}
        <div className="p-6">
          {massageTypes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={48} className="text-gray-400 mb-4" />
              <p className="text-gray-400 text-lg">등록된 마사지 종류가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800">
                    <th className="text-left px-4 py-3 font-semibold text-gray-300 w-32">이름</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-300 w-32">기본 가격</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-300 w-32">기본 시간</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-300 flex-1">설명</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-300 w-40">상태</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-300 w-32">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {massageTypes.map(massageType => (
                    <tr
                      key={massageType.id}
                      className="border-b border-slate-700 hover:bg-slate-800 transition"
                    >
                      {/* 이름 */}
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold">{massageType.name}</div>
                      </td>

                      {/* 기본 가격 */}
                      <td className="px-4 py-3">
                        <div className="text-green-400 font-semibold">
                          {massageType.basePrice.toLocaleString()}원
                        </div>
                      </td>

                      {/* 기본 시간 */}
                      <td className="px-4 py-3">
                        <div className="text-blue-400 font-semibold">
                          {massageType.baseDurationMinutes}분
                        </div>
                      </td>

                      {/* 설명 */}
                      <td className="px-4 py-3">
                        <div className="text-gray-300 text-sm line-clamp-2">
                          {massageType.description || '-'}
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                            massageType.isActive
                              ? 'bg-green-900 text-green-200'
                              : 'bg-red-900 text-red-200'
                          }`}
                        >
                          {massageType.isActive ? '✅ 활성' : '❌ 비활성'}
                        </span>
                      </td>

                      {/* 작업 버튼 */}
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleEditStart(massageType)}
                            disabled={loading || editingId !== null}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold transition"
                          >
                            <Edit2 size={14} />
                            편집
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(massageType.id)}
                            disabled={loading || editingId !== null}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-semibold transition"
                          >
                            <Trash2 size={14} />
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle size={24} className="text-red-500" />
              <h3 className="text-lg font-bold text-white">삭제 확인</h3>
            </div>
            <p className="text-gray-300 mb-6">
              정말로 이 마사지 종류를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDeleteMassageType(deleteConfirm)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold transition"
              >
                삭제
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-slate-700 text-gray-300 rounded-lg hover:bg-slate-600 disabled:opacity-50 font-semibold transition"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
