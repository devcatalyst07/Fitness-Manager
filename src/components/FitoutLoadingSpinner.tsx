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
            className="w-20 h-20 flex items-center justify-center animate-pulse"
            style={{ animationDuration: '2s' }}
          >
            <img 
              src="/files/FM_ICON.svg" 
              alt="Fitout Manager" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}