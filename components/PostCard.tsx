import React from 'react';
import type { Post } from '../types';

interface PostCardProps {
  post: Post;
  onSelect: (post: Post) => void;
  categoryTitle: string;
  index: number;
}

const PostCard: React.FC<PostCardProps> = ({ post, onSelect, categoryTitle, index }) => {
  return (
    <div
      className="backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group border-primary-hover shadow-primary-hover card-enter"
      onClick={() => onSelect(post)}
      style={{ 
        backgroundColor: 'var(--color-card-bg)',
        animationDelay: `${index * 100}ms`
      }}
    >
      <div className="relative">
        <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
        <span className="absolute top-2 right-2 bg-red-600/80 text-white text-xs font-bold px-2 py-1 rounded btn-primary">
          {categoryTitle}
        </span>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 group-hover:text-red-400 transition-colors duration-300 text-primary-hover">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm">
          {post.description}
        </p>
      </div>
    </div>
  );
};

export default PostCard;