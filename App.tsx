import React, { useState } from 'react';
import { CommentInput, CommentResponse } from './types';
import { generateComments } from './services/geminiService';
import InputForm from './components/InputForm';
import CommentList from './components/CommentList';
import { Bot, Info, Zap, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<'input' | 'results'>('input');
  const [isLoading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<CommentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (data: CommentInput) => {
    setIsLoading(true);
    setError(null);
    setApiResponse(null);
    
    // In an extension, we usually transition to the loading/result view immediately
    try {
      const result = await generateComments(data);
      setApiResponse(result);
      setView('results');
    } catch (err) {
      setError("Failed to generate. Check network/API key.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setView('input');
    setApiResponse(null);
    setError(null);
  };

  return (
    <div className="w-full min-h-[500px] bg-slate-50 flex flex-col">
      
      {/* Compact Extension Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          {view === 'results' ? (
             <button onClick={handleReset} className="p-1 -ml-2 rounded-full hover:bg-slate-100 transition-colors">
               <ChevronLeft className="w-5 h-5 text-slate-600" />
             </button>
          ) : (
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white">
              <Zap className="w-4 h-4 fill-white" />
            </div>
          )}
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            CommentCraft <span className="text-indigo-600">Lite</span>
          </h1>
        </div>
        <a 
          href="https://ai.google.dev" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] text-slate-400 hover:text-indigo-600 font-medium flex items-center gap-1"
        >
          Gemini <Info className="w-3 h-3" />
        </a>
      </header>

      <main className="flex-1 p-4 overflow-y-auto">
        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg mb-4 text-xs flex items-start gap-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/90 z-40 flex flex-col items-center justify-center p-6 space-y-4 animate-in fade-in duration-200">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            <p className="text-sm text-slate-600 font-medium animate-pulse">Drafting brilliance...</p>
          </div>
        )}

        {/* Input View */}
        <div className={view === 'input' ? 'block' : 'hidden'}>
           <div className="space-y-4">
              <div className="bg-indigo-50/50 rounded-lg p-3 border border-indigo-100/50">
                <p className="text-xs text-indigo-900 leading-snug flex gap-2">
                  <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  Paste post content below. We'll handle the tone and style automatically.
                </p>
              </div>
              <InputForm onSubmit={handleGenerate} isLoading={isLoading} />
           </div>
        </div>

        {/* Results View */}
        <div className={view === 'results' ? 'block' : 'hidden'}>
           <CommentList response={apiResponse} onReset={handleReset} />
        </div>

      </main>
    </div>
  );
};

export default App;
