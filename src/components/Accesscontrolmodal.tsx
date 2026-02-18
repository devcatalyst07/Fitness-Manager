import React, { useState, useEffect, useRef } from "react";
import { Trash2, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/axios";

interface Permission {
  id: string;
  label: string;
  children?: Permission[];
  checked: boolean;
  isTitle?: boolean;
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
  brands?: Array<{ _id: string; name: string }>;
  highlightUserId?: string;
}

const AccessControlModal: React.FC<AccessControlModalProps> = ({
  isOpen,
  onClose,
  brandId: initialBrandId,
  brands = [],
  highlightUserId,
}) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>(
    initialBrandId || "",
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [showAddRoleInput, setShowAddRoleInput] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const brandDropdownRef = useRef<HTMLDivElement>(null);

  // Users state
  const [users, setUsers] = useState<
    {
      id: string;
      name: string;
      email: string;
      roleId: string | null;
      roleRequestPending?: boolean;
    }[]
  >([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const userListRef = useRef<HTMLDivElement>(null);
  const highlightedUserRef = useRef<HTMLDivElement>(null);

  // Sync selectedBrandId when initialBrandId prop changes or modal opens
  useEffect(() => {
    if (isOpen && initialBrandId && !selectedBrandId) {
      setSelectedBrandId(initialBrandId);
    }
  }, [isOpen, initialBrandId]);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  // Fetch roles when modal opens or brandId changes
  useEffect(() => {
    if (isOpen && selectedBrandId) {
      fetchRoles();
    }
  }, [isOpen, selectedBrandId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsRoleDropdownOpen(false);
      }
    };

    if (isRoleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isRoleDropdownOpen]);

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        brandDropdownRef.current &&
        !brandDropdownRef.current.contains(event.target as Node)
      ) {
        setIsBrandDropdownOpen(false);
      }
    };

    if (isBrandDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isBrandDropdownOpen]);

  // Update permissions when selected role changes
  useEffect(() => {
    if (selectedRoleId) {
      const selectedRole = roles.find((r) => r._id === selectedRoleId);
      if (selectedRole) {
        // Merge database permissions with full structure
        const mergedPermissions = mergePermissions(
          initialPermissions,
          selectedRole.permissions,
        );

        setPermissions(mergedPermissions);
      }
    } else {
      setPermissions(initialPermissions);
    }
  }, [selectedRoleId, roles]);

  // Merge function: combines full structure with saved checked states
  const mergePermissions = (
    fullStructure: Permission[],
    savedPermissions: Permission[],
  ): Permission[] => {
    return fullStructure.map((fullPerm) => {
      const savedPerm = savedPermissions.find((p) => p.id === fullPerm.id);

      // If this permission exists in saved, use its checked state
      // Otherwise default to false
      const isChecked = savedPerm ? savedPerm.checked : false;

      // Recursively merge children
      const mergedChildren = fullPerm.children
        ? mergePermissions(fullPerm.children, savedPerm?.children || [])
        : undefined;

      return {
        ...fullPerm,
        checked: isChecked,
        children: mergedChildren,
      };
    });
  };

  // Initial permissions structure
  const initialPermissions: Permission[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      checked: false,
      children: [
        {
          id: "dashboard-scope-workflow",
          label: "Scope & Workflow Architecture",
          checked: false,
          children: [
            {
              id: "dashboard-create-scope",
              label: "Create Scope",
              checked: false,
            },
          ],
        },
        {
          id: "dashboard-brand",
          label: "Brand Management",
          checked: false,
          children: [
            { id: "dashboard-brand-add", label: "Add Brand", checked: false },
            {
              id: "dashboard-brand-access",
              label: "Access Control",
              checked: false,
            },
            {
              id: "dashboard-brand-view",
              label: "View",
              checked: false,
              children: [
                {
                  id: "dashboard-brand-view-adduser",
                  label: "Add User",
                  checked: false,
                },
              ],
            },
            { id: "dashboard-brand-edit", label: "Edit", checked: false },
            { id: "dashboard-brand-delete", label: "Delete", checked: false },
          ],
        },
        {
          id: "dashboard-threads",
          label: "Threads",
          checked: false,
          isTitle: true,
          children: [
            {
              id: "dashboard-add-threads",
              label: "New Threads",
              checked: false,
            },
          ],
        },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      checked: false,
      children: [
        {
          id: "projects-new",
          label: "New Project",
          checked: false,
        },
        {
          id: "projects-delete",
          label: "Delete",
          checked: false,
        },
        {
          id: "projects-view-details",
          label: "View Details",
          checked: false,
          children: [
            {
              id: "projects-view-details-overview",
              label: "Overview",
              checked: false,
              children: [
                {
                  id: "projects-calendar-add",
                  label: "Add Event",
                  checked: false,
                },
              ],
            },
            {
              id: "projects-view-details-task",
              label: "Task",
              checked: false,
              children: [
                {
                  id: "projects-task-create",
                  label: "Create Task",
                  checked: false,
                },
                {
                  id: "projects-task-list",
                  label: "List",
                  checked: false,
                  children: [
                    {
                      id: "projects-task-list-action",
                      label: "Action",
                      checked: false,
                      children: [
                        {
                          id: "projects-task-list-action-view",
                          label: "View",
                          checked: false,
                        },
                        {
                          id: "projects-task-list-action-edit",
                          label: "Edit",
                          checked: false,
                        },
                        {
                          id: "projects-task-list-action-delete",
                          label: "Delete",
                          checked: false,
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "projects-task-board",
                  label: "Board",
                  checked: false,
                },
                {
                  id: "projects-task-timeline",
                  label: "Timeline",
                  checked: false,
                },
              ],
            },
            {
              id: "projects-view-details-budget",
              label: "Budget",
              checked: false,
              children: [
                {
                  id: "projects-budget-add",
                  label: "Add Item",
                  checked: false,
                },
                {
                  id: "projects-budget-export",
                  label: "Export CSV",
                  checked: false,
                },
              ],
            },
            {
              id: "projects-view-details-documents",
              label: "Documents",
              checked: false,
            },
            {
              id: "projects-view-details-team",
              label: "Team",
              checked: false,
              children: [
                {
                  id: "projects-team-add",
                  label: "Add Member",
                  checked: false,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      checked: false,
      children: [
        { id: "finance-Export", label: "Export CSV", checked: false },
        { id: "finance-policy", label: "EAC Policy", checked: false },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      checked: false,
    },
    {
      id: "documents",
      label: "Documents",
      checked: false,
      children: [
        { id: "documents-upload", label: "Upload", checked: false },
        { id: "documents-bulk-upload", label: "Bulk Upload", checked: false },
      ],
    },
  ];

  const fetchRoles = async () => {
    if (!selectedBrandId) return;

    setLoading(true);
    try {
      const data = await apiClient.get(`/api/roles/brand/${selectedBrandId}`);
      setRoles(data);
      if (data.length > 0) {
        setSelectedRoleId(data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const areAllPermissionsSelected = () => {
    const checkAll = (perms: Permission[]): boolean => {
      return perms.every((perm) => {
        if (perm.children) {
          return perm.checked && checkAll(perm.children);
        }
        return perm.checked;
      });
    };
    return checkAll(permissions);
  };

  const handleSelectAll = () => {
    const allSelected = areAllPermissionsSelected();
    const updateAll = (perms: Permission[]): Permission[] => {
      return perms.map((perm) => ({
        ...perm,
        checked: !allSelected,
        children: perm.children ? updateAll(perm.children) : undefined,
      }));
    };
    setPermissions(updateAll(permissions));
  };

  const handlePermissionToggle = (path: string[]) => {
    const updatePermission = (
      perms: Permission[],
      currentPath: string[],
      parentPath: string[] = [],
    ): Permission[] => {
      if (currentPath.length === 0) return perms;

      const [current, ...rest] = currentPath;
      return perms.map((perm) => {
        if (perm.id === current) {
          if (rest.length === 0) {
            // This is the permission being toggled

            // Check if trying to check a child but parent is unchecked
            if (!perm.checked && parentPath.length > 0) {
              // Find parent and check if it's checked
              const parentChecked = isParentChecked(permissions, parentPath);
              if (!parentChecked) {
                const parentLabel = getParentLabel(permissions, parentPath);
                // alert(
                //   `Please enable "${parentLabel}" first before selecting its sub-items`,
                // );
                return perm;
              }
            }

            const newChecked = !perm.checked;
            return {
              ...perm,
              checked: newChecked,
              children: perm.children
                ? perm.children.map((child) =>
                    updateAllChildren(child, newChecked),
                  )
                : undefined,
            };
          } else {
            // Recurse deeper
            const newChildren = perm.children
              ? updatePermission(perm.children, rest, [...parentPath, current])
              : undefined;
            return {
              ...perm,
              children: newChildren,
            };
          }
        }
        return perm;
      });
    };

    const updateAllChildren = (
      perm: Permission,
      checked: boolean,
    ): Permission => {
      return {
        ...perm,
        checked,
        children: perm.children
          ? perm.children.map((child) => updateAllChildren(child, checked))
          : undefined,
      };
    };

    const isParentChecked = (perms: Permission[], path: string[]): boolean => {
      if (path.length === 0) return true;
      const [current, ...rest] = path;
      const parent = perms.find((p) => p.id === current);
      if (!parent) return false;
      // Skip check for title items (they're just headers)
      if (parent.isTitle) return true;
      if (!parent.checked) return false;
      if (rest.length === 0) return true;
      return parent.children ? isParentChecked(parent.children, rest) : false;
    };

    const getParentLabel = (perms: Permission[], path: string[]): string => {
      if (path.length === 0) return "";
      const [current, ...rest] = path;
      const parent = perms.find((p) => p.id === current);
      if (!parent) return "";
      if (rest.length === 0) return parent.label;
      return parent.children
        ? getParentLabel(parent.children, rest)
        : parent.label;
    };

    setPermissions(updatePermission(permissions, path));
  };

  const handleSave = async () => {
    if (!selectedRoleId) {
      alert("Please select a role");
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/api/roles/${selectedRoleId}`, { permissions });
      alert("Permissions updated successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      alert(error?.response?.data?.message || "Failed to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRoleName.trim() || !selectedBrandId) {
      alert("Role name and brand selection are required");
      return;
    }

    setSaving(true);
    try {
      const data = await apiClient.post(`/api/roles`, {
        name: newRoleName,
        brandId: selectedBrandId,
        permissions: initialPermissions,
      });
      await fetchRoles();
      if (data.role && data.role._id) {
        setSelectedRoleId(data.role._id);
      }
      setNewRoleName("");
      setShowAddRoleInput(false);
      alert("Role created successfully!");
    } catch (error: any) {
      console.error("Error creating role:", error);
      alert(error?.response?.data?.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  // Fetch all non-admin users
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data =
        await apiClient.get<
          {
            id: string;
            name: string;
            email: string;
            roleId: string | null;
            roleRequestPending?: boolean;
          }[]
        >("/api/admin/users");
      setUsers(data);

      // Auto-scroll to highlighted user after data loads
      if (highlightUserId && highlightedUserRef.current) {
        setTimeout(() => {
          highlightedUserRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    } catch (error: any) {
      console.error("Error fetching users:", error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Assign selected role to a user
  const handleAssignUser = async (userId: string) => {
    setAssigningUserId(userId);
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, {
        roleId: selectedRoleId,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, roleId: selectedRoleId } : u,
        ),
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to assign role");
    } finally {
      setAssigningUserId(null);
    }
  };

  // Remove role assignment from a user
  const handleUnassignUser = async (userId: string) => {
    setAssigningUserId(userId);
    try {
      await apiClient.put(`/api/admin/users/${userId}/role`, { roleId: null });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, roleId: null } : u)),
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Failed to remove role");
    } finally {
      setAssigningUserId(null);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (
      !window.confirm(`Are you sure you want to delete the role "${roleName}"?`)
    ) {
      return;
    }

    setSaving(true);
    try {
      await apiClient.delete(`/api/roles/${roleId}`);
      alert("Role deleted successfully!");
      if (selectedRoleId === roleId) {
        setSelectedRoleId("");
      }
      await fetchRoles();
    } catch (error: any) {
      console.error("Error deleting role:", error);
      alert(error?.response?.data?.message || "Failed to delete role");
    } finally {
      setSaving(false);
    }
  };

  const renderPermissionItem = (
    permission: Permission,
    level: number = 0,
    path: string[] = [],
    isLast: boolean = false,
  ) => {
    const currentPath = [...path, permission.id];
    const hasChildren = permission.children && permission.children.length > 0;
    const isTitle = permission.isTitle;

    const indent = 32;
    const paddingLeft = level * indent;

    // If this is a title item, render without checkbox
    if (isTitle) {
      return (
        <div key={permission.id} style={{ position: "relative" }}>
          <div
            style={{
              paddingLeft: `${paddingLeft}px`,
              padding: "12px 0 8px 0",
              fontWeight: 700,
              fontSize: "15px",
              color: "#111827",
            }}
          >
            {permission.label}
          </div>

          {/* Render children */}
          {hasChildren && (
            <div>
              {permission.children!.map((child) =>
                renderPermissionItem(child, level + 1, currentPath),
              )}
            </div>
          )}
        </div>
      );
    }

    // Regular permission item with checkbox
    return (
      <div key={permission.id} style={{ position: "relative" }}>
        <div
          style={{
            position: "relative",
            paddingLeft: `${paddingLeft}px`,
            display: "flex",
            alignItems: "center",
          }}
        >
          {level > 0 && (
            <>
              {/* Vertical */}
              <div
                style={{
                  position: "absolute",
                  left: `${paddingLeft - indent}px`,
                  top: 0,
                  bottom: 0,
                  width: "2px",
                  backgroundColor: "#e5e7eb",
                }}
              />

              {/* Horizontal */}
              <div
                style={{
                  position: "absolute",
                  left: `${paddingLeft - indent}px`,
                  top: "50%",
                  width: `${indent}px`,
                  height: "2px",
                  backgroundColor: "#e5e7eb",
                }}
              />
            </>
          )}

          <label
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 0",
              cursor: "pointer",
              userSelect: "none",
              fontWeight: level === 0 ? 600 : level === 1 ? 500 : 400,
              fontSize: level === 0 ? "15px" : "14px",
              color: level === 0 ? "#111827" : "#374151",
            }}
          >
            <input
              type="checkbox"
              checked={permission.checked}
              onChange={() => handlePermissionToggle(currentPath)}
              style={{
                width: "18px",
                height: "18px",
                marginRight: "10px",
                cursor: "pointer",
                accentColor: "#3b82f6",
                flexShrink: 0,
              }}
            />
            <span>{permission.label}</span>
          </label>
        </div>

        {/* Render children */}
        {hasChildren && (
          <div>
            {permission.children!.map((child) =>
              renderPermissionItem(child, level + 1, currentPath),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "800px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: window.innerWidth < 640 ? "column" : "row",
            justifyContent: "space-between",
            alignItems: window.innerWidth < 640 ? "stretch" : "center",
            gap: window.innerWidth < 640 ? "12px" : "16px",
            padding: window.innerWidth < 640 ? "20px" : "24px 28px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              fontSize: window.innerWidth < 640 ? "18px" : "20px",
              fontWeight: 600,
              color: "#111827",
              margin: 0,
            }}
          >
            Role & Permissions
          </h2>
          <button
            onClick={() => setShowAddRoleInput(!showAddRoleInput)}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              width: window.innerWidth < 640 ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#2563eb";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {showAddRoleInput ? "Cancel" : "Add Role"}
          </button>
        </div>

        {/* Add Role Section - Expandable */}
        {showAddRoleInput && (
          <div
            style={{
              padding: window.innerWidth < 640 ? "16px 20px" : "20px 28px",
              background: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Role Name
            </label>
            <div
              style={{
                display: "flex",
                flexDirection: window.innerWidth < 640 ? "column" : "row",
                gap: "12px",
              }}
            >
              <input
                type="text"
                placeholder="Enter role name"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddRole()}
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  width: window.innerWidth < 640 ? "100%" : "auto",
                }}
                autoFocus
              />
              <button
                onClick={handleAddRole}
                disabled={saving || !newRoleName.trim()}
                style={{
                  padding: "10px 24px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: saving || !newRoleName.trim() ? 0.5 : 1,
                  whiteSpace: "nowrap",
                  width: window.innerWidth < 640 ? "100%" : "auto",
                }}
              >
                {saving ? "Creating..." : "Create Role"}
              </button>
            </div>
          </div>
        )}

        {/* Controls Row */}
        <div
          style={{
            padding: window.innerWidth < 640 ? "16px 20px" : "20px 28px",
            borderBottom: "1px solid #e5e7eb",
            display: "grid",
            gridTemplateColumns: window.innerWidth < 768 ? "1fr" : "1fr 1fr",
            gap: "16px",
          }}
        >
          {/* Select Role - Custom Dropdown */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Select Role
            </label>
            <div
              ref={dropdownRef}
              style={{
                position: "relative",
              }}
            >
              {/* Dropdown Button */}
              <button
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                disabled={roles.length === 0}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: roles.length === 0 ? "#9ca3af" : "#111827",
                  background: "white",
                  cursor: roles.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  opacity: roles.length === 0 ? 0.5 : 1,
                }}
              >
                <span>
                  {selectedRoleId
                    ? roles.find((r) => r._id === selectedRoleId)?.name ||
                      "Select Role"
                    : "Select Role"}
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: isRoleDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {/* Dropdown List */}
              {isRoleDropdownOpen && roles.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {roles.map((role) => (
                    <div
                      key={role._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        backgroundColor:
                          selectedRoleId === role._id ? "#f0f9ff" : "white",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRoleId !== role._id) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selectedRoleId === role._id ? "#f0f9ff" : "white";
                      }}
                    >
                      <span
                        onClick={() => {
                          setSelectedRoleId(role._id);
                          setIsRoleDropdownOpen(false);
                        }}
                        style={{
                          flex: 1,
                          fontSize: "14px",
                          color: "#111827",
                          fontWeight: selectedRoleId === role._id ? 500 : 400,
                        }}
                      >
                        {role.name}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role._id, role.name);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          padding: "4px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          color: "#ef4444",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = "#dc2626";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        title="Delete role"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Select Brand */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 500,
                color: "#374151",
                marginBottom: "8px",
              }}
            >
              Select Brand
            </label>
            <div
              ref={brandDropdownRef}
              style={{
                position: "relative",
              }}
            >
              {/* Dropdown Button */}
              <button
                onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#111827",
                  background: "white",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {selectedBrandId
                    ? brands.find((b) => b._id === selectedBrandId)?.name ||
                      "All Brands"
                    : "All Brands"}
                </span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: isBrandDropdownOpen
                      ? "rotate(180deg)"
                      : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                />
              </button>

              {/* Dropdown List */}
              {isBrandDropdownOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "4px",
                    background: "white",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    zIndex: 1000,
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {/* All Brands Option */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "10px 12px",
                      borderBottom: "1px solid #f3f4f6",
                      backgroundColor:
                        selectedBrandId === "" ? "#f0f9ff" : "white",
                      cursor: "pointer",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBrandId !== "") {
                        e.currentTarget.style.backgroundColor = "#f9fafb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        selectedBrandId === "" ? "#f0f9ff" : "white";
                    }}
                    onClick={() => {
                      setSelectedBrandId("");
                      setSelectedRoleId("");
                      setIsBrandDropdownOpen(false);
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#111827",
                        fontWeight: selectedBrandId === "" ? 500 : 400,
                      }}
                    >
                      All Brands
                    </span>
                  </div>

                  {/* Brand Options */}
                  {brands.map((brand) => (
                    <div
                      key={brand._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "10px 12px",
                        borderBottom: "1px solid #f3f4f6",
                        backgroundColor:
                          selectedBrandId === brand._id ? "#f0f9ff" : "white",
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (selectedBrandId !== brand._id) {
                          e.currentTarget.style.backgroundColor = "#f9fafb";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          selectedBrandId === brand._id ? "#f0f9ff" : "white";
                      }}
                      onClick={() => {
                        setSelectedBrandId(brand._id);
                        setSelectedRoleId("");
                        setIsBrandDropdownOpen(false);
                      }}
                    >
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#111827",
                          fontWeight: selectedBrandId === brand._id ? 500 : 400,
                        }}
                      >
                        {brand.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Permissions Section */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: window.innerWidth < 640 ? "16px 20px" : "20px 28px",
          }}
        >
          {/* Select All */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 0",
              cursor: "pointer",
              userSelect: "none",
              fontWeight: 600,
              fontSize: "15px",
              borderBottom: "2px solid #e5e7eb",
              marginBottom: "16px",
            }}
          >
            <input
              type="checkbox"
              checked={areAllPermissionsSelected()}
              onChange={handleSelectAll}
              style={{
                width: "18px",
                height: "18px",
                marginRight: "10px",
                cursor: "pointer",
                accentColor: "#3b82f6",
                flexShrink: 0,
              }}
            />
            <span>Select All</span>
          </label>

          {/* Permission Tree */}
          {permissions.map((permission) => renderPermissionItem(permission))}
        </div>

        {/* Assign Users Section */}
        {selectedRoleId && (
          <div
            style={{
              padding: "20px 28px",
              borderTop: "1px solid #e5e7eb",
              background: "#fafafa",
            }}
          >
            <h3
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#111827",
                marginBottom: "12px",
              }}
            >
              Assign Users to This Role
            </h3>

            {loadingUsers ? (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                Loading users...
              </p>
            ) : users.length === 0 ? (
              <p style={{ color: "#6b7280", fontSize: "14px" }}>
                No users found.
              </p>
            ) : (
              <div
                ref={userListRef}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {users.map((u) => {
                  const isAssigned = u.roleId === selectedRoleId;
                  const isHighlighted = u.id === highlightUserId;
                  const isPending = u.roleRequestPending && !u.roleId;
                  return (
                    <div
                      key={u.id}
                      ref={isHighlighted ? highlightedUserRef : null}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        background: isAssigned
                          ? "#f0fdf4"
                          : isHighlighted || isPending
                            ? "#fef3c7"
                            : "#ffffff",
                        borderRadius: "8px",
                        border: `2px solid ${isAssigned ? "#86efac" : isHighlighted || isPending ? "#fbbf24" : "#e5e7eb"}`,
                        position: "relative",
                        animation: isHighlighted
                          ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) 2"
                          : "none",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: 500,
                            fontSize: "14px",
                            color: "#111827",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          {u.name}
                          {isPending && (
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: "#d97706",
                                background: "#fef3c7",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                border: "1px solid #fbbf24",
                              }}
                            >
                              PENDING REQUEST
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12px", color: "#6b7280" }}>
                          {u.email}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          isAssigned
                            ? handleUnassignUser(u.id)
                            : handleAssignUser(u.id)
                        }
                        disabled={assigningUserId === u.id}
                        style={{
                          padding: "6px 14px",
                          background: isAssigned ? "#fee2e2" : "#3b82f6",
                          color: isAssigned ? "#dc2626" : "white",
                          border: "none",
                          borderRadius: "6px",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor:
                            assigningUserId === u.id
                              ? "not-allowed"
                              : "pointer",
                          opacity: assigningUserId === u.id ? 0.6 : 1,
                          minWidth: "80px",
                        }}
                      >
                        {assigningUserId === u.id
                          ? "..."
                          : isAssigned
                            ? "Unassign"
                            : "Assign"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: window.innerWidth < 640 ? "column-reverse" : "row",
            justifyContent: "flex-end",
            gap: "12px",
            padding: window.innerWidth < 640 ? "16px 20px" : "20px 28px",
            borderTop: "1px solid #e5e7eb",
            background: "#f9fafb",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "10px 20px",
              background: "white",
              color: "#6b7280",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              width: window.innerWidth < 640 ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
              e.currentTarget.style.borderColor = "#9ca3af";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "white";
              e.currentTarget.style.borderColor = "#d1d5db";
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 20px",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              opacity: saving ? 0.5 : 1,
              width: window.innerWidth < 640 ? "100%" : "auto",
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.background = "#2563eb";
                e.currentTarget.style.transform = "translateY(-1px)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#3b82f6";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessControlModal;
