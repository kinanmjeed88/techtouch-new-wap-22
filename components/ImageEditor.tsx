
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { SparklesIcon, SendIcon, DownloadIcon } from './Icons';

// Define ai instance outside the component to avoid re-creation on re-renders
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface Message {
    role: 'user' | 'model';
    text?: string;
    imageUrl?: string;
    imageName?: string;
}

const AIChat: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const chatSession = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'أنت مساعد ذكاء اصطناعي مفيد وودود. تحدث باللغة العربية.',
            },
        });
        setChat(chatSession);
        const initialMessage: Message = { 
            role: 'model', 
            text: 'مرحباً بك في موقع techtouch! كيف يمكنني مساعدتك اليوم؟\n\nلتوليد صورة، ابدأ رسالتك بكلمة "ارسم"، مثلاً: "ارسم قطة تركب دراجة".'
        };
        setMessages([initialMessage]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    const handleSaveImage = (imageUrl: string, imageName: string = 'ai-generated-image') => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `${imageName}.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || !chat || isLoading) return;

        const userMessageText = userInput;
        const userMessage: Message = { role: 'user', text: userMessageText };
        setMessages(prev => [...prev, userMessage]);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        const isImageRequest = userMessageText.trim().toLowerCase().startsWith('ارسم');

        try {
            if (isImageRequest) {
                const imagePrompt = userMessageText.replace(/^ارسم/i, '').trim();

                if (!imagePrompt) {
                    const errorMessage = { role: 'model', text: '⚠️ يرجى تقديم وصف للصورة بعد كلمة "ارسم".' };
                    setMessages(prev => [...prev, errorMessage]);
                    setIsLoading(false);
                    return;
                }

                setMessages(prev => [...prev, { role: 'model', text: `🎨 جاري توليد صورة لـ: "${imagePrompt}"...` }]);
                
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt: imagePrompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
                });

                if (!response.generatedImages || response.generatedImages.length === 0) {
                    throw new Error("API did not return any images.");
                }
                
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                const imageName = imagePrompt.slice(0, 30).replace(/[^a-zA-Z0-9أ-ي-]/g, '_');

                const imageMessage: Message = { role: 'model', imageUrl, imageName };

                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = imageMessage;
                    return newMessages;
                });

            } else {
                const responseStream = await chat.sendMessageStream({ message: userMessageText });
                let modelResponse = '';
                setMessages(prev => [...prev, { role: 'model', text: '' }]);

                for await (const chunk of responseStream) {
                    modelResponse += chunk.text;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        newMessages[newMessages.length - 1].text = modelResponse;
                        return newMessages;
                    });
                }
            }
        } catch (err) {
            console.error("Error sending message:", err);

            if (isImageRequest) {
                let errorText = '⚠️ فشل توليد الصورة.\nحدث خطأ غير متوقع. يرجى المحاولة مرة أخرى بعد قليل.';
                if (err instanceof Error) {
                    if (err.message.toLowerCase().includes('policy') || err.message.toLowerCase().includes('safety')) {
                         errorText = '⚠️ فشل توليد الصورة.\nقد يخالف الطلب سياسات المحتوى. يرجى محاولة وصف مختلف وأكثر عمومية.';
                    } else if (err.message.includes('API key')) {
                        errorText = '⚠️ حدث خطأ في الاتصال بالخادم. يرجى التحقق من الإعدادات والمحاولة لاحقاً.';
                    }
                }
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.role === 'model' && lastMessage.text?.startsWith('🎨')) {
                        lastMessage.text = errorText;
                        return newMessages;
                    }
                    return [...prev, { role: 'model', text: errorText }];
                });
            } else {
                let errorMessage = 'عذراً، حدث خطأ أثناء التواصل مع الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
                if (err instanceof Error && err.message.includes('API key')) {
                    errorMessage = 'حدث خطأ في الاتصال بالخادم. يرجى التحقق من إعدادات الاتصال والمحاولة لاحقاً.';
                }
                setError(errorMessage);
                
                setMessages(prev => {
                    const lastMessage = prev[prev.length - 1];
                    if (lastMessage && lastMessage.role === 'model' && lastMessage.text === '') {
                        return prev.slice(0, -1);
                    }
                    return prev;
                });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-20rem)] max-h-[700px] p-4 sm:p-6 rounded-lg shadow-xl animate-fadeIn" style={{ backgroundColor: 'var(--color-header-bg)' }}>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center">محادثة مع الذكاء الاصطناعي</h2>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <span className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700">
                                <SparklesIcon className="w-5 h-5" style={{ color: 'var(--color-primary-focus)' }} />
                            </span>
                        )}
                        <div className={`max-w-md lg:max-w-2xl p-3 rounded-xl ${msg.role === 'user' ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-200'}`} style={msg.role === 'user' ? { backgroundColor: 'var(--color-primary)' } : {}}>
                            {msg.text && <p className="whitespace-pre-wrap text-sm sm:text-base">{msg.text || '...'}</p>}
                             {msg.imageUrl && (
                                <div className="relative group">
                                    <img src={msg.imageUrl} alt={msg.imageName || 'Generated image'} className="rounded-lg max-w-full" />
                                    <button
                                        onClick={() => handleSaveImage(msg.imageUrl, msg.imageName)}
                                        className="absolute bottom-2 right-2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        title="حفظ الصورة"
                                        aria-label="حفظ الصورة"
                                    >
                                        <DownloadIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            {error && <p className="mt-2 p-3 rounded-lg bg-red-900/50 text-red-300 text-center w-full">{error}</p>}
            <div className="mt-4 pt-4 border-t border-gray-700 flex items-end gap-2 sm:gap-3">
                <textarea
                    ref={textareaRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    rows={1}
                    className="flex-grow bg-gray-700 text-white placeholder-gray-400 rounded-lg p-2 sm:p-3 focus:outline-none focus:ring-2 ring-primary resize-none"
                    style={{ maxHeight: '150px' }}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !userInput.trim()}
                    aria-label="Send message"
                    className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full transition-all duration-300 transform hover:scale-110 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <SendIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
                </button>
            </div>
        </div>
    );
};

export default AIChat;
