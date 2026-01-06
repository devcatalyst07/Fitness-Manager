'use client';

import Image from 'next/image';

interface NavbarProps {
  onLoginClick: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src="/fm-logo.png"
              alt="Fitout Manager Logo"
              width={140}
              height={40}
              priority
              className="object-contain"
            />
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-8">
            <a
              href="#about"
              className="text-gray-700 hover:text-black transition-colors"
            >
              About Us
            </a>

            <button
              onClick={onLoginClick}
              className="bg-black px-6 py-2 text-white transition-colors hover:bg-gray-800"
            >
              Log in
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
}
