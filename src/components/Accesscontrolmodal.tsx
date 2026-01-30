import React, { useState, useEffect } from 'react';

interface Permission {
  id: string;
  label: string;
  children?: Permission[];
  checked: boolean;
}

interface Role {
  _id: string;
  name: string;
  brandId: string;
  permissions: Permission[];
}

interface AccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandId?: string;
  brands?: Array<{ _id: string; name: string }>; // Optional brands list for selection
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://fitout-manager-api.vercel.app';

const AccessControlModal: React.FC<AccessControlModalProps> = ({
  isOpen,
  onClose,
  brandId: initialBrandId,
  brands = [],
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(initialBrandId || '');
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showAddRoleInput, setShowAddRoleInput] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync selectedBrandId when initialBrandId prop changes or modal opens
  // Only set from prop if we don't already have a selected brand
  useEffect(() => {
    if (isOpen && initialBrandId && !selectedBrandId) {
      setSelectedBrandId(initialBrandId);
    }
  }, [isOpen, initialBrandId]);

  // Initial permissions structure - used for new roles
  const initialPermissions: Permission[] = [
    {
      id: 'overview',
      label: 'Overview',
      checked: false,
    },
    {
      id: 'task',
      label: 'Task',
      checked: false,
      children: [
        { id: 'task-list', label: 'List', checked: false },
        { id: 'task-board', label: 'Board', checked: false },
        { id: 'task-timeline', label: 'Timeline', checked: false },
        { id: 'task-create', label: 'Create Task', checked: false },
      ],
    },
    {
      id: 'action',
      label: 'Action',
      checked: false,
      children: [
        { id: 'action-view', label: 'View', checked: false },
        { id: 'action-edit', label: 'Edit', checked: false },
        { id: 'action-delete', label: 'Delete', checked: false },
      ],
    },
    {
      id: 'budget',
      label: 'Budget',
      checked: false,
      children: [
        { id: 'budget-add', label: 'Add Item', checked: false },
        { id: 'budget-export', label: 'Export CSV', checked: false },
      ],
    },
    {
      id: 'documents',
      label: 'Documents',
      checked: false,
    },
    {
      id: 'team',
      label: 'Team',
      checked: false,
      children: [
        { id: 'team-add', label: 'Add Member', checked: false },
      ],
    },
  ];

  // Fetch roles when modal opens or brandId changes
  useEffect(() => {
    if (isOpen && selectedBrandId) {
      fetchRoles();
    } else if (!isOpen) {
      // Reset UI state when modal closes but keep roles cached
      setShowAddRoleInput(false);
      setNewRoleName('');
    }
  }, [isOpen, selectedBrandId]);

  // Update permissions when selected role changes
  useEffect(() => {
    if (selectedRoleId) {
      const selectedRole = roles.find(r => r._id === selectedRoleId);
      if (selectedRole) {
        setPermissions(selectedRole.permissions);
      }
    } else {
      setPermissions(initialPermissions);
    }
  }, [selectedRoleId, roles]);

  const fetchRoles = async () => {
    if (!selectedBrandId) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/roles/brand/${selectedBrandId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📥 Fetched roles from database:', data);
        setRoles(data);
        
        // Only set first role as selected if no role is currently selected
        if (data.length > 0 && !selectedRoleId) {
          setSelectedRoleId(data[0]._id);
        }
      } else {
        console.error('Failed to fetch roles');
        setRoles([]);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Inline styles
  const styles = {
    overlay: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)',
    },
    modal: {
      background: 'white',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '600px',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column' as const,
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '24px 28px',
      borderBottom: '1px solid #e5e7eb',
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: 600,
      color: '#111827',
      margin: 0,
    },
    addRoleBtn: {
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    addRoleSection: {
      padding: '16px 28px',
      background: '#f9fafb',
      borderBottom: '1px solid #e5e7eb',
    },
    addRoleInput: {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      marginBottom: '10px',
    },
    addRoleActions: {
      display: 'flex',
      gap: '8px',
    },
    btnConfirm: {
      padding: '6px 16px',
      background: '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
    },
    btnCancelInline: {
      padding: '6px 16px',
      background: '#6b7280',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '13px',
      fontWeight: 500,
      cursor: 'pointer',
    },
    roleSelectorSection: {
      padding: '20px 28px',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    roleSelectorLabel: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#374151',
      whiteSpace: 'nowrap' as const,
    },
    roleSelect: {
      flex: 1,
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      color: '#111827',
      background: 'white',
      cursor: 'pointer',
    },
    selectAllBtn: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 14px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      background: 'white',
      fontSize: '14px',
      fontWeight: 500,
      color: '#374151',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
    },
    permissionsContainer: {
      flex: 1,
      overflowY: 'auto' as const,
      padding: '20px 28px',
    },
    permissionGroup: {
      marginBottom: '16px',
    },
    permissionItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '10px 0',
      cursor: 'pointer',
      userSelect: 'none' as const,
    },
    permissionItemSpan: {
      fontSize: '14px',
      fontWeight: 500,
    },
    parentPermission: {
      fontWeight: 600,
      color: '#111827',
    },
    permissionChildren: {
      marginLeft: '28px',
      borderLeft: '2px solid #e5e7eb',
      paddingLeft: '16px',
    },
    childPermission: {
      color: '#6b7280',
      padding: '8px 0',
    },
    childPermissionSpan: {
      fontWeight: 400,
    },
    footer: {
      display: 'flex',
      justifyContent: 'flex-end',
      gap: '12px',
      padding: '20px 28px',
      borderTop: '1px solid #e5e7eb',
      background: '#f9fafb',
    },
    btnCancel: {
      padding: '10px 20px',
      background: 'white',
      color: '#6b7280',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
    },
    btnSave: {
      padding: '10px 20px',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
    },
    checkbox: {
      width: '18px',
      height: '18px',
      cursor: 'pointer',
      accentColor: '#3b82f6',
    },
  };

  // Check if all permissions are selected
  const areAllPermissionsSelected = () => {
    return permissions.every((perm) => {
      if (perm.children) {
        return perm.checked && perm.children.every((child) => child.checked);
      }
      return perm.checked;
    });
  };

  // Toggle select all
  const handleSelectAll = () => {
    const allSelected = areAllPermissionsSelected();
    const newPermissions = permissions.map((perm) => ({
      ...perm,
      checked: !allSelected,
      children: perm.children?.map((child) => ({
        ...child,
        checked: !allSelected,
      })),
    }));
    setPermissions(newPermissions);
  };

  // Toggle parent permission
  const handleParentToggle = (parentId: string) => {
    const newPermissions = permissions.map((perm) => {
      if (perm.id === parentId) {
        const newChecked = !perm.checked;
        // When unchecking parent, uncheck all children
        // When checking parent, keep children as is (don't auto-check them)
        return {
          ...perm,
          checked: newChecked,
          children: perm.children?.map((child) => ({
            ...child,
            checked: newChecked ? child.checked : false, // Only uncheck children when parent unchecks
          })),
        };
      }
      return perm;
    });
    setPermissions(newPermissions);
  };

  // Toggle child permission
  const handleChildToggle = (parentId: string, childId: string) => {
    const newPermissions = permissions.map((perm) => {
      if (perm.id === parentId && perm.children) {
        // Only allow toggle if parent is checked
        if (!perm.checked) {
          alert(`Please enable "${perm.label}" first before selecting its sub-items`);
          return perm;
        }
        
        const newChildren = perm.children.map((child) =>
          child.id === childId ? { ...child, checked: !child.checked } : child
        );
        
        // Parent stays checked regardless of children state
        // Only auto-check parent if ALL children become checked
        const allChildrenChecked = newChildren.every((child) => child.checked);
        
        return {
          ...perm,
          checked: perm.checked, // Keep parent checked
          children: newChildren,
        };
      }
      return perm;
    });
    setPermissions(newPermissions);
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      alert('Please select a role');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/roles/${selectedRoleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });

      if (response.ok) {
        alert('Permissions updated successfully!');
        onClose();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      alert('Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim() || !selectedBrandId) {
      alert('Role name and brand selection are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newRoleName,
          brandId: selectedBrandId,
          permissions: initialPermissions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Role created successfully:', data.role);
        
        // Refresh roles list and wait for it to complete
        await fetchRoles();
        console.log('✅ Roles refreshed, total roles:', roles.length + 1);
        
        // Select the newly created role after roles are fetched
        if (data.role && data.role._id) {
          setSelectedRoleId(data.role._id);
          console.log('✅ New role selected:', data.role.name);
        }
        
        // Reset form
        setNewRoleName('');
        setShowAddRoleInput(false);
        
        alert('Role created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create role');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      alert('Failed to create role. Please check if the backend routes are registered.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Role & Permissions</h2>
          <button
            style={styles.addRoleBtn}
            onClick={() => setShowAddRoleInput(!showAddRoleInput)}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Add Role
          </button>
        </div>

        {/* Add Role Input */}
        {showAddRoleInput && (
          <div style={styles.addRoleSection}>
            <input
              type="text"
              placeholder="Enter role name"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddRole()}
              style={styles.addRoleInput}
              autoFocus
            />
            <div style={styles.addRoleActions}>
              <button 
                onClick={handleAddRole} 
                style={styles.btnConfirm}
                onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
              >
                Add
              </button>
              <button 
                onClick={() => {
                  setShowAddRoleInput(false);
                  setNewRoleName('');
                }} 
                style={styles.btnCancelInline}
                onMouseEnter={(e) => e.currentTarget.style.background = '#4b5563'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#6b7280'}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Brand Selector - Only show if brands array is provided */}
        {brands.length > 0 && (
          <div style={{...styles.roleSelectorSection, borderBottom: '1px solid #e5e7eb'}}>
            <label style={styles.roleSelectorLabel}>Select Brand</label>
            <select
              value={selectedBrandId}
              onChange={(e) => {
                setSelectedBrandId(e.target.value);
                setSelectedRoleId(''); // Reset role selection when brand changes
              }}
              style={{...styles.roleSelect, flex: 1}}
            >
              <option value="" disabled>Select a Brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Selector */}
        <div style={styles.roleSelectorSection}>
          <label style={styles.roleSelectorLabel}>Select Role</label>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            style={styles.roleSelect}
            disabled={roles.length === 0}
          >
            {roles.length === 0 ? (
              <option value="" disabled>Select Roles</option>
            ) : (
              roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {role.name}
                </option>
              ))
            )}
          </select>
          <button
            style={styles.selectAllBtn}
            onClick={handleSelectAll}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <input
              type="checkbox"
              checked={areAllPermissionsSelected()}
              onChange={handleSelectAll}
              onClick={(e) => e.stopPropagation()}
              style={styles.checkbox}
            />
            Select All
          </button>
        </div>

        {/* Permissions List */}
        <div style={styles.permissionsContainer}>
          {permissions.map((permission) => (
            <div key={permission.id} style={styles.permissionGroup}>
              <label 
                style={{
                  ...styles.permissionItem,
                  ...styles.parentPermission,
                }}
              >
                <input
                  type="checkbox"
                  checked={permission.checked}
                  onChange={() => handleParentToggle(permission.id)}
                  style={styles.checkbox}
                />
                <span style={styles.permissionItemSpan}>{permission.label}</span>
              </label>

              {permission.children && (
                <div style={styles.permissionChildren}>
                  {permission.children.map((child) => (
                    <label
                      key={child.id}
                      style={{
                        ...styles.permissionItem,
                        ...styles.childPermission,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={child.checked}
                        onChange={() => handleChildToggle(permission.id, child.id)}
                        style={styles.checkbox}
                      />
                      <span style={{
                        ...styles.permissionItemSpan,
                        ...styles.childPermissionSpan,
                      }}>
                        {child.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button 
            style={styles.btnCancel} 
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.color = '#6b7280';
            }}
          >
            Cancel
          </button>
          <button 
            style={styles.btnSave} 
            onClick={handleSave}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessControlModal;