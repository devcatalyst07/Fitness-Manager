'use client';

import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { PricingCard } from '../components/PricingCards';

type ModalType = 'login' | 'register' | null;

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);

  const handleLoginClick = () => {
    setModalType('login');
    setIsModalOpen(true);
  };

  const handlePlanSelect = () => {
    setModalType('login');
    setIsModalOpen(true);
  };

  const handleSwitchToRegister = () => {
    setModalType('register');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setModalType(null), 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onLoginClick={handleLoginClick} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-black mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect subscription for your team
          </p>
        </div>

        <div className="flex max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
          <PricingCard
            title="Starter"
            seats="3 seats"
            price="$29/mo"
            features={[
              'Up to 3 team members',
              'Basic features',
              'Email support',
              '5GB storage',
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
              'Up to 10 team members',
              'Advanced features',
              'Priority support',
              '50GB storage',
            ]}
            onSelect={handlePlanSelect}
            color="bg-gradient-to-br from-cyan-400 to-blue-500"
          />

          <PricingCard
            title="Enterprise"
            seats="Unlimited seats"
            price='$120/mo'
            features={[
              'Unlimited team members',
              'All features included',
              'Dedicated support',
              'Unlimited storage',
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
    </div>
  );
}