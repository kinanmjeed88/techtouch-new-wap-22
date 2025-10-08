import React, { useState } from 'react';
import type { Post } from '../types';
import { FacebookIcon, TwitterIcon, WhatsAppIcon, SparklesIcon, TelegramIcon, InfoIcon } from './Icons';
import RelatedPostsSlider from './RelatedPostsSlider';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  siteName: string;
  allPosts: Post[];
  onSelectPost: (post: Post) => void;
}

const getYouTubeID = (url: string): string | null => {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = new URL(url).searchParams.get('v') || url.match(regExp)?.[2];
    return match && match.length === 11 ? match : null;
  } catch (e) {
    // Fallback for non-standard URLs
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  }
};

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack, siteName, allPosts, onSelectPost }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [details, setDetails] = useState<string | null>(null);
  const [sources, setSources] = useState<{ uri: string; title: string }[]>([]);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const formattedDate = new Date(post.timestamp).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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

  const generateSummary = async (): Promise<string> => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const response = await fetch('/.netlify/functions/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: post.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch summary from server.");
      }

      const data = await response.json();
      const summaryText = data.summary;

      if (!summaryText || summaryText.trim() === '') {
        throw new Error("Received an empty summary from the AI.");
      }
      
      setSummary(summaryText);
      return summaryText;
    } catch (err) {
      console.error("Error summarizing content:", err);
      throw err;
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSummarize = async () => {
    if (summary) return;
    try {
      await generateSummary();
    } catch (err) {
      setSummaryError("حدث خطأ أثناء إنشاء الملخص. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleFetchDetails = async () => {
    if (details) return;
    setIsFetchingDetails(true);
    setDetailsError(null);
    try {
      const response = await fetch('/.netlify/functions/get-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: post.content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch details from server.");
      }

      const data = await response.json();
      if (!data.details || data.details.trim() === '') {
        throw new Error("Received empty details from the AI.");
      }
      setDetails(data.details);
      setSources(data.sources || []);
    } catch (err) {
      console.error("Error fetching details:", err);
      setDetailsError("حدث خطأ أثناء جلب التفاصيل. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsFetchingDetails(false);
    }
  };


  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram') => {
    try {
      const summaryToShare = summary || await generateSummary();

      const pageUrl = window.location.href;
      let shareUrl = '';

      switch (platform) {
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}&quote=${encodeURIComponent(summaryToShare)}`;
          break;
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(summaryToShare)}`;
          break;
        case 'whatsapp':
          const whatsappText = `${summaryToShare}\n\n${pageUrl}`;
          shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappText)}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(summaryToShare)}`;
          break;
      }

      if (shareUrl) {
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
      }

    } catch (err) {
      setSummaryError("فشل إنشاء الملخص للمشاركة. يرجى المحاولة مرة أخرى.");
    }
  };

  const videoId = post.youtubeUrl ? getYouTubeID(post.youtubeUrl) : null;
  const relatedPostObjects = post.relatedPosts
    ? allPosts.filter(p => post.relatedPosts.includes(p.title) && p.id !== post.id)
    : [];


  return (
    <div className="p-4 sm:p-6 rounded-lg shadow-xl" style={{ backgroundColor: 'var(--color-header-bg)'}}>
      <button onClick={onBack} className="mb-6 text-sm sm:text-base hover:text-red-300 transition-colors duration-300 font-semibold" style={{ color: 'var(--color-primary-focus)' }}>
        &larr; العودة إلى المنشورات
      </button>

      <article>
        <h1 className="text-2xl sm:text-4xl font-bold mb-4">{post.title}</h1>
        <div className="flex items-center justify-between flex-wrap gap-4 text-gray-400 text-sm mb-6">
            <div className="flex items-center gap-x-4">
                <span>{formattedDate}</span>
            </div>
        </div>
        
        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full h-auto max-h-[300px] sm:max-h-[500px] object-cover rounded-lg mb-6 shadow-lg" />}
        
        {videoId && (
          <div className="my-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-4" style={{ color: 'var(--color-primary-focus)' }}>شاهد الفيديو</h2>
            <div className="relative h-0 pb-[56.25%]"> {/* 16:9 Aspect Ratio */}
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}
        
        <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: processContent(post.content) }} />

        <div className="mt-8 pt-6 border-t border-gray-700 space-y-4">
          {!details ? (
              <>
                <div className="text-center">
                  <button
                    onClick={handleFetchDetails}
                    disabled={isFetchingDetails || isSummarizing}
                    className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-5 sm:py-3 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <InfoIcon className="w-5 h-5" />
                    <span>{isFetchingDetails ? 'يتم جلب المعلومات...' : 'معلومات أكثر بالذكاء الاصطناعي'}</span>
                  </button>
                </div>
                {isFetchingDetails && (
                  <div className="p-4 rounded-lg bg-gray-800/50 skeleton-pulse">
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                  </div>
                )}
                {detailsError && (
                  <div className="p-4 rounded-lg bg-red-900/50 text-red-300 text-center">
                    <p>{detailsError}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 sm:p-5 rounded-lg animate-fadeIn" style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)' }}>
                <h3 className="flex items-center gap-2 text-lg sm:text-xl font-bold mb-3" style={{ color: 'var(--color-primary-focus)' }}>
                  <InfoIcon className="w-6 h-6" />
                  تفاصيل إضافية
                </h3>
                <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap">{details}</p>
                {sources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-700">
                    <h4 className="font-semibold text-gray-400 mb-2">المصادر:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {sources.map((source, index) => (
                        <li key={index} className="text-xs text-blue-400 hover:text-blue-300 truncate">
                          <a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title || source.uri}</a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
        </div>


        <div className="mt-8 pt-6 border-t border-gray-700 space-y-4">
          {!summary ? (
            <>
              <div className="text-center">
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing || isFetchingDetails}
                  className="inline-flex items-center gap-2 text-white font-bold py-2 px-5 sm:py-3 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-105 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>{isSummarizing ? 'يتم الإنشاء...' : 'تلخيص بالذكاء الاصطناعي'}</span>
                </button>
              </div>

              {isSummarizing && (
                <div className="p-4 rounded-lg bg-gray-800/50 skeleton-pulse">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              )}

              {summaryError && (
                <div className="p-4 rounded-lg bg-red-900/50 text-red-300 text-center">
                  <p>{summaryError}</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 sm:p-5 rounded-lg animate-fadeIn" style={{ backgroundColor: 'rgba(17, 24, 39, 0.8)' }}>
                <h3 className="flex items-center gap-2 text-lg sm:text-xl font-bold mb-3" style={{ color: 'var(--color-primary-focus)' }}>
                    <SparklesIcon className="w-6 h-6" />
                    ملخص بالذكاء الاصطناعي
                </h3>
                <p className="text-gray-300 text-sm sm:text-base whitespace-pre-wrap">{summary}</p>
            </div>
          )}
        </div>


        {(post.link || post.fileUrl) && (
          <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row gap-4">
            {post.link && (
              <a 
                href={post.link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 text-center text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-transform duration-300 transform hover:scale-105 btn-primary"
              >
                زيارة الرابط
              </a>
            )}
            {post.fileUrl && (
              <a 
                href={post.fileUrl} 
                download 
                className="flex-1 text-center bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 sm:py-3 sm:px-6 rounded-lg transition-transform duration-300 transform hover:scale-105"
              >
                تحميل الملف
              </a>
            )}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-700">
            <h4 className="text-center text-lg font-semibold text-gray-400 mb-4">{isSummarizing ? 'جاري إنشاء الملخص للمشاركة...' : 'مشاركة المنشور'}</h4>
            <div className="flex justify-center items-center gap-6">
                <button onClick={() => handleShare('facebook')} disabled={isSummarizing} aria-label="Share on Facebook" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                    <FacebookIcon className="w-7 h-7" />
                </button>
                <button onClick={() => handleShare('twitter')} disabled={isSummarizing} aria-label="Share on Twitter" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                    <TwitterIcon className="w-7 h-7" />
                </button>
                <button onClick={() => handleShare('whatsapp')} disabled={isSummarizing} aria-label="Share on WhatsApp" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                    <WhatsAppIcon className="w-7 h-7" />
                </button>
                <button onClick={() => handleShare('telegram')} disabled={isSummarizing} aria-label="Share on Telegram" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover disabled:opacity-50 disabled:cursor-not-allowed">
                    <TelegramIcon className="w-7 h-7" />
                </button>
            </div>
        </div>
        
        {relatedPostObjects.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-700">
            <RelatedPostsSlider posts={relatedPostObjects} onSelectPost={onSelectPost} />
          </div>
        )}
      </article>
    </div>
  );
};

export default PostDetail;