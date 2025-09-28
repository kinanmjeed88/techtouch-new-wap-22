
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AnnouncementBar from './components/AnnouncementBar';
import PostDetail from './components/PostDetail';
import Footer from './components/Footer';
import FloatingButtons from './components/FloatingButtons';
import PostCard from './components/PostCard';
import type { Category, Post, SiteSettings } from './types';

interface AppData {
  posts: Post[];
  logoUrl: string;
  announcementText: string;
  announcementLink?: string;
  colors: SiteSettings['colors'];
  socials: SiteSettings['socials'];
}

const App: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Add a cache-busting query parameter
        const response = await fetch(`/content.json?v=${new Date().getTime()}`);
        if (!response.ok) {
          throw new Error(`خطأ في تحميل البيانات: ${response.statusText}`);
        }
        const data = await response.json();
        setAppData({
          posts: data.posts || [],
          logoUrl: data.logoUrl || '',
          announcementText: data.announcementText || '',
          announcementLink: data.announcementLink,
          colors: data.colors,
          socials: data.socials,
        });

        // Apply theme colors
        if (data.colors) {
          const root = document.documentElement;
          root.style.setProperty('--color-header-bg', data.colors.header || '#1f2937');
          root.style.setProperty('--color-card-bg', data.colors.card || 'rgba(31, 41, 55, 0.5)');
          root.style.setProperty('--color-primary', data.colors.primary || '#ef4444');
          // Simple hover color derivation
          root.style.setProperty('--color-primary-hover', `${data.colors.primary}CC` || '#dc2626');
          root.style.setProperty('--color-primary-focus', `${data.colors.primary}B3` || '#f87171');
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
    window.scrollTo(0, 0);
  };

  const handleGoHome = () => {
    setSelectedPost(null);
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

  const filteredPosts = appData?.posts
    .filter(post => activeCategory === 'all' || post.category === activeCategory)
    .filter(post =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-white text-2xl">...جاري التحميل</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-red-500 text-2xl">حدث خطأ: {error}</div>;
  }

  if (!appData) {
    return null;
  }

  const CategoryTabs = () => (
    <div className="mb-8">
      <h3 className="text-2xl font-bold mb-4 text-white">التصنيفات</h3>
      <nav className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-lg transition-all duration-300 text-lg font-medium ${
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
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-lg transition-all duration-300 text-lg font-medium whitespace-nowrap ${
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
        <Header onSearch={setSearchQuery} logoUrl={appData.logoUrl} />
        <AnnouncementBar content={appData.announcementText} link={appData.announcementLink} />

        <main className="mt-8">
          {selectedPost ? (
            <PostDetail post={selectedPost} onBack={handleGoHome} />
          ) : (
            <div>
              <CategoryTabs />
              
              {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPosts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onSelect={handleSelectPost}
                      categoryTitle={categoryPostTitles[post.category]}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-800/50 rounded-lg">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-400">لا توجد نتائج</h3>
                    <p className="text-gray-500 mt-2">حاول تغيير فلتر البحث أو التصنيف.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer socials={appData.socials} />
      <FloatingButtons onGoHome={handleGoHome} showHomeButton={!!selectedPost} />
    </div>
  );
};

export default App;
