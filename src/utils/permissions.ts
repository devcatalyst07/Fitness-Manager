/**
 * Permission Helper Utility
 *
 * Reusable function to check if a user has a specific permission
 * Used across all user pages for RBAC implementation
 */

export interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

/**
 * Recursively checks if a permission exists and is checked
 *
 * @param permissionId - The permission ID to check (e.g., 'dashboard', 'projects-new')
 * @param permissions - Array of permissions from user's role
 * @returns boolean - true if permission exists and is checked
 *
 * @example
 * // Check if user can view dashboard
 * hasPermission('dashboard', userPermissions)
 *
 * @example
 * // Check if user can create new project
 * hasPermission('projects-new', userPermissions)
 *
 * @example
 * // Check nested permission
 * hasPermission('dashboard-brand-view-adduser', userPermissions)
 */
export const hasPermission = (
  permissionId: string,
  permissions: Permission[],
): boolean => {
  // Helper function to recursively search through permission tree
  const checkPermission = (perms: Permission[]): boolean => {
    for (const perm of perms) {
      // Direct match - check if this permission is checked
      if (perm.id === permissionId) {
        return perm.checked;
      }

      // Recursively check children
      if (perm.children && perm.children.length > 0) {
        const found = checkPermission(perm.children);
        if (found) return true;
      }
    }
    return false;
  };

  return checkPermission(permissions);
};

/**
 * Check if user has ANY of the specified permissions
 *
 * @param permissionIds - Array of permission IDs to check
 * @param permissions - Array of permissions from user's role
 * @returns boolean - true if user has at least one of the permissions
 *
 * @example
 * // Check if user can do any project action
 * hasAnyPermission(['projects-new', 'projects-delete'], userPermissions)
 */
export const hasAnyPermission = (
  permissionIds: string[],
  permissions: Permission[],
): boolean => {
  return permissionIds.some((id) => hasPermission(id, permissions));
};

/**
 * Check if user has ALL of the specified permissions
 *
 * @param permissionIds - Array of permission IDs to check
 * @param permissions - Array of permissions from user's role
 * @returns boolean - true only if user has all permissions
 *
 * @example
 * // Check if user has full project management access
 * hasAllPermissions(['projects-new', 'projects-delete', 'projects-view-details'], userPermissions)
 */
export const hasAllPermissions = (
  permissionIds: string[],
  permissions: Permission[],
): boolean => {
  return permissionIds.every((id) => hasPermission(id, permissions));
};

/**
 * Get all checked permission IDs from permission tree (for debugging)
 *
 * @param permissions - Array of permissions from user's role
 * @returns string[] - Array of all checked permission IDs
 *
 * @example
 * const checkedPermissions = getCheckedPermissions(userPermissions);
 * console.log('User has:', checkedPermissions);
 * // Output: ['dashboard', 'dashboard-brand', 'projects', 'projects-new', ...]
 */
export const getCheckedPermissions = (permissions: Permission[]): string[] => {
  const checked: string[] = [];

  const collectChecked = (perms: Permission[]) => {
    for (const perm of perms) {
      if (perm.checked) {
        checked.push(perm.id);
      }
      if (perm.children && perm.children.length > 0) {
        collectChecked(perm.children);
      }
    }
  };

  collectChecked(permissions);
  return checked;
};

/**
 * Admin bypass - always returns true
 * Use this wrapper for admin users who have full access
 *
 * @param permissionId - The permission ID to check
 * @param permissions - Array of permissions (ignored for admin)
 * @param isAdmin - Boolean indicating if user is admin
 * @returns boolean - true if admin, otherwise checks permissions
 *
 * @example
 * const canCreate = checkPermissionWithAdminBypass('projects-new', permissions, userRole === 'admin');
 */
export const checkPermissionWithAdminBypass = (
  permissionId: string,
  permissions: Permission[],
  isAdmin: boolean,
): boolean => {
  if (isAdmin) return true; // Admin always has access
  return hasPermission(permissionId, permissions);
};