import React from 'react';

const SkeletonCard = () => (
  <div className="border border-gray-700 rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: 'var(--color-card-bg)'}}>
    <div className="w-full h-48 bg-gray-700 skeleton-pulse"></div>
    <div className="p-6">
      <div className="h-6 w-3/4 mb-4 bg-gray-700 rounded skeleton-pulse"></div>
      <div className="h-4 w-full bg-gray-700 rounded skeleton-pulse"></div>
      <div className="h-4 w-5/6 mt-2 bg-gray-700 rounded skeleton-pulse"></div>
    </div>
  </div>
);

const SkeletonLoader: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <div className="h-8 w-48 mb-4 bg-gray-700 rounded skeleton-pulse"></div>
        <div className="flex flex-wrap gap-3">
          <div className="h-10 w-20 bg-gray-700 rounded-lg skeleton-pulse"></div>
          <div className="h-10 w-32 bg-gray-700 rounded-lg skeleton-pulse"></div>
          <div className="h-10 w-40 bg-gray-700 rounded-lg skeleton-pulse"></div>
          <div className="h-10 w-36 bg-gray-700 rounded-lg skeleton-pulse"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;
