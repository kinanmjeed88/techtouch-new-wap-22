

import React from 'react';
import type { Post } from '../types';
import { FacebookIcon, TwitterIcon, WhatsAppIcon } from './Icons';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  siteName: string;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack, siteName }) => {
  const formattedDate = new Date(post.timestamp).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const pageUrl = window.location.href;
  const shareText = `${post.title} - ${siteName}`;
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;
  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + ' ' + pageUrl)}`;

  const processContent = (content: string): string => {
    return content
      .split('\n')
      .map(line => {
        if (line.trim().startsWith('##')) {
          return `<strong>${line.trim().substring(2).trim()}</strong>`;
        }
        return line;
      })
      .join('<br />');
  };

  return (
    <div className="p-4 sm:p-6 rounded-lg shadow-xl" style={{ backgroundColor: 'var(--color-header-bg)'}}>
      <button onClick={onBack} className="mb-6 text-sm sm:text-base hover:text-red-300 transition-colors duration-300 font-semibold" style={{ color: 'var(--color-primary-focus)' }}>
        &larr; العودة إلى المنشورات
      </button>

      <article>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">{post.title}</h1>
        <p className="text-gray-400 text-sm mb-6">{formattedDate}</p>
        
        <img src={post.imageUrl} alt={post.title} className="w-full h-auto max-h-[300px] sm:max-h-[500px] object-cover rounded-lg mb-6 shadow-lg" />
        
        <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: processContent(post.content) }} />

        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-4">
          <a 
            href={post.link} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex-1 text-center text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-transform duration-300 transform hover:scale-105 btn-primary"
          >
            زيارة الرابط
          </a>
          <a 
            href={post.fileUrl} 
            download 
            className="flex-1 text-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-transform duration-300 transform hover:scale-105"
          >
            تحميل الملف
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700">
            <h4 className="text-center text-lg font-semibold text-gray-400 mb-4">مشاركة المنشور</h4>
            <div className="flex justify-center items-center gap-6">
                <a href={facebookShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover">
                    <FacebookIcon className="w-7 h-7" />
                </a>
                <a href={twitterShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Twitter" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover">
                    <TwitterIcon className="w-7 h-7" />
                </a>
                <a href={whatsappShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover">
                    <WhatsAppIcon className="w-7 h-7" />
                </a>
            </div>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;