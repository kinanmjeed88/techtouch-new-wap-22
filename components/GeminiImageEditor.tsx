import React, { useState, useRef } from 'react';
import { SparklesIcon, DownloadIcon, ImageIcon, TrashIcon } from './Icons';

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

const GeminiImageEditor: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<{ url: string; file: File } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [responseText, setResponseText] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 4 * 1024 * 1024) { // 4MB limit
                setError("حجم الصورة كبير جداً. الرجاء اختيار صورة أصغر من 4 ميجابايت.");
                return;
            }
            setOriginalImage({ url: URL.createObjectURL(file), file });
            setEditedImage(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !originalImage) {
            setError('الرجاء رفع صورة وإدخال وصف للتعديل.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImage(null);
        setResponseText(null);

        try {
            const base64Data = await fileToBase64(originalImage.file);
            const base64String = base64Data.split(',')[1];

            const response = await fetch('/.netlify/functions/gemini-image-editor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    imageData: base64String,
                    mimeType: originalImage.file.type,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل تعديل الصورة.');
            }
            
            const data = await response.json();
            if (data.editedImageUrl) {
                setEditedImage(data.editedImageUrl);
            }
            if (data.responseText) {
                setResponseText(data.responseText);
            }
            if (!data.editedImageUrl && !data.responseText) {
                throw new Error("لم يتم إرجاع أي نتيجة من الذكاء الاصطناعي.");
            }

        } catch (err) {
            console.error("Image editing error:", err);
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        link.download = `techtouch-edited-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const clearImage = () => {
        setOriginalImage(null);
        setEditedImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-col p-4 sm:p-6 rounded-lg shadow-xl animate-fadeIn" style={{ backgroundColor: 'var(--color-header-bg)' }}>
            <h2 className="text-xl sm:text-2xl font-bold text-center mb-2">تعديل الصور بالذكاء الاصطناعي (تجريبي)</h2>
            <p className="text-center text-gray-400 mb-6">ارفع صورة واكتب وصفاً للتعديلات التي تريدها. مثال: "أضف قبعة للقبطان".</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Input Column */}
                <div className="space-y-4">
                    <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="hidden"
                    />
                    {!originalImage ? (
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-square border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 hover:border-red-500 hover:text-red-400 transition-colors"
                        >
                            <ImageIcon className="w-16 h-16 mb-2" />
                            <span className="font-semibold">انقر لرفع صورة</span>
                            <span className="text-sm">PNG, JPG, WEBP (Max 4MB)</span>
                        </button>
                    ) : (
                        <div className="relative w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={originalImage.url} alt="Original" className="max-w-full max-h-full object-contain" />
                            <button onClick={clearImage} title="Remove image" className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="أدخل وصف التعديل هنا..."
                        rows={3}
                        className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 ring-primary resize-y"
                        disabled={!originalImage}
                    />
                     <button
                        onClick={handleGenerate}
                        disabled={isLoading || !originalImage || !prompt.trim()}
                        className="w-full inline-flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-5 h-5" />
                        <span>{isLoading ? 'جاري التعديل...' : 'نفّذ التعديل'}</span>
                    </button>
                </div>

                {/* Output Column */}
                <div className="space-y-4">
                    <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center overflow-hidden relative">
                        {isLoading && (
                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-center z-10">
                                <div className="w-12 h-12 border-4 border-gray-500 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-gray-300">يتم تنفيذ التعديل المطلوب...</p>
                            </div>
                        )}
                        {editedImage ? (
                            <img
                                src={editedImage}
                                alt={prompt}
                                className="w-full h-full object-contain animate-fadeIn"
                            />
                        ) : (
                             <div className="text-center text-gray-500 px-4">
                                <SparklesIcon className="w-16 h-16 mx-auto mb-2" />
                                <p>الصورة المعدّلة ستظهر هنا</p>
                            </div>
                        )}
                    </div>
                     {responseText && (
                         <div className="p-3 bg-gray-700/80 rounded-lg text-gray-300 text-sm">
                             <p className="whitespace-pre-wrap">{responseText}</p>
                         </div>
                     )}
                     {editedImage && !isLoading && (
                        <div className="text-center">
                            <button
                                onClick={handleDownload}
                                className="w-full inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg transition-transform duration-300 transform hover:scale-105"
                            >
                                <DownloadIcon className="w-5 h-5" />
                                <span>تحميل الصورة المعدّلة</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {error && <p className="mt-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-center w-full">{error}</p>}
        </div>
    );
};

export default GeminiImageEditor;
