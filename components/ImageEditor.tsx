
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { SparklesIcon, ArrowUpOnSquareIcon, ArrowPathIcon, PhotoIcon } from './Icons';

const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        resolve({
            data: result.split(',')[1],
            mimeType: result.split(';')[0].split(':')[1]
        });
    };
    reader.onerror = error => reject(error);
  });
};

const PresetButton: React.FC<{ onClick: () => void, children: React.ReactNode, disabled: boolean }> = ({ onClick, children, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="w-full text-right bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        {children}
    </button>
);

const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ data: string; mimeType: string; url: string } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [customPrompt, setCustomPrompt] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = useCallback(() => {
        setOriginalImage(null);
        setEditedImage(null);
        setIsLoading(false);
        setError(null);
        setCustomPrompt('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);
    
    const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleReset();
            try {
                const { data, mimeType } = await fileToBase64(file);
                const url = URL.createObjectURL(file);
                setOriginalImage({ data, mimeType, url });
            } catch (err) {
                setError("حدث خطأ أثناء تحميل الصورة.");
                console.error(err);
            }
        }
    }, [handleReset]);
    
    const handleEditRequest = async (prompt: string) => {
        if (!originalImage) return;

        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image-preview',
                contents: {
                    parts: [
                        { inlineData: { data: originalImage.data, mimeType: originalImage.mimeType } },
                        { text: prompt + ". حافظ على شكل وملامح الوجه الأصلية دون تغيير." },
                    ],
                },
                config: {
                    responseModalities: [Modality.IMAGE, Modality.TEXT],
                },
            });

            const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
            if (imagePart?.inlineData) {
                setEditedImage(`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`);
            } else {
                throw new Error("لم يتم العثور على صورة في استجابة الذكاء الاصطناعي. قد يكون الطلب غير واضح.");
            }
        } catch (err) {
            console.error("Error editing image:", err);
            setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء التعديل.");
        } finally {
            setIsLoading(false);
        }
    };

    const presetPrompts = {
        wrinkles: 'أزل التجاعيد من الوجه',
        acne: 'أزل حب الشباب والشوائب من بشرة الوجه',
        smoothing: 'قم بتصفية وتنقية بشرة الوجه لجعلها تبدو ناعمة',
        brighten: 'اجعل بشرة الوجه أكثر إشراقًا ونضارة',
        changeBg: 'قم بتغيير الخلفية إلى ',
        changeClothes: 'قم بتغيير ملابس الشخص إلى ',
    };

    const handleSaveImage = () => {
        if (editedImage) {
            const link = document.createElement('a');
            link.href = editedImage;
            link.download = `edited-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (!originalImage) {
        return (
            <div className="p-4 sm:p-6 rounded-lg shadow-xl text-center animate-fadeIn" style={{ backgroundColor: 'var(--color-header-bg)' }}>
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">محرر الصور بالذكاء الاصطناعي</h2>
                <p className="text-gray-400 mb-8">ارفع صورة وابدأ بالتعديل عليها باستخدام تقنيات الذكاء الاصطناعي المتقدمة.</p>
                <div 
                    className="border-2 border-dashed border-gray-600 rounded-lg p-8 sm:p-12 cursor-pointer hover:border-red-500 hover:bg-gray-800/30 transition-all duration-300"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <PhotoIcon className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                    <span className="text-lg font-semibold text-white">اختر صورة للبدء</span>
                    <p className="text-gray-500 text-sm">أو قم بسحبها وإفلاتها هنا</p>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                    aria-label="Upload image"
                />
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
             <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">محرر الصور بالذكاء الاصطناعي</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Controls Column */}
                <div className="p-4 sm:p-6 rounded-lg shadow-xl" style={{ backgroundColor: 'var(--color-header-bg)' }}>
                    <h3 className="text-xl font-bold mb-4">خيارات التعديل</h3>
                    <div className="space-y-3">
                        <PresetButton disabled={isLoading} onClick={() => handleEditRequest(presetPrompts.wrinkles)}>إزالة التجاعيد</PresetButton>
                        <PresetButton disabled={isLoading} onClick={() => handleEditRequest(presetPrompts.acne)}>إزالة الحبوب والشوائب</PresetButton>
                        <PresetButton disabled={isLoading} onClick={() => handleEditRequest(presetPrompts.smoothing)}>تصفية وتنعيم البشرة</PresetButton>
                        <PresetButton disabled={isLoading} onClick={() => handleEditRequest(presetPrompts.brighten)}>بشرة أكثر إشراقاً</PresetButton>
                        <PresetButton disabled={isLoading} onClick={() => setCustomPrompt(presetPrompts.changeBg)}>تغيير الخلفية...</PresetButton>
                        <PresetButton disabled={isLoading} onClick={() => setCustomPrompt(presetPrompts.changeClothes)}>تغيير الملابس...</PresetButton>
                    </div>

                    <div className="mt-6">
                        <label htmlFor="custom-prompt" className="block text-lg font-medium text-gray-300 mb-2">
                            أو اكتب طلبك الخاص
                        </label>
                        <textarea
                            id="custom-prompt"
                            rows={3}
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="مثال: اجعل الشعر أزرق اللون"
                            className="w-full bg-gray-700 text-white placeholder-gray-400 rounded-lg p-3 focus:outline-none focus:ring-2 ring-primary"
                        />
                        <button
                            onClick={() => handleEditRequest(customPrompt)}
                            disabled={isLoading || !customPrompt}
                            className="w-full mt-3 inline-flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <SparklesIcon className="w-5 h-5" />
                            <span>{isLoading ? 'جاري التعديل...' : 'نفّذ التعديل'}</span>
                        </button>
                    </div>
                </div>

                {/* Image Display Column */}
                <div className="p-4 sm:p-6 rounded-lg shadow-xl flex flex-col items-center" style={{ backgroundColor: 'var(--color-header-bg)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                        <div>
                            <h4 className="font-bold text-center mb-2 text-gray-400">الأصلية</h4>
                            <img src={originalImage.url} alt="Original" className="rounded-lg w-full h-auto object-contain" />
                        </div>
                        <div>
                            <h4 className="font-bold text-center mb-2 text-primary-focus">المعدّلة</h4>
                            <div className="w-full aspect-square bg-gray-800/50 rounded-lg flex items-center justify-center">
                                {isLoading ? (
                                    <div className="w-full h-full skeleton-pulse rounded-lg"></div>
                                ) : editedImage ? (
                                    <img src={editedImage} alt="Edited" className="rounded-lg w-full h-auto object-contain" />
                                ) : (
                                    <p className="text-gray-500">النتيجة ستظهر هنا</p>
                                )}
                            </div>
                        </div>
                    </div>
                    {error && <p className="mt-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-center w-full">{error}</p>}

                    <div className="mt-6 flex gap-4 w-full">
                        <button onClick={handleReset} className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-300 transform hover:scale-105">
                           <ArrowPathIcon className="w-5 h-5"/> إعادة
                        </button>
                        <button onClick={handleSaveImage} disabled={!editedImage || isLoading} className="flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-4 rounded-lg transition-transform duration-300 transform hover:scale-105 btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                            <ArrowUpOnSquareIcon className="w-5 h-5"/> حفظ
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default ImageEditor;
