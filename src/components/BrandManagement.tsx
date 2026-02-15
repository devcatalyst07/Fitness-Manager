import React, { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import BrandDashboardModal from "@/components/BrandDashboardModal";
import AccessControlModal from "@/components/Accesscontrolmodal";
import { apiClient } from "@/lib/axios";

interface Brand {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface BrandManagementProps {
  brands: Brand[];
  onRefresh: () => void;
  onBrandSelect: (brand: Brand) => void;
  selectedBrandId?: string;
  canAddBrand?: boolean;
  canAccessControl?: boolean;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canAddUser?: boolean;
}

export default function BrandManagement({
  brands,
  onRefresh,
  onBrandSelect,
  selectedBrandId,
  canAddBrand = true,
  canAccessControl = true,
  canView = true,
  canEdit = true,
  canDelete = true,
  canAddUser = false,
}: BrandManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [isAccessControlOpen, setIsAccessControlOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);

  const handleCreateBrand = async () => {
    if (!formData.name.trim()) {
      alert("Brand name is required");
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/brands', formData);
      setIsCreateModalOpen(false);
      setFormData({ name: "", description: "" });
      onRefresh();
      alert("Brand created successfully!");
    } catch (error: any) {
      console.error("Create brand error:", error);
      const message = error?.response?.data?.message || "Failed to create brand";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBrand = async () => {
    if (!selectedBrand || !selectedBrand.name.trim()) {
      alert("Brand name is required");
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/api/brands/${selectedBrand._id}`, {
        name: selectedBrand.name,
        description: selectedBrand.description,
      });
      setIsEditModalOpen(false);
      setSelectedBrand(null);
      onRefresh();
      alert("Brand updated successfully!");
    } catch (error: any) {
      console.error("Update brand error:", error);
      const message = error?.response?.data?.message || "Failed to update brand";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this brand? This action cannot be undone.")) {
      return;
    }

    try {
      await apiClient.delete(`/api/brands/${brandId}`);
      onRefresh();
      alert("Brand deleted successfully!");
    } catch (error: any) {
      console.error("Delete brand error:", error);
      const message = error?.response?.data?.message || "Failed to delete brand";
      alert(message);
    }
  };

  const handleEditClick = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBrand({ ...brand });
    setIsEditModalOpen(true);
  };

  const handleOpenDashboard = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBrand(brand);
    setIsDashboardModalOpen(true);
  };

  const handleBrandClick = (brand: Brand) => {
    onBrandSelect(brand);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Brand Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a brand to view threads or click dashboard icon for projects
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAddBrand && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Add Brand</span>
            </button>
          )}
          {canAccessControl && (
            <button
              onClick={() => setIsAccessControlOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={18} />
              <span>Access Control</span>
            </button>
          )}
        </div>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="font-semibold mb-2">No brands yet</p>
          <p className="text-sm">Create your first brand to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div
              key={brand._id}
              onClick={() => handleBrandClick(brand)}
              className={`border rounded-lg p-4 transition-all cursor-pointer ${
                selectedBrandId === brand._id
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 hover:shadow-md hover:border-blue-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    {brand.name}
                    {selectedBrandId === brand._id && (
                      <MessageSquare size={16} className="text-blue-600" />
                    )}
                  </h3>
                </div>
                <div className="flex gap-2">
                  {canView && (
                    <button
                      onClick={(e) => handleOpenDashboard(brand, e)}
                      className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 rounded transition-colors"
                      title="Open Dashboard"
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={(e) => handleEditClick(brand, e)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 rounded transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={(e) => handleDeleteBrand(brand._id, e)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              {brand.description && (
                <p className="text-sm text-gray-600 mb-3">{brand.description}</p>
              )}
              <div className="text-xs text-gray-500">
                <p>Created by {brand.createdBy?.name}</p>
                <p>{new Date(brand.createdAt).toLocaleDateString()}</p>
              </div>
              {selectedBrandId === brand._id && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <MessageSquare size={12} />
                    Viewing threads for this brand
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create New Brand</h2>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Westfield Group"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Brief description about the brand..."
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleCreateBrand} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                  {saving ? "Creating..." : "Create Brand"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedBrand && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Edit Brand</h2>
                <button onClick={() => { setIsEditModalOpen(false); setSelectedBrand(null); }} className="text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedBrand.name}
                    onChange={(e) => setSelectedBrand({ ...selectedBrand, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                  <textarea
                    value={selectedBrand.description || ""}
                    onChange={(e) => setSelectedBrand({ ...selectedBrand, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => { setIsEditModalOpen(false); setSelectedBrand(null); }} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button onClick={handleUpdateBrand} disabled={saving} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDashboardModalOpen && selectedBrand && (
        <BrandDashboardModal
          brand={selectedBrand}
          isOpen={isDashboardModalOpen}
          onClose={() => { setIsDashboardModalOpen(false); setSelectedBrand(null); }}
          canAddUser={canAddUser}
        />
      )}

      {isAccessControlOpen && (
        <AccessControlModal
          isOpen={isAccessControlOpen}
          onClose={() => setIsAccessControlOpen(false)}
          brands={brands}
        />
      )}
    </div>
  );
}