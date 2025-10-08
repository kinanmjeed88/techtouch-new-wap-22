import React from 'react';
import type { Profile } from '../types';
import { SendIcon } from './Icons';

interface ProfileModalProps {
  profile: Profile;
  logoUrl: string;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, logoUrl, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative p-6 sm:p-8 rounded-2xl shadow-xl w-full max-w-sm text-center transform transition-transform duration-300 scale-95 hover:scale-100"
        style={{ backgroundColor: 'var(--color-header-bg)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          aria-label="إغلاق"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <img
          src={logoUrl}
          alt="Profile"
          className="w-28 h-28 sm:w-32 sm:h-32 rounded-full mx-auto mb-4 border-4"
          style={{ borderColor: 'var(--color-primary)' }}
        />

        {profile.name && (
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--color-site-name)' }}>
            {profile.name}
          </h2>
        )}

        {(profile.age || profile.city) && (
          <p className="text-gray-400 mt-1">
            {profile.city}{profile.age && `, ${profile.age} عاماً`}
          </p>
        )}

        {profile.bio && (
          <p className="text-gray-300 my-4 text-sm sm:text-base">
            {profile.bio}
          </p>
        )}

        {profile.contactLink && (
          <a
            href={profile.contactLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 btn-primary mt-4"
          >
            <SendIcon className="w-5 h-5" />
            <span>تواصل معي</span>
          </a>
        )}
      </div>
    </div>
  );
};

export default ProfileModal;