import React from 'react';
import type { Post } from '../types';

interface RelatedPostsSliderProps {
  posts: Post[];
  onSelectPost: (post: Post) => void;
}

const RelatedPostCard: React.FC<{ post: Post; onSelect: (post: Post) => void }> = ({ post, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(post)}
      className="flex-shrink-0 w-48 sm:w-56 cursor-pointer group snap-start"
    >
      <div className="relative overflow-hidden rounded-lg shadow-md aspect-video bg-gray-700">
        {post.imageUrl ? (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500 text-sm">لا توجد صورة</span>
          </div>
        )}
      </div>
      <h4 className="mt-2 text-sm sm:text-base font-semibold text-gray-300 group-hover:text-white transition-colors duration-200 truncate" title={post.title}>
        {post.title}
      </h4>
    </div>
  );
};

const RelatedPostsSlider: React.FC<RelatedPostsSliderProps> = ({ posts, onSelectPost }) => {
  if (!posts || posts.length === 0) return null;

  return (
    <div className="animate-fadeIn">
      <h3 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: 'var(--color-primary-focus)' }}>
        قد يعجبك أيضاً
      </h3>
      <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 snap-x snap-mandatory">
        {posts.map(post => (
          <RelatedPostCard key={post.id} post={post} onSelect={onSelectPost} />
        ))}
      </div>
    </div>
  );
};

export default RelatedPostsSlider;