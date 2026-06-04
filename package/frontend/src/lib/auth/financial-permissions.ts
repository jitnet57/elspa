/**
 * 📌 Financial Dashboard 권한 관리
 * 📋 목적: Role-based Access Control (RBAC)
 * 🔧 역할: admin, manager, viewer
 */

export type UserRole = 'admin' | 'manager' | 'viewer' | 'guest';

export interface UserPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canSetBudget: boolean;
  canViewAuditLog: boolean;
  canAccessAllMonths: boolean;
}

const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  // 🔴 Admin: 모든 권한
  admin: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: true,
    canExport: true,
    canSetBudget: true,
    canViewAuditLog: true,
    canAccessAllMonths: true,
  },

  // 🟠 Manager: 거의 모든 권한 (삭제 불가)
  manager: {
    canView: true,
    canAdd: true,
    canEdit: true,
    canDelete: false,
    canExport: true,
    canSetBudget: true,
    canViewAuditLog: true,
    canAccessAllMonths: true,
  },

  // 🟡 Viewer: 조회만 가능
  viewer: {
    canView: true,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canExport: true,
    canSetBudget: false,
    canViewAuditLog: false,
    canAccessAllMonths: false, // 현재 월만
  },

  // ⚪ Guest: 접근 불가
  guest: {
    canView: false,
    canAdd: false,
    canEdit: false,
    canDelete: false,
    canExport: false,
    canSetBudget: false,
    canViewAuditLog: false,
    canAccessAllMonths: false,
  },
};

/**
 * 사용자 역할에 따른 권한 조회
 */
export function getPermissions(role: UserRole): UserPermissions {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['guest'];
}

/**
 * 특정 작업 권한 확인
 */
export function canPerformAction(
  role: UserRole,
  action: keyof UserPermissions
): boolean {
  const permissions = getPermissions(role);
  return permissions[action];
}

/**
 * 권한 검증 (조건부 실행)
 */
export function requirePermission(
  role: UserRole,
  action: keyof UserPermissions
): void {
  if (!canPerformAction(role, action)) {
    throw new Error(
      `❌ Permission denied: ${action} not allowed for role ${role}`
    );
  }
}
