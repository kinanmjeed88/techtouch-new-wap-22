

import React from 'react';
import { SearchIcon, PhotoIcon } from './Icons';

interface HeaderProps {
  onSearch: (query: string) => void;
  logoUrl: string;
  siteName: string;
  onGoHome: () => void;
  onGoToImageEditor: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, logoUrl, siteName, onGoHome, onGoToImageEditor }) => {
  return (
    <header 
      className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-lg shadow-lg"
      style={{ backgroundColor: 'var(--color-header-bg)' }}
    >
      <button onClick={onGoHome} className="flex items-center space-x-4 space-x-reverse mb-4 sm:mb-6 group">
        {logoUrl && (
            <img
            src={logoUrl}
            alt="Site Logo"
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 animate-borderColorPulse transition-transform duration-300 group-hover:scale-105"
            style={{ borderColor: 'var(--color-primary)' }}
            />
        )}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white transition-colors duration-300 group-hover:text-red-400 text-primary-hover">{siteName}</h1>
      </button>
      <div className="flex w-full max-w-lg items-center gap-2 sm:gap-3">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="ابحث عن منشور..."
            onChange={(e) => onSearch(e.target.value)}
            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-full py-2 sm:py-3 pr-10 sm:pr-12 pl-4 focus:outline-none focus:ring-2 ring-primary text-sm sm:text-base"
            aria-label="Search posts"
          />
          <div className="absolute top-1/2 right-3 sm:right-4 transform -translate-y-1/2">
            <SearchIcon />
          </div>
        </div>
        <button 
          onClick={onGoToImageEditor} 
          title="تعديل الصور بالذكاء الاصطناعي" 
          aria-label="AI Image Editor"
          className="p-2 sm:p-3 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-300 transform hover:scale-110"
        >
          <PhotoIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;