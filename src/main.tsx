import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Check for Firebase configuration
const isConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY;

const MissingConfig = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
    <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-red-500/20">
      <h1 className="text-2xl font-bold text-red-500 mb-4">Configuration Missing</h1>
      <p className="text-gray-300 mb-6">
        The application could not start because the Firebase configuration is missing.
      </p>
      <div className="bg-black/30 p-4 rounded text-sm text-gray-400 font-mono mb-6">
        src/.env
      </div>
      <p className="text-gray-400 text-sm">
        Please ensure you have created a <code className="text-blue-400">.env</code> file in the root directory with the required variables. See <code className="text-blue-400">.env.example</code> for reference.
      </p>
    </div>
  </div>
);

const Loader = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-white text-xl">Loading Qahoot...</div>
  </div>
);

const Root = () => {
  const [App, setApp] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    if (isConfigured) {
      import('./App').then(module => {
        setApp(() => module.default);
      }).catch(err => {
        console.error('Failed to load App:', err);
      });
    }
  }, []);

  if (!isConfigured) {
    return <MissingConfig />;
  }

  if (!App) {
    return <Loader />;
  }

  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
