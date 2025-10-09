import React, { useState } from 'react';
import { DownloadIcon } from './Icons';

const Backup: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBackup = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('/.netlify/functions/backup');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'فشل إنشاء النسخة الاحتياطية.');
            }
            const { filename, data } = await response.json();
            
            // Decode base64 and trigger download
            const byteCharacters = atob(data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/zip' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

        } catch (err) {
            console.error('Backup failed:', err);
            setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 rounded-lg shadow-xl animate-fadeIn" style={{ backgroundColor: 'var(--color-header-bg)' }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6">النسخ الاحتياطي والاستعادة</h2>
            
            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-red-400" style={{ color: 'var(--color-primary-focus)' }}>أخذ نسخة احتياطية</h3>
                <p className="text-gray-300 mb-6">
                    انقر على الزر أدناه لإنشاء نسخة احتياطية كاملة من جميع منشوراتك، تصنيفاتك، وإعدادات الموقع. سيتم تنزيل ملف ZIP يحتوي على كل المحتوى.
                </p>
                <div className="text-center">
                    <button
                        onClick={handleBackup}
                        disabled={isLoading}
                        className="w-full sm:w-auto flex-shrink-0 inline-flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <DownloadIcon className="w-5 h-5" />
                        )}
                        <span>{isLoading ? 'جاري الإنشاء...' : 'إنشاء وتنزيل النسخة الاحتياطية'}</span>
                    </button>
                </div>
                {error && <p className="mt-4 p-3 rounded-lg bg-red-900/50 text-red-300 text-center w-full">{error}</p>}
            </div>

            <div className="mt-8 bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-4 text-red-400" style={{ color: 'var(--color-primary-focus)' }}>استعادة نسخة احتياطية</h3>
                <p className="text-gray-300 mb-4">
                    للاستعادة من نسخة احتياطية، يجب رفع الملفات يدوياً إلى مستودع المشروع على Git. هذه عملية حساسة وتتطلب معرفة تقنية.
                </p>
                <ol className="list-decimal list-inside space-y-3 text-gray-400">
                    <li>قم بفك ضغط ملف الـ ZIP الذي قمت بتنزيله.</li>
                    <li>ستجد مجلد `content` وملفات `settings.json` و `profile.json`.</li>
                    <li>قم برفع محتويات مجلد `content` إلى نفس المجلد في مشروعك، مع استبدال الملفات الموجودة.</li>
                    <li>قم برفع ملفات `settings.json` و `profile.json` إلى مجلد `public` في مشروعك، مع استبدال الملفات الموجودة.</li>
                    <li>بعد رفع الملفات، يجب إعادة نشر الموقع لتظهر التغييرات.</li>
                </ol>
                <p className="mt-4 text-sm text-yellow-400 bg-yellow-900/30 p-3 rounded-lg">
                    <strong>تحذير:</strong> استعادة نسخة قديمة سيؤدي إلى حذف أي تغييرات قمت بها بعد تاريخ أخذ تلك النسخة. إذا لم تكن متأكداً، يرجى التواصل مع مطور الموقع للمساعدة.
                </p>
            </div>
        </div>
    );
};

export default Backup;
