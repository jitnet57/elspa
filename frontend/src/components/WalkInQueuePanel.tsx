'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store/store';

export function WalkInQueuePanel() {
  const { walkInQueue, removeFromQueue } = useStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const waitingGuests = walkInQueue.filter(g => g.status === 'waiting');
  const assignedGuests = walkInQueue.filter(g => g.status === 'assigned');

  const handleRemove = (guestId: string) => {
    if (confirm('Remove this guest from the queue?')) {
      removeFromQueue(guestId);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold text-blue-400 mb-4">
        📋 Walk-in Queue ({waitingGuests.length})
      </h3>

      {/* Waiting guests list */}
      {waitingGuests.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          <div>👏 No guests waiting</div>
          <div className="text-xs mt-2 text-gray-500">
            Add guests using the [+ Add Walk-in] button
          </div>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {waitingGuests.map((guest, idx) => (
            <div
              key={guest.id}
              className="bg-gray-700 rounded p-3 cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() =>
                setExpandedId(expandedId === guest.id ? null : guest.id)
              }
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-white">
                  #{guest.queue_number} {guest.customer_name || 'Guest'}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(guest.id);
                  }}
                  className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  title="Remove"
                >
                  ✕
                </button>
              </div>

              {/* Basic Information */}
              <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                <div>
                  💆 <span className="text-blue-300">{guest.service_type}</span>
                </div>
                <div className="text-yellow-300">
                  {new Date(guest.created_at).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === guest.id && (
                <div className="border-t border-gray-600 mt-2 pt-2 text-xs text-gray-400 space-y-1">
                  {guest.requested_therapist_id && (
                    <div>
                      👤 Preferred Therapist: ID {guest.requested_therapist_id}
                    </div>
                  )}
                  <div>
                    ⏱️ Wait Time:{' '}
                    {Math.round(
                      (Date.now() - new Date(guest.created_at).getTime()) / 60000
                    )}{' '}
                    min
                  </div>
                  <div>
                    Status:{' '}
                    <span className="text-yellow-300">
                      {guest.status === 'waiting' ? '🟡 Waiting' : '🟢 Assigned'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assigned Guests Section */}
      {assignedGuests.length > 0 && (
        <div>
          <h4 className="text-xs font-bold text-green-400 mb-2 uppercase">
            ✅ Assigned ({assignedGuests.length})
          </h4>
          <div className="space-y-1 text-xs">
            {assignedGuests.map(guest => (
              <div
                key={guest.id}
                className="bg-green-900/20 border border-green-700/30 rounded p-2 text-green-300"
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold">
                    #{guest.queue_number} {guest.customer_name || 'Guest'}
                  </div>
                  <button
                    onClick={() => handleRemove(guest.id)}
                    className="text-xs px-1 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
