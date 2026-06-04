'use client';

/**
 * 📌 Permission Guard Component
 * 📋 목적: 권한에 따라 컴포넌트 렌더링 제어
 * 🔧 포함: 권한 확인, 폴백 UI, 툴팁
 */

import { ReactNode } from 'react';
import { UserRole, getPermissions, UserPermissions } from '@/lib/auth/financial-permissions';

interface PermissionGuardProps {
  userRole: UserRole;
  permission: keyof UserPermissions;
  children: ReactNode;
  fallback?: ReactNode;
  tooltip?: string;
}

export function PermissionGuard({
  userRole,
  permission,
  children,
  fallback,
  tooltip,
}: PermissionGuardProps) {
  const permissions = getPermissions(userRole);
  const hasPermission = permissions[permission];

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // 기본 폴백: 비활성화된 상태
  return (
    <div
      title={tooltip || `Permission denied: ${permission}`}
      className="opacity-50 cursor-not-allowed"
    >
      {children}
    </div>
  );
}

interface ConditionalButtonProps {
  userRole: UserRole;
  permission: keyof UserPermissions;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
  children: ReactNode;
}

export function ConditionalButton({
  userRole,
  permission,
  onClick,
  className = '',
  tooltip,
  children,
}: ConditionalButtonProps) {
  const permissions = getPermissions(userRole);
  const hasPermission = permissions[permission];

  return (
    <button
      disabled={!hasPermission}
      onClick={onClick}
      title={
        tooltip ||
        (hasPermission ? undefined : `Permission denied: ${permission}`)
      }
      className={`
        ${className}
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-opacity
      `}
    >
      {children}
    </button>
  );
}

interface RoleBasedContentProps {
  userRole: UserRole;
  adminContent?: ReactNode;
  managerContent?: ReactNode;
  viewerContent?: ReactNode;
  guestContent?: ReactNode;
  defaultContent?: ReactNode;
}

export function RoleBasedContent({
  userRole,
  adminContent,
  managerContent,
  viewerContent,
  guestContent,
  defaultContent,
}: RoleBasedContentProps) {
  switch (userRole) {
    case 'admin':
      return <>{adminContent || defaultContent}</>;
    case 'manager':
      return <>{managerContent || defaultContent}</>;
    case 'viewer':
      return <>{viewerContent || defaultContent}</>;
    case 'guest':
      return <>{guestContent || defaultContent}</>;
    default:
      return <>{defaultContent}</>;
  }
}
