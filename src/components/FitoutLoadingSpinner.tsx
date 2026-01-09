import React from 'react';

export default function FitoutLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Animated Logo */}
        <div className="relative">
          {/* Spinning ring */}
          <div 
            className="absolute inset-0 rounded-2xl border-4 border-blue-200 animate-spin" 
            style={{ 
              width: '80px', 
              height: '80px',
              borderTopColor: '#2563eb',
              animationDuration: '1s'
            }}
          />
          
          {/* Logo container with pulse */}
          <div 
            className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse"
            style={{ animationDuration: '2s' }}
          >
            <span className="text-white font-bold text-2xl">FM</span>
          </div>
        </div>

        {/* Brand text */}
        <div className="text-center">
          <div className="font-bold text-black text-xl">FITOUT</div>
          <div className="font-bold text-black text-base">MANAGER</div>
        </div>

        {/* Loading text with dots animation */}
        <div className="flex items-center gap-1 text-gray-600">
          <span>Loading</span>
          <span className="flex gap-0.5">
            <span className="animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms', animationDuration: '1s' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms', animationDuration: '1s' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  );
}