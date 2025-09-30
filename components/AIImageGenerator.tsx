import React, { useState } from 'react';
import { SparklesIcon, DownloadIcon, ImageIcon } from './Icons';

const AIImageGenerator: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('الرجاء إدخال وصف للصورة.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);

        try {
            const response = await fetch('/.netlify/functions/image-generator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل إنشاء الصورة.');
            }
            
            const data = await response.json();
            setImageUrl(data.imageUrl);

        } catch (err) {
            console.error("Image generation error:", err);
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDownload = () => {
        if (!imageUrl) return;
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `techtouch-ai-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex flex-col p-4 sm:p-6 rounded-lg shadow-xl animate-fadeIn" style={{ backgroundColor: 'var(--color-header-bg)' }}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-4">مولّد الصور بالذكاء الاصطناعي</h2>
            <p className="text-center text-gray-400 mb-6">اكتب وصفاً للصورة التي تريد إنشاءها، وسيقوم الذكاء الاصطناعي بتحويلها إلى حقيقة.</p>

            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 mb-6">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: قط يرتدي نظارات شمسية على الشاطئ"
                    rows={2}
                    className="flex-grow w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 ring-primary resize-y"
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <SparklesIcon className="w-5 h-5" />
                    <span>{isLoading ? 'جاري الإنشاء...' : 'إنشاء الصورة'}</span>
                </button>
            </div>
            
            {error && <p className="mb-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-center w-full">{error}</p>}
            
            <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden">
                {isLoading && (
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-gray-500 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">يتم إنشاء تحفتك الفنية...</p>
                    </div>
                )}
                {imageUrl && (
                    <img
                        src={imageUrl}
                        alt={prompt}
                        className="w-full h-full object-contain animate-fadeIn"
                    />
                )}
                 {!isLoading && !imageUrl && (
                    <div className="text-center text-gray-500">
                        <ImageIcon className="w-24 h-24 mx-auto mb-4" />
                        <p>ستظهر صورتك هنا</p>
                    </div>
                )}
            </div>

            {imageUrl && !isLoading && (
                <div className="mt-6 text-center">
                    <button
                        onClick={handleDownload}
                        className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-5 rounded-lg transition-transform duration-300 transform hover:scale-105"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>تحميل الصورة</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default AIImageGenerator;
