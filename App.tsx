

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AnnouncementBar from './components/AnnouncementBar';
import PostDetail from './components/PostDetail';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import PostCard from './components/PostCard';
import Pagination from './components/Pagination';
import SkeletonLoader from './components/SkeletonLoader';
import AIChat from './components/ImageEditor'; // Renamed ImageEditor to AIChat for clarity
import type { Category, Post, SiteSettings } from './types';

interface AppData {
  posts: Post[];
  logoUrl: string;
  siteName: string;
  announcementText: string;
  announcementLink?: string;
  announcementLabel: string;
  announcementBgColor: string;
  colors?: SiteSettings['colors'];
  socials?: SiteSettings['socials'];
}

const POSTS_PER_PAGE = 6;

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'home' | 'postDetail' | 'aiChat'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsResponse, postsResponse] = await Promise.all([
          fetch(`/settings.json?v=${new Date().getTime()}`),
          fetch(`/posts.json?v=${new Date().getTime()}`)
        ]);

        if (!settingsResponse.ok || !postsResponse.ok) {
          throw new Error(`خطأ في تحميل البيانات`);
        }
        const settingsData = await settingsResponse.json();
        const postsData = await postsResponse.json();
        
        const identity = settingsData.identity || {};
        const colors = settingsData.colors;
        const socials = settingsData.socials;

        setAppData({
          posts: postsData.posts || [],
          logoUrl: identity.logoUrl || '',
          siteName: identity.siteName || 'techtouch0',
          announcementText: identity.announcementText || '',
          announcementLink: identity.announcementLink,
          announcementLabel: identity.announcementLabel || 'إعلان',
          announcementBgColor: identity.announcementBgColor || 'var(--color-header-bg)',
          colors: colors,
          socials: socials,
        });

        if (colors) {
          const root = document.documentElement;
          const primaryColor = colors.primary || '#ef4444';
          root.style.setProperty('--color-header-bg', colors.header || '#1f2937');
          root.style.setProperty('--color-card-bg', colors.card || 'rgba(31, 41, 55, 0.5)');
          root.style.setProperty('--color-primary', primaryColor);
          root.style.setProperty('--color-primary-hover', `${primaryColor}CC`);
          root.style.setProperty('--color-primary-focus', `${primaryColor}B3`);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectPost = (post: Post) => {
    setSelectedPost(post);
    setCurrentView('postDetail');
    window.scrollTo(0, 0);
  };

  const handleGoHome = () => {
    setSelectedPost(null);
    setCurrentView('home');
  };
  
  const handleGoToAIChat = () => {
    setSelectedPost(null);
    setCurrentView('aiChat');
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (category: Category | 'all') => {
    setActiveCategory(category);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const categories: { id: Category; title: string }[] = [
    { id: 'general', title: '📚 منشورات عامة' },
    { id: 'android-apps', title: '📱 تطبيقات أندرويد' },
    { id: 'movie-apps', title: '🎬 تطبيقات أفلام' },
    { id: 'sports-apps', title: '⚽ تطبيقات رياضية' },
    { id: 'games', title: '🎮 الألعاب' },
  ];

  const categoryPostTitles: { [key in Category]: string } = {
    general: 'منشور عام',
    'android-apps': 'تطبيق أندرويد',
    'movie-apps': 'تطبيق أفلام',
    'sports-apps': 'تطبيق رياضي',
    games: 'لعبة',
  };

  const filteredPosts = (appData?.posts || [])
    .filter(post => activeCategory === 'all' || post.category === activeCategory)
    .filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );
  
  const renderHomeView = () => (
    <div>
      <CategoryTabs />
      
      {loading ? <SkeletonLoader /> : filteredPosts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedPosts.map((post, index) => (
              <PostCard 
                key={post.id} 
                post={post} 
                onSelect={handleSelectPost}
                categoryTitle={categoryPostTitles[post.category]}
                index={index}
              />
            ))}
          </div>
          <Pagination 
            totalPosts={filteredPosts.length}
            postsPerPage={POSTS_PER_PAGE}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-400">لا توجد نتائج</h3>
            <p className="text-gray-500 mt-2">حاول تغيير فلتر البحث أو التصنيف.</p>
          </div>
        </div>
      )}
    </div>
  );

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500 text-2xl">حدث خطأ: {error}</div>;
  }

  if (!appData) {
    return (
       <div className="bg-gray-900 min-h-screen text-white">
        <div className="container mx-auto px-4 py-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }

  const CategoryTabs = () => (
    <div className="mb-8">
      <h3 className="text-xl sm:text-2xl font-bold mb-4 text-white">التصنيفات</h3>
      <nav className="flex flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-base sm:text-lg font-medium ${
            activeCategory === 'all'
              ? 'bg-red-600 text-white shadow-md btn-primary'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
          }`}
        >
          الكل
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleFilterChange(cat.id)}
            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-base sm:text-lg font-medium whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-red-600 text-white shadow-md btn-primary'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <Header 
          onSearch={handleSearchChange} 
          logoUrl={appData.logoUrl} 
          siteName={appData.siteName}
          onGoHome={handleGoHome}
          onGoToAIChat={handleGoToAIChat}
        />
        <AnnouncementBar 
          content={appData.announcementText} 
          link={appData.announcementLink} 
          label={appData.announcementLabel}
          bgColor={appData.announcementBgColor}
        />

        <main className="mt-8">
          {currentView === 'postDetail' && selectedPost ? (
            <PostDetail post={selectedPost} onBack={handleGoHome} siteName={appData.siteName} />
          ) : currentView === 'aiChat' ? (
            <AIChat />
          ) : (
            renderHomeView()
          )}
        </main>
      </div>
      <Footer socials={appData.socials} />
      <FloatingButtons onGoHome={handleGoHome} showHomeButton={currentView !== 'home'} />
    </div>
  );
};

export default App;
