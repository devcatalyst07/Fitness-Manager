"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export const AdminHeader: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const name = localStorage.getItem("userName") || "Admin";
    setUserName(name);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("roleId");
    localStorage.removeItem("userRole");
    router.push("/");
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 bg-white border-b border-gray-200 z-20 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
      <div className="flex-auto max-w-xs sm:ml-0 ml-12 mt-2 sm:mt-0">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="hidden sm:block text-gray-700 text-sm font-medium whitespace-nowrap">
          <strong>{`Welcome, ${userName}. You are now signed in.`}</strong>
        </div>

        <button className="p-2 hover:bg-gray-100 rounded-lg relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-1 p-2 hover:bg-gray-100 rounded-lg"
          >
            <User size={20} />
            <ChevronDown
              size={16}
              className={`${dropdownOpen ? "rotate-180" : ""} transition-transform`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="sm:hidden absolute right-4 top-16 text-gray-700 text-sm font-medium">
        <strong>{`Welcome, ${userName}.`}</strong>
      </div>
    </header>
  );
};

export default AdminHeader;
