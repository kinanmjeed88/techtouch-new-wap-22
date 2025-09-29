
import React, { useState } from 'react';
import type { Post } from '../types';
import { FacebookIcon, TwitterIcon, WhatsAppIcon, SparklesIcon, EyeIcon, TelegramIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import ReactionButtons from './ReactionButtons';

interface PostDetailProps {
  post: Post;
  onBack: () => void;
  siteName: string;
}

const PostDetail: React.FC<PostDetailProps> = ({ post, onBack, siteName }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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
  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(shareText)}`;

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

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setSummaryError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: post.content,
          config: {
              systemInstruction: 'أنت خبير في تلخيص النصوص. قم بتلخيص النص التالي بشكل موجز وواضح باللغة العربية، واستخدم نقاطًا للميزات الرئيسية إن أمكن.',
          }
      });
      
      if (!response.text || response.text.trim() === '') {
          throw new Error("Received an empty summary from the AI.");
      }
      setSummary(response.text);
    } catch (err) {
        console.error("Error summarizing content:", err);
        setSummaryError("حدث خطأ أثناء إنشاء الملخص. يرجى المحاولة مرة أخرى.");
    } finally {
        setIsSummarizing(false);
    }
  };


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
                <div className="flex items-center gap-x-1.5">
                    <EyeIcon className="w-5 h-5" />
                </div>
            </div>
            <ReactionButtons postId={post.id} />
        </div>
        
        {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="w-full h-auto max-h-[300px] sm:max-h-[500px] object-cover rounded-lg mb-6 shadow-lg" />}
        
        <div className="prose prose-invert max-w-none text-gray-300 text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: processContent(post.content) }} />

        <div className="mt-8 pt-6 border-t border-gray-700 space-y-4">
          {!summary ? (
            <>
              <div className="text-center">
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing}
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
                <a href={telegramShareUrl} target="_blank" rel="noopener noreferrer" aria-label="Share on Telegram" className="text-gray-400 hover:text-red-400 transition-all duration-300 transform hover:scale-125 text-primary-hover">
                    <TelegramIcon className="w-7 h-7" />
                </a>
            </div>
        </div>
      </article>
    </div>
  );
};

export default PostDetail;