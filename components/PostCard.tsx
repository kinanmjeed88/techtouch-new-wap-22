
import React from 'react';
import type { Post } from '../types';
import { EyeIcon } from './Icons';

interface PostCardProps {
  post: Post;
  onSelect: (post: Post) => void;
  categoryTitle: string;
  index: number;
}

const PostCard: React.FC<PostCardProps> = ({ post, onSelect, categoryTitle, index }) => {
  return (
    <div
      className="backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group border-primary-hover shadow-primary-hover card-enter flex flex-col"
      onClick={() => onSelect(post)}
      style={{ 
        backgroundColor: 'var(--color-card-bg)',
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="relative">
        {post.imageUrl ? (
          <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gray-700 flex items-center justify-center">
            <span className="text-gray-500">لا توجد صورة</span>
          </div>
        )}
        <span className="absolute top-2 right-2 bg-red-600/80 text-white text-xs font-bold px-2 py-1 rounded btn-primary">
          {categoryTitle}
        </span>
      </div>
      <div className="p-4 sm:p-6 flex flex-col flex-grow">
        <h3 
          className="text-lg sm:text-xl font-bold mb-2 group-hover:text-red-400 transition-colors duration-300 text-primary-hover"
          style={{ color: 'var(--color-card-title)' }}
        >
          {post.title}
        </h3>
        <p 
          className="text-sm flex-grow"
          style={{ color: 'var(--color-card-description)' }}
        >
          {post.description}
        </p>
         <div 
          className="mt-4 pt-3 border-t border-gray-700/50 flex items-center justify-end text-xs"
          style={{ color: 'var(--color-card-description)' }}
        >
          <div className="flex items-center gap-1">
            <EyeIcon className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;