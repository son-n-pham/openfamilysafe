import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Card } from '../components/UI';
import { fetchProxiedContent, getProxyMode } from '../services/proxyService';
import { useAuth } from '../services/authContext';
import { FilterLevel } from '../types';

const Dashboard: React.FC = () => {
  const { userProfile, currentUser } = useAuth();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Allow exiting full screen with Escape key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleBrowse = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url) return;

    // Basic client-side validation for UX
    let target = url;
    if (!target.startsWith('http')) {
      target = `https://${target}`;
    }

    setIsLoading(true);
    setContent(null);
    setIsFullScreen(false);

    try {
      // Pass the currentUser (which might be a simulated user) to the service
      const result = await fetchProxiedContent(target, currentUser);
      setContent(result);
    } catch (error: any) {
      console.error(error);
      const proxyMode = getProxyMode();
      
      const errorContent = `
        <div style="text-align: center; color: #dc2626; padding: 40px; font-family: sans-serif;">
          <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">Unable to Access Site</h2>
          <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">${error.message || "An unexpected error occurred."}</p>
          
          <div style="max-w-lg mx-auto text-left padding: 1.5rem; background-color: #fef2f2; border-radius: 0.5rem; border: 1px solid #fee2e2; padding: 20px;">
            ${proxyMode === 'DEMO' ? `
              <h3 style="font-weight: bold; color: #991b1b; margin-bottom: 0.5rem;">⚠️ Using Public Demo Proxy</h3>
              <p style="font-size: 0.9rem; color: #7f1d1d;">Major sites (Google, Facebook, YouTube) usually block the public demo proxy used in this preview.</p>
              <p style="font-size: 0.9rem; color: #7f1d1d; margin-top: 0.5rem;"><strong>Try testing:</strong> wikipedia.org, example.com, or basic HTML sites.</p>
              <p style="font-size: 0.9rem; color: #7f1d1d; margin-top: 1rem;">To fix this, ensure you have deployed your Cloudflare Worker and updated <code>services/proxyService.ts</code>.</p>
            ` : `
              <h3 style="font-weight: bold; color: #1e40af; margin-bottom: 0.5rem;">🔧 Cloudflare Worker Error</h3>
              <p style="font-size: 0.9rem; color: #1e3a8a;">You are connected to your custom Worker, but it failed to retrieve the page.</p>
              <ul style="list-style-type: disc; margin-left: 1.5rem; margin-top: 0.5rem; font-size: 0.9rem; color: #1e3a8a;">
                <li>The target site might be blocking headless requests.</li>
                <li>Your Worker deployment might have hit a CPU/Memory limit.</li>
                <li>Check your Cloudflare Dashboard > Workers > Logs for details.</li>
              </ul>
            `}
          </div>
        </div>
      `;
      setContent(errorContent);
    } finally {
      setIsLoading(false);
    }
  }, [url, currentUser]);

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Secure Family Browsing
        </h1>
        <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
          Enter a website URL below to browse safely through the family filter.
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
           Current Safety Level: {userProfile?.filterLevel || FilterLevel.MODERATE}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto p-6 bg-white shadow-lg border border-gray-100">
        <form onSubmit={handleBrowse} className="flex gap-4 items-end">
          <div className="flex-grow">
            <Input
              placeholder="e.g., wikipedia.org"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="text-lg"
              autoFocus
            />
          </div>
          <Button type="submit" size="lg" className="h-[42px] px-8" isLoading={isLoading}>
            Go
          </Button>
        </form>
      </Card>

      {content && (
        <div className={isFullScreen ? "fixed inset-0 z-50 bg-white flex flex-col animate-in fade-in duration-200" : "max-w-6xl mx-auto mt-8 animate-fade-in"}>
          {/* Header / Toolbar */}
          <div className={`flex justify-between items-center ${isFullScreen ? 'px-4 py-2 bg-gray-100 border-b border-gray-300 shadow-md' : 'mb-4 px-2'}`}>
            {isFullScreen ? (
                 /* Full Screen Browser-like Bar */
                 <div className="w-full flex justify-between items-center gap-4">
                     <div className="flex-grow max-w-3xl mx-auto flex items-center bg-white border border-gray-300 rounded-md px-3 py-1.5 shadow-sm text-sm text-gray-700">
                        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        <span className="truncate">{url}</span>
                     </div>
                     <Button variant="secondary" onClick={() => setIsFullScreen(false)} size="sm" className="whitespace-nowrap">
                         Exit Full Screen (Esc)
                     </Button>
                 </div>
            ) : (
                /* Standard Dashboard Header */
                <>
                    <h2 className="text-lg font-medium text-gray-900">Result for: {url}</h2>
                    <div className="flex items-center gap-3">
                        <div className="space-x-1 bg-white p-1 rounded-lg border shadow-sm flex">
                            <button 
                                onClick={() => setViewMode('preview')}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'preview' ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                Preview
                            </button>
                            <button 
                                onClick={() => setViewMode('code')}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'code' ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                Raw HTML
                            </button>
                        </div>
                        {viewMode === 'preview' && (
                            <button 
                                onClick={() => setIsFullScreen(true)} 
                                className="p-2 text-gray-500 hover:text-brand-600 hover:bg-gray-100 rounded-md transition-colors"
                                title="Enter Full Screen"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                            </button>
                        )}
                    </div>
                </>
            )}
          </div>
          
          {/* Content Container */}
          <div className={`bg-white overflow-hidden ${isFullScreen ? 'flex-grow w-full h-full overflow-auto' : 'rounded-lg shadow-sm border border-gray-200 min-h-[500px]'}`}>
            {viewMode === 'preview' ? (
                <div 
                    className={`w-full h-full bg-white ${isFullScreen ? '' : 'p-4'}`}
                    dangerouslySetInnerHTML={{ __html: content }} 
                />
            ) : (
                <pre className={`w-full overflow-auto p-4 bg-gray-900 text-green-400 text-xs font-mono ${isFullScreen ? 'h-full' : 'h-[500px]'}`}>
                    {content}
                </pre>
            )}
          </div>
        </div>
      )}

      {!content && !isLoading && (
        <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
                { title: 'Educational', desc: 'Wikipedia, Khan Academy, and verified educational resources are always allowed.', color: 'green' },
                { title: 'Social Media', desc: 'Access to social platforms is restricted based on time of day and user role.', color: 'yellow' },
                { title: 'Blocked Content', desc: 'Adult content, gambling, and malicious sites are strictly blocked.', color: 'red' }
            ].map((item, i) => (
                <div key={i} className="bg-white overflow-hidden shadow rounded-lg border-t-4" style={{ borderColor: item.color === 'green' ? '#10b981' : item.color === 'yellow' ? '#f59e0b' : '#ef4444'}}>
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-base font-semibold text-gray-900">{item.title}</dt>
                        <dd className="mt-1 text-sm text-gray-500">{item.desc}</dd>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;