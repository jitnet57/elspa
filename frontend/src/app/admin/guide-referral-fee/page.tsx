'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store/store';

interface GuideReferral {
  id: number;
  guideName: string;
  guideId: number;
  companyId: number;
  totalReferrals: number;
  therapistReferrals: number;
  customerReferrals: number;
  referralFeePerTherapist: number; // ₱ amount
  referralFeePerCustomer: number; // ₱ amount or %
  totalReferralFeeEarned: number;
  pendingReferralFee: number;
  status: 'active' | 'inactive';
  lastReferralDate: string;
}

interface ReferralRecord {
  id: number;
  referrerGuideId: number;
  referrerGuideName: string;
  referralType: 'therapist' | 'customer';
  referralName: string;
  feeEarned: number;
  status: 'pending' | 'confirmed' | 'paid';
  referralDate: string;
  settlementDate?: string;
}

const mockGuideReferrals: GuideReferral[] = [
  {
    id: 1,
    guideName: 'Sarah',
    guideId: 1,
    companyId: 1,
    totalReferrals: 12,
    therapistReferrals: 8,
    customerReferrals: 4,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 10000,
    pendingReferralFee: 1500,
    status: 'active',
    lastReferralDate: '2026-05-18',
  },
  {
    id: 2,
    guideName: 'Emma',
    guideId: 2,
    companyId: 1,
    totalReferrals: 16,
    therapistReferrals: 10,
    customerReferrals: 6,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 13000,
    pendingReferralFee: 2000,
    status: 'active',
    lastReferralDate: '2026-05-20',
  },
  {
    id: 3,
    guideName: 'Jessica',
    guideId: 3,
    companyId: 1,
    totalReferrals: 9,
    therapistReferrals: 6,
    customerReferrals: 3,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 7500,
    pendingReferralFee: 1000,
    status: 'active',
    lastReferralDate: '2026-05-15',
  },
  {
    id: 4,
    guideName: 'Amanda',
    guideId: 4,
    companyId: 2,
    totalReferrals: 18,
    therapistReferrals: 12,
    customerReferrals: 6,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 15000,
    pendingReferralFee: 2500,
    status: 'active',
    lastReferralDate: '2026-05-22',
  },
  {
    id: 5,
    guideName: 'Catherine',
    guideId: 5,
    companyId: 2,
    totalReferrals: 11,
    therapistReferrals: 7,
    customerReferrals: 4,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 9000,
    pendingReferralFee: 1500,
    status: 'active',
    lastReferralDate: '2026-05-19',
  },
  {
    id: 6,
    guideName: 'Rachel',
    guideId: 6,
    companyId: 3,
    totalReferrals: 14,
    therapistReferrals: 9,
    customerReferrals: 5,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 11500,
    pendingReferralFee: 2000,
    status: 'active',
    lastReferralDate: '2026-05-21',
  },
  {
    id: 7,
    guideName: 'Monica',
    guideId: 7,
    companyId: 4,
    totalReferrals: 10,
    therapistReferrals: 6,
    customerReferrals: 4,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 8000,
    pendingReferralFee: 1500,
    status: 'active',
    lastReferralDate: '2026-05-17',
  },
  {
    id: 8,
    guideName: 'Diana',
    guideId: 8,
    companyId: 5,
    totalReferrals: 13,
    therapistReferrals: 8,
    customerReferrals: 5,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 10500,
    pendingReferralFee: 2000,
    status: 'active',
    lastReferralDate: '2026-05-19',
  },
  {
    id: 9,
    guideName: 'Michelle',
    guideId: 9,
    companyId: 6,
    totalReferrals: 15,
    therapistReferrals: 10,
    customerReferrals: 5,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 12500,
    pendingReferralFee: 2500,
    status: 'active',
    lastReferralDate: '2026-05-20',
  },
  {
    id: 10,
    guideName: 'Angela',
    guideId: 10,
    companyId: 7,
    totalReferrals: 11,
    therapistReferrals: 7,
    customerReferrals: 4,
    referralFeePerTherapist: 1000,
    referralFeePerCustomer: 500,
    totalReferralFeeEarned: 9000,
    pendingReferralFee: 1500,
    status: 'active',
    lastReferralDate: '2026-05-18',
  },
];

