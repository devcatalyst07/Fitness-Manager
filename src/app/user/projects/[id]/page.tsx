"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import FitoutLoadingSpinner from "@/components/FitoutLoadingSpinner";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://fitout-manager-api.vercel.app";

interface Permission {
  id: string;
  label: string;
  checked: boolean;
  children?: Permission[];
}

const hasPermission = (
  permissionId: string,
  permissions: Permission[],
): boolean => {
  const check = (perms: Permission[]): boolean => {
    for (const perm of perms) {
      if (perm.id === permissionId && perm.checked) return true;
      if (perm.children && check(perm.children)) return true;
    }
    return false;
  };
  return check(permissions);
};

export default function UserProjectPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const redirectToFirstAvailableTab = async () => {
      try {
        const roleId = localStorage.getItem("roleId");
        if (!roleId) {
          router.replace("/user/dashboard");
          return;
        }

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/roles/${roleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          router.replace("/user/dashboard");
          return;
        }

        const roleData = await response.json();
        const permissions = roleData.permissions;

        console.log("🔍 Checking available tabs...");

        // CHECK TABS IN ORDER - REDIRECT TO FIRST AVAILABLE
        const tabs = [
          { id: "projects-view-details-overview", path: "overview" },
          { id: "projects-view-details-task", path: "tasks" },
          { id: "projects-view-details-budget", path: "budget" },
          { id: "projects-view-details-documents", path: "documents" },
          { id: "projects-view-details-team", path: "team" },
        ];

        for (const tab of tabs) {
          if (hasPermission(tab.id, permissions)) {
            console.log(`Redirecting to: ${tab.path}`);
            router.replace(`/user/projects/${params.id}/${tab.path}`);
            return;
          }
        }

        console.log("No tabs available");
        alert("You do not have permission to view any project tabs.");
        router.replace("/user/projects");
      } catch (error) {
        console.error("Error checking permissions:", error);
        router.replace("/user/dashboard");
      } finally {
        setLoading(false);
      }
    };

    redirectToFirstAvailableTab();
  }, [params.id, router]);

  return <FitoutLoadingSpinner />;
}