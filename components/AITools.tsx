import React, { useState } from 'react';
import AIChat from './AIChat';
import GeminiImageGenerator from './GeminiImageGenerator';
import { ChatBubbleIcon, ImageIcon } from './Icons';

// A map to store component references and their metadata.
const toolComponents = {
  chat: {
    Component: AIChat,
    title: 'محادثة Gemini',
    description: 'تحدث مع Gemini لطرح الأسئلة والحصول على إجابات.',
    icon: <ChatBubbleIcon className="w-8 h-8 text-red-400" />,
  },
  geminiImage: {
    Component: GeminiImageGenerator,
    title: 'مولّد الصور (Gemini)',
    description: 'أنشئ صوراً باستخدام نموذج Imagen من Gemini.',
    icon: <ImageIcon className="w-8 h-8 text-red-400" />,
  },
};

type ToolKey = keyof typeof toolComponents;

const ToolCard: React.FC<{ toolKey: ToolKey; onClick: () => void }> = ({ toolKey, onClick }) => {
  const { title, description, icon } = toolComponents[toolKey];
  return (
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
};


const AITools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolKey | 'selection'>('selection');

  if (activeTool === 'selection') {
    return (
      <div className="animate-fadeIn">
        <h2 className="text-3xl font-bold text-center mb-8">أدوات الذكاء الاصطناعي</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {(Object.keys(toolComponents) as ToolKey[]).map((key) => (
            <ToolCard key={key} toolKey={key} onClick={() => setActiveTool(key)} />
          ))}
        </div>
      </div>
    );
  }

  const handleBackToSelection = () => setActiveTool('selection');
  const { Component } = toolComponents[activeTool];

  return (
    <div className="animate-fadeIn">
      <button onClick={handleBackToSelection} className="mb-6 text-sm sm:text-base hover:text-red-300 transition-colors duration-300 font-semibold" style={{ color: 'var(--color-primary-focus)' }}>
        &larr; العودة إلى أدوات AI
      </button>
      <Component />
    </div>
  );
};

export default AITools;