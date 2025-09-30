import React, { useState } from 'react';
import AIChat from './ImageEditor';
import AIImageGenerator from './AIImageGenerator';
import GeminiImageEditor from './GeminiImageEditor';
import { ChatBubbleIcon, ImageIcon, SparklesIcon } from './Icons';

const AITools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<'selection' | 'chat' | 'cfImage' | 'geminiImageEditor'>('selection');

  const ToolCard = ({ icon, title, description, onClick }: { icon: React.ReactNode, title: string, description: string, onClick: () => void }) => (
    <div
      onClick={onClick}
      className="p-6 rounded-lg shadow-lg cursor-pointer transition-all duration-300 transform hover:scale-105 border border-gray-700 hover:border-red-500"
      style={{ backgroundColor: 'var(--color-card-bg)' }}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gray-800 mb-4 mx-auto">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-center mb-2" style={{ color: 'var(--color-card-title)' }}>{title}</h3>
      <p className="text-center text-gray-400" style={{ color: 'var(--color-card-description)' }}>{description}</p>
    </div>
  );

  if (activeTool === 'selection') {
    return (
      <div className="animate-fadeIn">
        <h2 className="text-3xl font-bold text-center mb-8">أدوات الذكاء الاصطناعي</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <ToolCard 
            icon={<ChatBubbleIcon className="w-8 h-8 text-red-400" />}
            title="محادثة Gemini"
            description="تحدث مع Gemini لطرح الأسئلة والحصول على إجابات."
            onClick={() => setActiveTool('chat')}
          />
          <ToolCard 
            icon={<ImageIcon className="w-8 h-8 text-red-400" />}
            title="توليد الصور (Cloudflare)"
            description="أنشئ صوراً فريدة من وصف نصي باستخدام الذكاء الاصطناعي."
            onClick={() => setActiveTool('cfImage')}
          />
           <ToolCard 
            icon={<SparklesIcon className="w-8 h-8 text-red-400" />}
            title="تعديل الصور (Gemini)"
            description="عدّل على صورك بإضافة أو إزالة عناصر عبر وصف نصي."
            onClick={() => setActiveTool('geminiImageEditor')}
          />
        </div>
      </div>
    );
  }

  const handleBackToSelection = () => setActiveTool('selection');

  return (
    <div>
      <button onClick={handleBackToSelection} className="mb-6 text-sm sm:text-base hover:text-red-300 transition-colors duration-300 font-semibold" style={{ color: 'var(--color-primary-focus)' }}>
        &larr; العودة إلى أدوات AI
      </button>
      {activeTool === 'chat' && <AIChat />}
      {activeTool === 'cfImage' && <AIImageGenerator />}
      {activeTool === 'geminiImageEditor' && <GeminiImageEditor />}
    </div>
  );
};

export default AITools;