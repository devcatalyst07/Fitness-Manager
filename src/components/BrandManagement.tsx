import React, { useState } from "react";
import { Plus, Edit, Trash2, X, MessageSquare, ExternalLink } from "lucide-react";
import BrandDashboardModal from "./BrandDashboardModal";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

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
}

export default function BrandManagement({
  brands,
  onRefresh,
  onBrandSelect,
  selectedBrandId,
}: BrandManagementProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDashboardModalOpen, setIsDashboardModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);

  const handleCreateBrand = async () => {
    if (!formData.name.trim()) {
      alert("Brand name is required");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        setFormData({ name: "", description: "" });
        onRefresh();
        alert("Brand created successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to create brand");
      }
    } catch (error) {
      console.error("Create brand error:", error);
      alert("Failed to create brand");
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
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/api/brands/${selectedBrand._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: selectedBrand.name,
            description: selectedBrand.description,
            isActive: selectedBrand.isActive,
          }),
        },
      );

      if (response.ok) {
        setIsEditModalOpen(false);
        setSelectedBrand(null);
        onRefresh();
        alert("Brand updated successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to update brand");
      }
    } catch (error) {
      console.error("Update brand error:", error);
      alert("Failed to update brand");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBrand = async (brandId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (
      !confirm(
        "Are you sure you want to delete this brand? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/brands/${brandId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onRefresh();
        alert("Brand deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to delete brand");
      }
    } catch (error) {
      console.error("Delete brand error:", error);
      alert("Failed to delete brand");
    }
  };

  const handleBrandClick = (brand: Brand) => {
    // Filter threads by this brand
    onBrandSelect(brand);
  };

  const handleOpenDashboard = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBrand(brand);
    setIsDashboardModalOpen(true);
  };

  const handleEditClick = (brand: Brand, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBrand(brand);
    setIsEditModalOpen(true);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Brand Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select a brand to view threads or click dashboard icon for projects
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          <span>Add Brand</span>
        </button>
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
                  <button
                    onClick={(e) => handleOpenDashboard(brand, e)}
                    className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 rounded transition-colors"
                    title="Open Dashboard"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    onClick={(e) => handleEditClick(brand, e)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 rounded transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteBrand(brand._id, e)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              {brand.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {brand.description}
                </p>
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
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-black"
                >
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="e.g., Westfield Group"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Brief description about the brand..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBrand}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
                >
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
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedBrand(null);
                  }}
                  className="text-gray-400 hover:text-black"
                >
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
                    onChange={(e) =>
                      setSelectedBrand({
                        ...selectedBrand,
                        name: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={selectedBrand.description || ""}
                    onChange={(e) =>
                      setSelectedBrand({
                        ...selectedBrand,
                        description: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={selectedBrand.isActive}
                    onChange={(e) =>
                      setSelectedBrand({
                        ...selectedBrand,
                        isActive: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedBrand(null);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateBrand}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-300 hover:bg-blue-700 transition-colors"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand Dashboard Modal */}
      {isDashboardModalOpen && selectedBrand && (
        <BrandDashboardModal
          brand={selectedBrand}
          isOpen={isDashboardModalOpen}
          onClose={() => {
            setIsDashboardModalOpen(false);
            setSelectedBrand(null);
          }}
        />
      )}
    </div>
  );
}