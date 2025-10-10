import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, State> {
  // Fix: Replaced constructor with a class field for state initialization.
  // The previous constructor-based approach was causing TypeScript errors where `this.state`
  // and `this.props` were not recognized on the component instance. Using a class field
  // is a more modern and direct way to initialize state in a class component.
  state: State = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-gray-900 min-h-screen text-white flex items-center justify-center p-4">
            <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <h1 className="text-3xl sm:text-4xl font-bold text-red-500 mb-4">حدث خطأ ما</h1>
                <p className="text-gray-300 mb-6">نأسف، لقد واجه التطبيق مشكلة غير متوقعة.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300 w-full sm:w-auto btn-primary"
                >
                    إعادة تحميل الصفحة
                </button>
            </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
