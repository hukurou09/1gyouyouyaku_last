import React, { useState, useEffect, useCallback } from 'react';
import Spinner from './components/Spinner';
import Toast from './components/Toast';
// import Spinner from './components/Spinner'; // To be created
// import Toast from './components/Toast'; // To be created

function App() {
  const [url, setUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeToast, setActiveToast] = useState(null); // Stores the current toast object
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const showToast = useCallback((message, type = 'error', duration = 3000) => {
    const id = Date.now();
    setActiveToast({ id, message, type, duration });
  }, []);

  const dismissToast = useCallback((id) => {
    setActiveToast(current => (current && current.id === id ? null : current));
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      showToast('URLを入力してください。', 'error');
      return;
    }
    try {
      new URL(url); // Basic URL validation
    } catch (_) {
      showToast('無効なURL形式です。', 'error');
      return;
    }

    setIsLoading(true);
    setSummary('');

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Attempt to parse error from Vercel/Netlify function or custom backend
        const errorMsg = data?.error?.message || data?.error || data?.message || `HTTP error! status: ${response.status}`;
        throw new Error(errorMsg);
      }
      if (!data.summary) {
        throw new Error('APIから有効な要約が返されませんでした。');
      }
      setSummary(data.summary);
      showToast('要約が完了しました！', 'success', 2000);
    } catch (err) {
      console.error('API Error:', err);
      showToast(err.message || '要約の取得中にエラーが発生しました。', 'error');
    }
    setIsLoading(false);
  };

  const handleCopySummary = () => {
    if (summary) {
      navigator.clipboard.writeText(summary)
        .then(() => {
          showToast('コピーしました！', 'info', 1500);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          showToast('コピーに失敗しました。', 'error');
        });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors duration-300 selection:bg-sky-300 selection:text-sky-900">
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 dark:focus-visible:ring-offset-slate-800 transition-colors"
        aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-yellow-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-6.364-.386 1.591-1.591M3 12h2.25m.386-6.364 1.591 1.591" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-700">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          </svg>
        )}
      </button>

      <main className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl rounded-lg p-6 md:p-8 transform transition-all duration-500 ease-out">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 text-slate-700 dark:text-slate-200">
          URL 一行要約
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="urlInput" className="sr-only">URL</label>
            <input
              id="urlInput"
              type="url" // Changed to type="url" for better semantics and potential browser validation
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400 focus:border-sky-500 dark:focus:border-sky-400 outline-none transition-colors bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
              disabled={isLoading}
              required // Added basic required attribute
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white font-semibold py-3 px-4 rounded-md transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner size="h-5 w-5" color="text-white" inline={true} />
                <span className="ml-2">処理中...</span>
              </>
            ) : (
              '要約する'
            )}
          </button>
        </form>

        {summary && !isLoading && (
          <div
            className="mt-6 p-4 bg-slate-50 dark:bg-slate-700 rounded-md animate-fadeIn group relative cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            onClick={handleCopySummary}
            title="クリックしてコピー"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleCopySummary()}
          >
            <p className="text-slate-700 dark:text-slate-200 text-center select-text break-all">{summary}</p>
            <span className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-slate-600 dark:bg-slate-200 text-white dark:text-slate-700 px-1.5 py-0.5 rounded shadow-md select-none">コピー</span>
          </div>
        )}
      </main>

      <Toast toastInfo={activeToast} onDismiss={dismissToast} />

      <footer className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
        Powered by Google Gemini & Vite. 
        {/* Consider adding a link to your repository if public */}
        {/* <a href="#" target="_blank" rel="noopener noreferrer" className="hover:underline">GitHub</a> */}
      </footer>
    </div>
  );
}

export default App;
