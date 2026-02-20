/**
 * MemberFilter Component
 * Story 3.7: Analytics Dashboard UI
 */

'use client';

import React, { useState } from 'react';
import { PerUserMetric } from '@/lib/types/analytics';

interface MemberFilterProps {
  members: PerUserMetric[];
  selectedMemberId?: string;
  onMemberSelect: (userId: string | null) => void;
  disabled?: boolean;
}

export function MemberFilter({
  members,
  selectedMemberId,
  onMemberSelect,
  disabled = false,
}: MemberFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedMember = members.find((m) => m.userId === selectedMemberId);

  return (
    <div className="relative">
      <div className="space-y-2">
        <label htmlFor="member-select" className="block text-sm font-medium text-gray-700">
          Filter by Member
        </label>

        <div className="relative">
          {/* Dropdown Button */}
          <button
            id="member-select"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              disabled ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={selectedMemberId ? 'text-gray-900' : 'text-gray-500'}>
                {selectedMember ? selectedMember.userName : 'All Members'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
              {/* All Members Option */}
              <button
                onClick={() => {
                  onMemberSelect(null);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition ${
                  !selectedMemberId ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {!selectedMemberId && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="font-medium">All Members</span>
                </div>
              </button>

              {/* Individual Members */}
              {members.map((member) => (
                <button
                  key={member.userId}
                  onClick={() => {
                    onMemberSelect(member.userId);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition ${
                    selectedMemberId === member.userId
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {selectedMemberId === member.userId && (
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span>{member.userName}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {member.taskCount} tasks
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
