import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// قم بإلغاء تسجيل جميع عمال الخدمة النشطين لإصلاح مشكلات التخزين المؤقت المحتملة.
// تمت إضافة هذا الرمز لضمان حصول المستخدمين الذين لديهم عامل خدمة قديم ومعيب
// على الإصدار الجديد من الموقع بشكل صحيح.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length > 0) {
        console.log('Unregistering existing Service Workers...');
        for(const registration of registrations) {
          registration.unregister();
          console.log('Service Worker unregistered:', registration.scope);
        }
      }
    }).catch(function(err) {
      console.error('Failed to get Service Worker registrations:', err);
    });
  });
}


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);