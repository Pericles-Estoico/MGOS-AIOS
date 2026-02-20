/**
 * Hook: useUserRole
 * Story 3.7: Analytics Dashboard UI
 * Provides user role and authorization checks
 */

'use client';

import { useCallback, useMemo } from 'react';

export type UserRole = 'admin' | 'head' | 'user' | 'executor';

interface UseUserRoleReturn {
  role: UserRole;
  userId: string;
  canViewTeamMetrics: boolean;
  canFilterMembers: boolean;
}

/**
 * Get user role from Authorization header or session
 * For demo purposes, this extracts from Bearer token format: userId:role
 */
function getUserRoleFromSession(): { role: UserRole; userId: string } {
  // In a real app, this would read from NextAuth session
  // For now, we'll check if there's role info in the DOM or use a default

  if (typeof window !== 'undefined') {
    const roleData = localStorage.getItem('user-role');
    if (roleData) {
      try {
        const { role, userId } = JSON.parse(roleData);
        return { role: role as UserRole, userId };
      } catch {
        // Fall through to default
      }
    }
  }

  // Default to user role if not found
  return {
    role: 'user' as UserRole,
    userId: 'unknown',
  };
}

export function useUserRole(): UseUserRoleReturn {
  const { role, userId } = useMemo(() => getUserRoleFromSession(), []);

  const canViewTeamMetrics = useCallback((): boolean => {
    return role === 'admin' || role === 'head';
  }, [role]);

  const canFilterMembers = useCallback((): boolean => {
    return role === 'admin' || role === 'head';
  }, [role]);

  return {
    role,
    userId,
    canViewTeamMetrics: canViewTeamMetrics(),
    canFilterMembers: canFilterMembers(),
  };
}

/**
 * Utility to check if a user can access another user's metrics
 */
export function canAccessUserMetrics(
  requestedUserId: string,
  currentUserId: string,
  currentRole: UserRole
): boolean {
  // Own metrics: always allowed
  if (requestedUserId === currentUserId) {
    return true;
  }

  // Other user's metrics: only admin and head
  return currentRole === 'admin' || currentRole === 'head';
}
