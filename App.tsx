import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import AnnouncementBar from './components/AnnouncementBar';
import PostDetail from './components/PostDetail';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import PostCard from './components/PostCard';
import Pagination from './components/Pagination';
import SkeletonLoader from './components/SkeletonLoader';
import AITools from './components/AITools';
import type { Category, Post, SiteSettings } from './types';

interface AppData {
  posts: Post[];
  logoUrl: string;
  siteName: string;
  announcementText: string;
  announcementLink?: string;
  announcementLabel: string;
  announcementBgColor: string;
  announcementTextColor?: string;
  colors?: SiteSettings['colors'];
  socials?: SiteSettings['socials'];
}

const POSTS_PER_PAGE = 6;

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'home' | 'postDetail' | 'aiTools'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsResponse, postsResponse, categoriesResponse] = await Promise.all([
          fetch(`/settings.json?v=${new Date().getTime()}`),
          fetch(`/posts.json?v=${new Date().getTime()}`),
          fetch(`/categories.json?v=${new Date().getTime()}`),
        ]);

        if (!settingsResponse.ok || !postsResponse.ok || !categoriesResponse.ok) {
          throw new Error(`خطأ في تحميل البيانات`);
        }
        const settingsData = await settingsResponse.json();
        const postsData = await postsResponse.json();
        const categoriesData = await categoriesResponse.json();
        
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
          announcementTextColor: identity.announcementTextColor,
          colors: colors,
          socials: socials,
        });
        setCategories(categoriesData.categories || []);

        if (colors) {
          const root = document.documentElement;
          const primaryColor = colors.primary || '#ef4444';
          root.style.setProperty('--color-header-bg', colors.header || '#1f2937');
          root.style.setProperty('--color-card-bg', colors.card || 'rgba(31, 41, 55, 0.5)');
          root.style.setProperty('--color-primary', primaryColor);
          root.style.setProperty('--color-primary-hover', `${primaryColor}CC`);
          root.style.setProperty('--color-primary-focus', `${primaryColor}B3`);
          root.style.setProperty('--color-site-name', colors.siteName || '#FFFFFF');
          root.style.setProperty('--color-card-title', colors.cardTitle || '#FFFFFF');
          root.style.setProperty('--color-card-description', colors.cardDescription || '#D1D5DB');
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
  
  const handleGoToAITools = () => {
    setSelectedPost(null);
    setCurrentView('aiTools');
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
  
  const categoryTitleMap = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat.id] = cat.title;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

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
                categoryTitle={categoryTitleMap[post.category] || post.category}
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        <button
          onClick={() => handleFilterChange('all')}
          className={`w-full text-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-base sm:text-lg font-medium ${
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
            className={`w-full text-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 text-base sm:text-lg font-medium whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-red-600 text-white shadow-md btn-primary'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }`}
          >
            {cat.title}
          </button>
        ))}
      </div>
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
          onGoToAITools={handleGoToAITools}
          currentView={currentView}
        />
        <AnnouncementBar 
          content={appData.announcementText} 
          link={appData.announcementLink} 
          label={appData.announcementLabel}
          bgColor={appData.announcementBgColor}
          textColor={appData.announcementTextColor}
        />

        <main className="mt-8">
          {currentView === 'postDetail' && selectedPost ? (
            <PostDetail post={selectedPost} onBack={handleGoHome} siteName={appData.siteName} />
          ) : currentView === 'aiTools' ? (
            <AITools />
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