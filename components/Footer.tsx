import React from 'react';
import { FacebookIcon, TiktokIcon, YoutubeIcon, TelegramIcon } from './Icons';
import type { SiteSettings } from '../types';

interface FooterProps {
  socials: SiteSettings['socials'];
}

const Footer: React.FC<FooterProps> = ({ socials }) => {
  const socialLinks = [
    // FIX: Use optional chaining `?.` because the `socials` object can be undefined at runtime.
    { name: 'Facebook', icon: <FacebookIcon />, url: socials?.facebook },
    // FIX: Use optional chaining `?.` because the `socials` object can be undefined at runtime.
    { name: 'TikTok', icon: <TiktokIcon />, url: socials?.tiktok },
    // FIX: Use optional chaining `?.` because the `socials` object can be undefined at runtime.
    { name: 'YouTube', icon: <YoutubeIcon />, url: socials?.youtube },
    // FIX: Use optional chaining `?.` because the `socials` object can be undefined at runtime.
    { name: 'Telegram', icon: <TelegramIcon />, url: socials?.telegram },
  ].filter(link => link.url); // Filter out links that are not provided

  return (
    <footer className="mt-12 py-8" style={{ backgroundColor: 'rgba(31, 41, 55, 0.5)' }}>
      <div className="container mx-auto px-4 text-center">
        <h3 className="text-xl font-bold text-gray-300 mb-4">
          تابعنا على
        </h3>
        <div className="flex justify-center space-x-6 space-x-reverse mb-6">
          {socialLinks.map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.name}
              className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover"
            >
              {link.icon}
            </a>
          ))}
        </div>
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} <span dir="ltr">techtouch0</span>. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
