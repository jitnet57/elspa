'use client';

/**
 * 📌 Sync Status Indicator Component
 * 📋 목적: WebSocket 연결 상태 및 동기화 상태 표시
 * 🔧 포함: 연결 상태, 활성 사용자, 마지막 동기화
 */

import { useEffect, useState } from 'react';

interface SyncStatusProps {
  isConnected: boolean;
  lastSyncTime?: Date;
  activeConnections?: number;
  activeUsers?: number;
}

export function SyncStatus({ isConnected, lastSyncTime, activeConnections, activeUsers }: SyncStatusProps) {
  const [displayTime, setDisplayTime] = useState<string>('');

  useEffect(() => {
    if (!lastSyncTime) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastSyncTime.getTime();

      if (diff < 60000) {
        setDisplayTime('now');
      } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        setDisplayTime(`${minutes}m ago`);
      } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        setDisplayTime(`${hours}h ago`);
      } else {
        setDisplayTime(lastSyncTime.toLocaleString('en-PH'));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000); // Update every 30s

    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm">
      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div
          className={`w-2.5 h-2.5 rounded-full transition-colors ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="font-semibold text-gray-700">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-300" />

      {/* Last Sync Time */}
      {displayTime && (
        <div className="flex items-center gap-1 text-gray-600">
          <span className="text-xs">🔄</span>
          <span>Synced {displayTime}</span>
        </div>
      )}

      {/* Active Stats */}
      {(activeConnections !== undefined || activeUsers !== undefined) && (
        <>
          <div className="w-px h-4 bg-gray-300" />

          <div className="flex items-center gap-3 text-gray-600 text-xs">
            {activeConnections !== undefined && (
              <span>
                👥 <span className="font-semibold">{activeConnections}</span> connections
              </span>
            )}
            {activeUsers !== undefined && (
              <span>
                👤 <span className="font-semibold">{activeUsers}</span> users
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Loading skeleton
export function SyncStatusSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200 animate-pulse">
      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
      <div className="h-4 w-24 bg-gray-300 rounded" />
      <div className="w-px h-4 bg-gray-300" />
      <div className="h-4 w-32 bg-gray-300 rounded" />
    </div>
  );
}
