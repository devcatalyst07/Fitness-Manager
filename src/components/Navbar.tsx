'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  onLoginClick: () => void;
}

export function Navbar({ onLoginClick }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-white border-b border-gray-200 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Logo */}
          <div className="flex items-center">
            <a href="#">
              <Image
                src="/fm-logo.png"
                alt="Fitout Manager Logo"
                width={140}
                height={40}
                priority
                className="object-contain"
              />
            </a>
          </div>

          {/* Desktop Links */}
          <div className="hidden sm:flex items-center space-x-8">
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

          {/* Mobile Hamburger */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200 shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="#about"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-black hover:bg-gray-50"
            >
              About Us
            </a>

            <button
              onClick={() => { onLoginClick(); setIsOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-md bg-black text-white hover:bg-gray-800 transition"
            >
              Log in
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
