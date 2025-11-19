import React, { useState, useCallback, useEffect } from 'react';
import { AppMode, SUPPORTED_LANGUAGES, ContextExample, HistoryItem } from './types';
import { generateVariations, generateContextExamples } from './services/geminiService';
import { ArrowRightIcon, ArrowRightLeftIcon, SparklesIcon, CopyIcon, BookOpenIcon, ListRestartIcon, HistoryIcon } from './components/Icons';
import HistorySidebar from './components/HistorySidebar';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.VARIATIONS);
  const [sourceLang, setSourceLang] = useState<string>('it');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // State for results
  const [variationResults, setVariationResults] = useState<string[]>([]);
  const [contextResults, setContextResults] = useState<ContextExample[]>([]);
  const [error, setError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('linguist_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const saveToHistory = (item: HistoryItem) => {
    const updatedHistory = [item, ...history].slice(0, 50); // Keep last 50
    setHistory(updatedHistory);
    localStorage.setItem('linguist_history', JSON.stringify(updatedHistory));
  };

  const handleDeleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('linguist_history', JSON.stringify(updatedHistory));
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([]);
      localStorage.removeItem('linguist_history');
    }
  };

  const handleRestoreHistoryItem = (item: HistoryItem) => {
    setMode(item.mode);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
    setInputText(item.inputText);
    setError(null);
    
    if (item.mode === AppMode.VARIATIONS && item.variationResults) {
      setVariationResults(item.variationResults);
      setContextResults([]);
    } else if (item.mode === AppMode.CONTEXT && item.contextResults) {
      setContextResults(item.contextResults);
      setVariationResults([]);
    }
    
    setIsHistoryOpen(false);
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setVariationResults([]);
    setContextResults([]);

    try {
      const sLangName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const tLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

      if (mode === AppMode.VARIATIONS) {
        const res = await generateVariations(sLangName, tLangName, inputText);
        setVariationResults(res);
        
        // Save to history
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: AppMode.VARIATIONS,
          sourceLang,
          targetLang,
          inputText,
          variationResults: res
        });

      } else {
        const res = await generateContextExamples(sLangName, tLangName, inputText);
        setContextResults(res);

        // Save to history
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: AppMode.CONTEXT,
          sourceLang,
          targetLang,
          inputText,
          contextResults: res
        });
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inputText, mode, sourceLang, targetLang, history]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleTranslate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans selection:bg-blue-100">
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onSelect={handleRestoreHistoryItem}
        onDelete={handleDeleteHistoryItem}
        onClear={handleClearHistory}
      />

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600">
            <SparklesIcon />
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">LinguistAI</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => { setMode(AppMode.VARIATIONS); setVariationResults([]); setContextResults([]); setError(null); }}
                className={`px-3 md:px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                  mode === AppMode.VARIATIONS 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ListRestartIcon />
                <span className="hidden sm:inline">Variations</span>
              </button>
              <button
                onClick={() => { setMode(AppMode.CONTEXT); setVariationResults([]); setContextResults([]); setError(null); }}
                className={`px-3 md:px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                  mode === AppMode.CONTEXT 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <BookOpenIcon />
                <span className="hidden sm:inline">Context</span>
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 mx-1"></div>

            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="History"
            >
              <HistoryIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Control Bar */}
        <div className="bg-white rounded-t-2xl border border-gray-200 shadow-sm mb-0 relative z-0">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-2 flex-1">
              <select 
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="appearance-none bg-transparent text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleSwapLanguages}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
              aria-label="Swap languages"
            >
              <ArrowRightLeftIcon />
            </button>

            <div className="flex items-center justify-end gap-2 flex-1">
               <select 
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="appearance-none bg-transparent text-blue-600 font-medium hover:bg-blue-50 px-3 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors text-right"
              >
                {SUPPORTED_LANGUAGES.map(l => (
                  <option key={l.code} value={l.code}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Input Area */}
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mode === AppMode.VARIATIONS ? "Enter phrase to translate..." : "Enter a word for context examples..."}
              className="w-full p-6 text-2xl md:text-3xl bg-transparent outline-none min-h-[160px] resize-none text-gray-800 placeholder:text-gray-300 font-light"
              spellCheck={false}
            />
            {inputText && (
              <button 
                onClick={() => setInputText('')}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Area (floating overlap) */}
        <div className="flex justify-end -mt-5 mr-6 relative z-10">
          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className={`h-12 w-12 md:w-auto md:px-6 md:h-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-300 
              ${loading || !inputText.trim() ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200 hover:-translate-y-0.5 text-white'}`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span className="hidden md:inline font-medium">
                  {mode === AppMode.VARIATIONS ? 'Translate' : 'Generate'}
                </span>
                <ArrowRightIcon />
              </>
            )}
          </button>
        </div>

        {/* Output Area */}
        {(variationResults.length > 0 || contextResults.length > 0 || error) && (
          <div className="mt-6 animate-fade-in">
            {error ? (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">
                {error}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {mode === AppMode.VARIATIONS ? 'Variations' : 'Contextual Examples'}
                  </span>
                  <span className="text-xs text-gray-400">Generated by Gemini 3</span>
                </div>
                
                <div className="divide-y divide-gray-50">
                  {mode === AppMode.VARIATIONS && variationResults.map((item, idx) => (
                    <div key={idx} className="p-5 hover:bg-gray-50 transition-colors group flex items-start justify-between gap-4">
                      <p className="text-lg text-gray-800 leading-relaxed">{item}</p>
                      <button 
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all"
                        onClick={() => navigator.clipboard.writeText(item)}
                        title="Copy text"
                      >
                        <CopyIcon />
                      </button>
                    </div>
                  ))}

                  {mode === AppMode.CONTEXT && contextResults.map((item, idx) => (
                    <div key={idx} className="p-6 hover:bg-gray-50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-lg font-medium text-gray-900">{item.original}</p>
                        <button 
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all mt-1"
                          onClick={() => navigator.clipboard.writeText(`${item.original}\n${item.translated}`)}
                          title="Copy pair"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <p className="text-base text-gray-500 font-light">{item.translated}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
