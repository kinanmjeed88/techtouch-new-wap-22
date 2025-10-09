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
import ProfileModal from './components/ProfileModal';
import Backup from './components/Backup';
import type { Category, Post, SiteSettings, Profile } from './types';

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
  profile?: Profile;
}

const POSTS_PER_PAGE = 6;

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [categories, setCategories] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [currentView, setCurrentView] = useState<'home' | 'postDetail' | 'aiTools' | 'backup'>('home');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsResponse, postsResponse, categoriesResponse, profileResponse] = await Promise.all([
          fetch(`/settings.json?v=${new Date().getTime()}`),
          fetch(`/posts.json?v=${new Date().getTime()}`),
          fetch(`/categories.json?v=${new Date().getTime()}`),
          fetch(`/profile.json?v=${new Date().getTime()}`),
        ]);

        if (!settingsResponse.ok || !postsResponse.ok || !categoriesResponse.ok || !profileResponse.ok) {
          throw new Error(`خطأ في تحميل البيانات`);
        }
        const settingsData = await settingsResponse.json();
        const postsData = await postsResponse.json();
        const categoriesData = await categoriesResponse.json();
        const profileData = await profileResponse.json();
        
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
          profile: profileData,
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
  
  useEffect(() => {
    const handleLocationChange = () => {
      if (!appData) return;

      const path = window.location.pathname;
      const postMatch = path.match(/^\/post\/(\d+)\/(.*)$/);

      if (postMatch) {
        const postId = parseInt(postMatch[1], 10);
        const post = appData.posts.find(p => p.id === postId);
        if (post) {
          if (selectedPost?.id !== post.id) {
            setSelectedPost(post);
          }
          setCurrentView('postDetail');
        } else {
          // Post not found, go home
          window.history.replaceState({}, '', '/');
          setSelectedPost(null);
          setCurrentView('home');
        }
      } else if (path === '/ai-tools') {
        setSelectedPost(null);
        setCurrentView('aiTools');
      } else if (path === '/backup') {
        setSelectedPost(null);
        setCurrentView('backup');
      } else {
        setSelectedPost(null);
        setCurrentView('home');
      }
    };

    // Initial load check
    if(appData) {
      handleLocationChange();
    }

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, [appData, selectedPost?.id]);

  const handleSelectPost = (post: Post) => {
    const newPath = `/post/${post.id}/${post.slug}`;
    window.history.pushState({ postId: post.id }, post.title, newPath);
    setSelectedPost(post);
    setCurrentView('postDetail');
    window.scrollTo(0, 0);
  };

  const handleGoHome = () => {
    window.history.pushState({}, '', '/');
    setSelectedPost(null);
    setCurrentView('home');
  };
  
  const handleGoToAITools = () => {
    window.history.pushState({}, '', '/ai-tools');
    setSelectedPost(null);
    setCurrentView('aiTools');
    window.scrollTo(0, 0);
  };
  
  const handleGoToBackup = () => {
    window.history.pushState({}, '', '/backup');
    setSelectedPost(null);
    setCurrentView('backup');
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

  if (loading && !appData) {
    return (
       <div className="bg-gray-900 min-h-screen text-white">
        <div className="container mx-auto px-4 py-8">
          <SkeletonLoader />
        </div>
      </div>
    );
  }
  
  if (!appData) return null; // Return null while waiting for routing effect after data load

  const CategoryTabs = () => {
    const activeCategoryTitle = useMemo(() => {
        if (activeCategory === 'all') return 'الكل';
        return categoryTitleMap[activeCategory] || 'التصنيفات';
    }, [activeCategory, categoryTitleMap]);

    const handleCategorySelect = (category: Category | 'all') => {
        handleFilterChange(category);
        setIsCategoryMenuOpen(false);
    };
    
    const ChevronDownIcon = () => (
        <svg className={`w-5 h-5 transition-transform duration-300 ${isCategoryMenuOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );

    return (
        <div className="relative mb-8">
            <button
                onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 text-white rounded-lg transition-colors duration-300 hover:bg-gray-600 focus:outline-none focus:ring-2 ring-primary"
                aria-haspopup="true"
                aria-expanded={isCategoryMenuOpen}
            >
                <span className="text-lg font-medium">التصنيفات: {activeCategoryTitle}</span>
                <ChevronDownIcon />
            </button>

            {isCategoryMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-full bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-10 animate-fadeIn">
                    <ul className="py-1 max-h-60 overflow-y-auto">
                        <li>
                            <button
                                onClick={() => handleCategorySelect('all')}
                                className={`w-full text-right px-4 py-2 text-lg font-medium transition-colors duration-200 ${
                                    activeCategory === 'all'
                                        ? 'text-red-400 bg-gray-800'
                                        : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                                }`}
                            >
                                الكل
                            </button>
                        </li>
                        {categories.map((cat) => (
                            <li key={cat.id}>
                                <button
                                    onClick={() => handleCategorySelect(cat.id)}
                                    className={`w-full text-right px-4 py-2 text-lg font-medium transition-colors duration-200 whitespace-nowrap ${
                                        activeCategory === cat.id
                                            ? 'text-red-400 bg-gray-800'
                                            : 'text-gray-300 hover:bg-gray-600 hover:text-white'
                                    }`}
                                >
                                    {cat.title}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <div className="container mx-auto px-4 py-8">
        <Header 
          onSearch={handleSearchChange} 
          logoUrl={appData.logoUrl} 
          siteName={appData.siteName}
          onLogoClick={() => setIsProfileModalOpen(true)}
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
            <PostDetail 
                post={selectedPost} 
                onBack={handleGoHome} 
                siteName={appData.siteName}
                allPosts={appData.posts}
                onSelectPost={handleSelectPost}
            />
          ) : currentView === 'aiTools' ? (
            <AITools />
          ) : currentView === 'backup' ? (
            <Backup />
          ) : (
            renderHomeView()
          )}
        </main>
      </div>
      <Footer socials={appData.socials} />
      <FloatingButtons onGoHome={handleGoHome} showHomeButton={currentView !== 'home'} />

      {isProfileModalOpen && appData.profile && (
        <ProfileModal 
          profile={appData.profile}
          logoUrl={appData.logoUrl}
          onClose={() => setIsProfileModalOpen(false)}
          onGoToBackup={() => {
            setIsProfileModalOpen(false);
            handleGoToBackup();
          }}
        />
      )}
    </div>
  );
};

export default App;
