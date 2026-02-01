import React from "react";
import { List, LayoutGrid, Calendar } from "lucide-react";

interface TaskViewToggleProps {
  viewMode: "list" | "board" | "timeline";
  onViewChange: (mode: "list" | "board" | "timeline") => void;
  canViewList?: boolean;
  canViewBoard?: boolean;
  canViewTimeline?: boolean;
}

export default function TaskViewToggle({
  viewMode,
  onViewChange,
  canViewList = true,
  canViewBoard = true,
  canViewTimeline = true,
}: TaskViewToggleProps) {
  return (
    <div className="flex gap-2 bg-white border border-gray-200 rounded-lg p-1 text-black mb-6">
      {canViewList && (
        <button
          onClick={() => onViewChange("list")}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-all ${
            viewMode === "list"
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <List size={18} />
          <span>List</span>
        </button>
      )}
      {canViewBoard && (
        <button
          onClick={() => onViewChange("board")}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-all ${
            viewMode === "board"
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <LayoutGrid size={18} />
          <span>Board</span>
        </button>
      )}
      {canViewTimeline && (
        <button
          onClick={() => onViewChange("timeline")}
          className={`px-4 py-2 rounded flex items-center gap-2 transition-all ${
            viewMode === "timeline"
              ? "bg-gray-100 text-gray-900 font-medium"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Calendar size={18} />
          <span>Timeline</span>
        </button>
      )}
    </div>
  );
}
