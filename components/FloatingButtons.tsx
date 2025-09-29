

import React, { useState, useEffect } from 'react';
import { HomeIcon, ArrowUpIcon } from './Icons';

interface FloatingButtonsProps {
  onGoHome: () => void;
  showHomeButton: boolean;
}

const FloatingButtons: React.FC<FloatingButtonsProps> = ({ onGoHome, showHomeButton }) => {
  const [isScrollUpVisible, setScrollUpVisible] = useState(false);

  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setScrollUpVisible(true);
    } else {
      setScrollUpVisible(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-5 sm:left-5 space-y-2 sm:space-y-3 z-50">
      {showHomeButton && (
        <button
          onClick={onGoHome}
          aria-label="العودة للصفحة الرئيسية"
          className="text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 transform hover:scale-110 btn-primary"
        >
          <HomeIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}
      {isScrollUpVisible && (
        <button
          onClick={scrollToTop}
          aria-label="العودة للأعلى"
          className="bg-gray-700 text-white w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-110"
        >
          <ArrowUpIcon className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      )}
    </div>
  );
};

export default FloatingButtons;