const mockReferralRecords: ReferralRecord[] = [
  // Sarah's referrals
  { id: 1, referrerGuideId: 1, referrerGuideName: 'Sarah', referralType: 'therapist', referralName: 'Nina Lopez', feeEarned: 1000, status: 'paid', referralDate: '2026-04-15', settlementDate: '2026-05-05' },
  { id: 2, referrerGuideId: 1, referrerGuideName: 'Sarah', referralType: 'customer', referralName: 'John Smith', feeEarned: 500, status: 'paid', referralDate: '2026-04-20', settlementDate: '2026-05-05' },
  { id: 3, referrerGuideId: 1, referrerGuideName: 'Sarah', referralType: 'therapist', referralName: 'David Wilson', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-05', settlementDate: '2026-05-15' },
  { id: 4, referrerGuideId: 1, referrerGuideName: 'Sarah', referralType: 'therapist', referralName: 'Patricia Martinez', feeEarned: 1000, status: 'pending', referralDate: '2026-05-18' },
  // Emma's referrals
  { id: 5, referrerGuideId: 2, referrerGuideName: 'Emma', referralType: 'therapist', referralName: 'Maria Garcia', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-01', settlementDate: '2026-05-15' },
  { id: 6, referrerGuideId: 2, referrerGuideName: 'Emma', referralType: 'therapist', referralName: 'Carlos Cruz', feeEarned: 1000, status: 'pending', referralDate: '2026-05-18' },
  { id: 7, referrerGuideId: 2, referrerGuideName: 'Emma', referralType: 'customer', referralName: 'Lisa Brown', feeEarned: 500, status: 'confirmed', referralDate: '2026-05-10', settlementDate: '2026-05-15' },
  { id: 8, referrerGuideId: 2, referrerGuideName: 'Emma', referralType: 'therapist', referralName: 'James Lee', feeEarned: 1000, status: 'paid', referralDate: '2026-04-25', settlementDate: '2026-05-05' },
  // Jessica's referrals
  { id: 9, referrerGuideId: 3, referrerGuideName: 'Jessica', referralType: 'therapist', referralName: 'Michael Torres', feeEarned: 1000, status: 'paid', referralDate: '2026-04-18', settlementDate: '2026-05-05' },
  { id: 10, referrerGuideId: 3, referrerGuideName: 'Jessica', referralType: 'customer', referralName: 'Angela Davis', feeEarned: 500, status: 'confirmed', referralDate: '2026-05-08', settlementDate: '2026-05-15' },
  { id: 11, referrerGuideId: 3, referrerGuideName: 'Jessica', referralType: 'therapist', referralName: 'Roberto Flores', feeEarned: 1000, status: 'pending', referralDate: '2026-05-15' },
  // Amanda's referrals
  { id: 12, referrerGuideId: 4, referrerGuideName: 'Amanda', referralType: 'therapist', referralName: 'Rosa Mendoza', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-10', settlementDate: '2026-05-20' },
  { id: 13, referrerGuideId: 4, referrerGuideName: 'Amanda', referralType: 'therapist', referralName: 'Fernando Reyes', feeEarned: 1000, status: 'paid', referralDate: '2026-04-22', settlementDate: '2026-05-05' },
  { id: 14, referrerGuideId: 4, referrerGuideName: 'Amanda', referralType: 'customer', referralName: 'Susan Johnson', feeEarned: 500, status: 'paid', referralDate: '2026-04-28', settlementDate: '2026-05-05' },
  { id: 15, referrerGuideId: 4, referrerGuideName: 'Amanda', referralType: 'therapist', referralName: 'Victor Santos', feeEarned: 1000, status: 'pending', referralDate: '2026-05-20' },
  // Catherine's referrals
  { id: 16, referrerGuideId: 5, referrerGuideName: 'Catherine', referralType: 'therapist', referralName: 'Linda Rodriguez', feeEarned: 1000, status: 'paid', referralDate: '2026-04-30', settlementDate: '2026-05-05' },
  { id: 17, referrerGuideId: 5, referrerGuideName: 'Catherine', referralType: 'therapist', referralName: 'George Hernandez', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-12', settlementDate: '2026-05-20' },
  { id: 18, referrerGuideId: 5, referrerGuideName: 'Catherine', referralType: 'customer', referralName: 'Margaret Moore', feeEarned: 500, status: 'pending', referralDate: '2026-05-19' },
  // Rachel's referrals
  { id: 19, referrerGuideId: 6, referrerGuideName: 'Rachel', referralType: 'therapist', referralName: 'Richard Taylor', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-05', settlementDate: '2026-05-15' },
  { id: 20, referrerGuideId: 6, referrerGuideName: 'Rachel', referralType: 'therapist', referralName: 'Barbara Anderson', feeEarned: 1000, status: 'paid', referralDate: '2026-04-19', settlementDate: '2026-05-05' },
  { id: 21, referrerGuideId: 6, referrerGuideName: 'Rachel', referralType: 'customer', referralName: 'Christopher Thomas', feeEarned: 500, status: 'paid', referralDate: '2026-04-26', settlementDate: '2026-05-05' },
  { id: 22, referrerGuideId: 6, referrerGuideName: 'Rachel', referralType: 'therapist', referralName: 'Nancy Jackson', feeEarned: 1000, status: 'pending', referralDate: '2026-05-21' },
  // Monica's referrals
  { id: 23, referrerGuideId: 7, referrerGuideName: 'Monica', referralType: 'therapist', referralName: 'Kevin White', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-08', settlementDate: '2026-05-20' },
  { id: 24, referrerGuideId: 7, referrerGuideName: 'Monica', referralType: 'customer', referralName: 'Dorothy Harris', feeEarned: 500, status: 'paid', referralDate: '2026-04-23', settlementDate: '2026-05-05' },
  { id: 25, referrerGuideId: 7, referrerGuideName: 'Monica', referralType: 'therapist', referralName: 'Paul Martin', feeEarned: 1000, status: 'pending', referralDate: '2026-05-17' },
  // Diana's referrals
  { id: 26, referrerGuideId: 8, referrerGuideName: 'Diana', referralType: 'therapist', referralName: 'Steven Thompson', feeEarned: 1000, status: 'paid', referralDate: '2026-04-21', settlementDate: '2026-05-05' },
  { id: 27, referrerGuideId: 8, referrerGuideName: 'Diana', referralType: 'therapist', referralName: 'Elizabeth Garcia', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-09', settlementDate: '2026-05-20' },
  { id: 28, referrerGuideId: 8, referrerGuideName: 'Diana', referralType: 'customer', referralName: 'Joshua Rodriguez', feeEarned: 500, status: 'confirmed', referralDate: '2026-05-14', settlementDate: '2026-05-20' },
  { id: 29, referrerGuideId: 8, referrerGuideName: 'Diana', referralType: 'therapist', referralName: 'Andrew Wilson', feeEarned: 1000, status: 'pending', referralDate: '2026-05-19' },
  // Michelle's referrals
  { id: 30, referrerGuideId: 9, referrerGuideName: 'Michelle', referralType: 'therapist', referralName: 'Donna Martinez', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-06', settlementDate: '2026-05-20' },
  { id: 31, referrerGuideId: 9, referrerGuideName: 'Michelle', referralType: 'therapist', referralName: 'Edward Jones', feeEarned: 1000, status: 'paid', referralDate: '2026-04-24', settlementDate: '2026-05-05' },
  { id: 32, referrerGuideId: 9, referrerGuideName: 'Michelle', referralType: 'customer', referralName: 'Deborah Lee', feeEarned: 500, status: 'paid', referralDate: '2026-04-29', settlementDate: '2026-05-05' },
  { id: 33, referrerGuideId: 9, referrerGuideName: 'Michelle', referralType: 'therapist', referralName: 'Ronald Lopez', feeEarned: 1000, status: 'pending', referralDate: '2026-05-22' },
  // Angela's referrals
  { id: 34, referrerGuideId: 10, referrerGuideName: 'Angela', referralType: 'therapist', referralName: 'Mary Taylor', feeEarned: 1000, status: 'paid', referralDate: '2026-04-17', settlementDate: '2026-05-05' },
  { id: 35, referrerGuideId: 10, referrerGuideName: 'Angela', referralType: 'therapist', referralName: 'Thomas Anderson', feeEarned: 1000, status: 'confirmed', referralDate: '2026-05-07', settlementDate: '2026-05-20' },
  { id: 36, referrerGuideId: 10, referrerGuideName: 'Angela', referralType: 'customer', referralName: 'Charles Thomas', feeEarned: 500, status: 'confirmed', referralDate: '2026-05-13', settlementDate: '2026-05-20' },
  { id: 37, referrerGuideId: 10, referrerGuideName: 'Angela', referralType: 'therapist', referralName: 'Joseph Hernandez', feeEarned: 1000, status: 'pending', referralDate: '2026-05-20' },
];

export default function GuideReferralFeePage() {
  const [referrals, setReferrals] = useState<GuideReferral[]>(mockGuideReferrals);
  const [referralRecords, setReferralRecords] = useState<ReferralRecord[]>(mockReferralRecords);
  const [selectedGuide, setSelectedGuide] = useState<GuideReferral | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'settings'>('overview');
  const [referralFeeSettings, setReferralFeeSettings] = useState({
    feePerTherapist: 1000,
    feePerCustomer: 500,
  });

  const totalReferralFees = referrals.reduce((sum, r) => sum + r.totalReferralFeeEarned, 0);
  const totalPendingFees = referrals.reduce((sum, r) => sum + r.pendingReferralFee, 0);
  const topReferrer = referrals.reduce((max, r) => r.totalReferrals > max.totalReferrals ? r : max);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🎯 Guide Referral Fee Management</h1>
              <p className="text-gray-600 mt-2">Track and manage guide referral earnings and incentives</p>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-600">
            <p className="text-sm text-gray-600 font-bold">Total Referral Fees</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">₱{totalReferralFees.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-yellow-600">
            <p className="text-sm text-gray-600 font-bold">Pending Fees</p>
            <p className="text-2xl font-bold text-yellow-600 mt-1">₱{totalPendingFees.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-600">
            <p className="text-sm text-gray-600 font-bold">Active Guides</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{referrals.filter(r => r.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-purple-600">
            <p className="text-sm text-gray-600 font-bold">Top Referrer</p>
            <p className="text-lg font-bold text-purple-600 mt-1">{topReferrer?.guideName}</p>
            <p className="text-xs text-gray-500">{topReferrer?.totalReferrals} referrals</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 font-bold border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 font-bold border-b-2 transition ${
              activeTab === 'details'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 Referral Records
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-3 font-bold border-b-2 transition ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            ⚙️ Fee Settings
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Guide Referral Performance</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Guide Name</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Total Referrals</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">👨‍⚕️ Therapists</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">👥 Customers</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Total Earned</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Pending</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedGuide(referral)}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{referral.guideName}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600 font-bold">{referral.totalReferrals}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{referral.therapistReferrals}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{referral.customerReferrals}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">₱{referral.totalReferralFeeEarned.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-yellow-600">₱{referral.pendingReferralFee.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          referral.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {referral.status === 'active' ? '✓ Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Individual Referral Records</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Referrer Guide</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Referral Type</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-gray-900">Referred Person</th>
                    <th className="px-6 py-3 text-right text-sm font-bold text-gray-900">Fee Earned</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Referral Date</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-bold text-gray-900">Settlement Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {referralRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.referrerGuideName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          record.referralType === 'therapist'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {record.referralType === 'therapist' ? '👨‍⚕️ Therapist' : '👥 Customer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{record.referralName}</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-600">₱{record.feeEarned.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{record.referralDate}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          record.status === 'paid'
                            ? 'bg-green-100 text-green-700'
                            : record.status === 'confirmed'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {record.status === 'paid' ? '✓ Paid' : record.status === 'confirmed' ? '✓ Confirmed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{record.settlementDate || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Referral Fee Configuration</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Therapist Referral Fee */}
              <div className="border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  👨‍⚕️ Therapist Referral Fee
                </label>
                <div className="flex items-end gap-2 mb-2">
                  <input
                    type="number"
                    value={referralFeeSettings.feePerTherapist}
                    onChange={e => setReferralFeeSettings({...referralFeeSettings, feePerTherapist: parseInt(e.target.value)})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-lg font-bold text-gray-900">₱</span>
                </div>
                <p className="text-xs text-gray-600">Fee earned when a guide refers a new therapist</p>
              </div>

              {/* Customer Referral Fee */}
              <div className="border border-gray-200 rounded-lg p-6">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  👥 Customer Referral Fee
                </label>
                <div className="flex items-end gap-2 mb-2">
                  <input
                    type="number"
                    value={referralFeeSettings.feePerCustomer}
                    onChange={e => setReferralFeeSettings({...referralFeeSettings, feePerCustomer: parseInt(e.target.value)})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 text-gray-900"
                  />
                  <span className="text-lg font-bold text-gray-900">₱</span>
                </div>
                <p className="text-xs text-gray-600">Fee earned when a guide refers a new customer</p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-indigo-900 mb-2">💡 Referral Incentive Structure</h3>
              <ul className="text-sm text-indigo-800 space-y-1">
                <li>✓ Each therapist referral: ₱{referralFeeSettings.feePerTherapist.toLocaleString()}</li>
                <li>✓ Each customer referral: ₱{referralFeeSettings.feePerCustomer.toLocaleString()}</li>
                <li>✓ Paid monthly with settlement</li>
                <li>✓ Referrals must be confirmed/active to earn fee</li>
              </ul>
            </div>

            <button
              onClick={() => alert('Settings saved! (₱' + referralFeeSettings.feePerTherapist + ' per therapist, ₱' + referralFeeSettings.feePerCustomer + ' per customer)')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition"
            >
              💾 Save Fee Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
