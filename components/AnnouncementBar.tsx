

import React from 'react';

interface AnnouncementBarProps {
  content: string;
  link?: string;
  label: string;
  bgColor: string;
}

const AnnouncementBar: React.FC<AnnouncementBarProps> = ({ content, link, label, bgColor }) => {
  const BarContent = () => (
    <div className="mt-6 p-2 sm:p-3 rounded-lg shadow-md overflow-hidden" style={{ backgroundColor: bgColor }}>
      <div className="relative flex items-center">
        <div className="flex items-center">
           <span className="font-bold text-sm sm:text-lg border-2 rounded-md py-1 px-2 sm:px-3 animate-borderColorPulse whitespace-nowrap" style={{ color: 'var(--color-primary-focus)' }}>
            {label}
          </span>
          <p className="mr-2 sm:mr-4 text-gray-300 text-sm sm:text-base">{content}</p>
        </div>
      </div>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" aria-label="Announcement">
        <BarContent />
      </a>
    );
  }

  return <BarContent />;
};

export default AnnouncementBar;