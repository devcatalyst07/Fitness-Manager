"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "../components/Navbar";
import { AuthModal } from "../components/AuthModal";
import { PricingCard } from "../components/PricingCards";
import FitoutLoadingSpinner from "../components/FitoutLoadingSpinner";

type ModalType = "login" | "register" | null;

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  // If user is logged in, redirect to their dashboard
  useEffect(() => {
    if (authLoading || !user) return;

    if (user.role === "admin") {
      router.replace("/admin/dashboard");
      return;
    }

    if (user.roleId) {
      router.replace("/user/dashboard");
    }
  }, [user, authLoading, router, logout]);

  // If user is logged in without roleId, show waiting screen
  // BUT only after they've sent the role request email (check localStorage flag)
  // This allows the modal to show first and let them input admin email
  if (!authLoading && user && !user.roleId && user.role === "user") {
    const roleRequestSentAt = typeof window !== "undefined" ? localStorage.getItem("roleRequestSentAt") : null;
    if (roleRequestSentAt) {
      return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Pending Role Assignment
          </h1>
          <p className="text-gray-600 mb-6">
            Your account has been created successfully! An admin will review
            your request and assign you a role shortly.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-700">
            <strong>What's next?</strong> Check your email for updates. Once
            your role is assigned, you'll have full access to the platform.
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push("/");
            }}
            className="w-full bg-black text-white py-3 rounded hover:bg-gray-800 transition-colors font-medium"
          >
            Log Out
          </button>
        </div>
      </div>
    );
    }
  }

  const handleLoginClick = () => {
    setModalType("login");
    setIsModalOpen(true);
  };

  const handlePlanSelect = () => {
    setModalType("login");
    setIsModalOpen(true);
  };

  const handleSwitchToRegister = () => {
    setModalType("register");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalType(null), 300);
  };

  // Show spinner ONLY while auth is loading or redirecting to dashboard
  // Don't show spinner if user just registered (needs to fill role request form in modal)
  if (authLoading) {
    return <FitoutLoadingSpinner />;
  }

  // If user is being redirected to dashboard (admin or assigned user), show spinner
  if (user && (user.role === "admin" || user.roleId)) {
    return <FitoutLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={handleLoginClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6">
            Professional Fitout
            <br />
            Project Management
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto mb-16">
            Streamline your retail, hospitality, and healthcare fitout projects
            with intelligent budgeting and multi-tenant organization management.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Budget Management
              </h3>
              <p className="text-gray-600">
                Track costs, manage budgets, and maintain financial control
                across all your projects.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Multi-Tenant Ready
              </h3>
              <p className="text-gray-600">
                Organize projects by brands, regions, and teams with secure data
                separation.
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-black rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-black mb-3">
                Enterprise Grade
              </h3>
              <p className="text-gray-600">
                Built for scale with clean architecture, TypeScript, and modern
                tooling.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg sm:text-xl text-gray-600">
            Select the perfect subscription for your team
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
          <PricingCard
            title="Starter"
            seats="3 seats"
            price="$29/mo"
            features={[
              "Up to 3 team members",
              "Basic features",
              "Email support",
              "5GB storage",
            ]}
            onSelect={handlePlanSelect}
            color="bg-gradient-to-br from-indigo-500 to-purple-600"
            isFirst
          />
          <PricingCard
            title="Team"
            seats="10 seats"
            price="$99/mo"
            features={[
              "Up to 10 team members",
              "Advanced features",
              "Priority support",
              "50GB storage",
            ]}
            onSelect={handlePlanSelect}
            color="bg-gradient-to-br from-cyan-400 to-blue-500"
          />
          <PricingCard
            title="Enterprise"
            seats="Unlimited seats"
            price="$120/mo"
            features={[
              "Unlimited team members",
              "All features included",
              "Dedicated support",
              "Unlimited storage",
            ]}
            isEnterprise
            onSelect={handlePlanSelect}
            color="bg-gradient-to-br from-pink-500 to-rose-500"
            isLast
          />
        </div>
      </main>

      <AuthModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        modalType={modalType}
        onSwitchToRegister={handleSwitchToRegister}
      />

      <footer className="bg-gray-100 border-t border-gray-200 py-4 sm:py-6 mt-1 sm:mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center text-gray-600 gap-1 sm:gap-0">
            <span className="text-sm sm:text-base text-center">
              <span className="font-semibold text-gray-700">
                Fitout Manager
              </span>
              <span className="hidden sm:inline mx-3 sm:mx-5">|</span>
            </span>
            <span className="text-xs sm:text-sm text-center">
              &copy; 2026. All Rights Reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
