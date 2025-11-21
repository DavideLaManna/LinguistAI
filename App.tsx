import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AppMode, SUPPORTED_LANGUAGES, ContextExample, HistoryItem, ParaphraseTone, PARAPHRASE_TONES, ParaphraseState, ModelType } from './types';
import { generateVariations, generateContextExamples, simpleTranslate, rephraseText } from './services/geminiService';
import { ArrowRightIcon, ArrowRightLeftIcon, SparklesIcon, CopyIcon, BookOpenIcon, ListRestartIcon, HistoryIcon, FeatherIcon, RefreshCwIcon, Volume2Icon, ZapIcon, StarsIcon, SunIcon, MoonIcon } from './components/Icons';
import HistorySidebar from './components/HistorySidebar';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.VARIATIONS);
  
  // Global Settings
  const [sourceLang, setSourceLang] = useState<string>('it');
  const [targetLang, setTargetLang] = useState<string>('en');
  const [selectedModel, setSelectedModel] = useState<ModelType>('fast');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  // Standard Mode State (Variations & Context)
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [variationResults, setVariationResults] = useState<string[]>([]);
  const [contextResults, setContextResults] = useState<ContextExample[]>([]);
  
  // Paraphrase Mode State
  const [paraLeftText, setParaLeftText] = useState<string>('');
  const [paraRightText, setParaRightText] = useState<string>('');
  const [isTypingLeft, setIsTypingLeft] = useState<boolean>(false);
  const [isTypingRight, setIsTypingRight] = useState<boolean>(false);
  const [isTranslatingPara, setIsTranslatingPara] = useState<boolean>(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Tones for Paraphrase
  const [leftTone, setLeftTone] = useState<ParaphraseTone>(ParaphraseTone.STANDARD);
  const [rightTone, setRightTone] = useState<ParaphraseTone>(ParaphraseTone.STANDARD);

  const [error, setError] = useState<string | null>(null);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Initialize Dark Mode
  useEffect(() => {
    const savedTheme = localStorage.getItem('linguist_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('linguist_theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('linguist_theme', 'dark');
      setIsDarkMode(true);
    }
  };

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
    setError(null);
    if(item.modelType) setSelectedModel(item.modelType);
    
    if (item.mode === AppMode.VARIATIONS && item.variationResults) {
      setInputText(item.inputText);
      setVariationResults(item.variationResults);
      setContextResults([]);
    } else if (item.mode === AppMode.CONTEXT && item.contextResults) {
      setInputText(item.inputText);
      setContextResults(item.contextResults);
      setVariationResults([]);
    } else if (item.mode === AppMode.PARAPHRASE && item.paraphraseResult) {
      setParaLeftText(item.paraphraseResult.sourceText);
      setParaRightText(item.paraphraseResult.targetText);
    }
    
    setIsHistoryOpen(false);
  };

  const handleSwapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    
    if (mode === AppMode.PARAPHRASE) {
        const temp = paraLeftText;
        setParaLeftText(paraRightText);
        setParaRightText(temp);
    }
  };

  const resetResults = () => {
    setVariationResults([]);
    setContextResults([]);
    setParaLeftText('');
    setParaRightText('');
    setError(null);
  };

  // Standard Mode Translation (Manual Button Click)
  const handleStandardTranslate = useCallback(async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    setError(null);
    setVariationResults([]);
    setContextResults([]);

    try {
      const sLangName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
      const tLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

      if (mode === AppMode.VARIATIONS) {
        const res = await generateVariations(sLangName, tLangName, inputText, selectedModel);
        setVariationResults(res);
        
        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: AppMode.VARIATIONS,
          sourceLang,
          targetLang,
          inputText,
          modelType: selectedModel,
          variationResults: res
        });

      } else if (mode === AppMode.CONTEXT) {
        const res = await generateContextExamples(sLangName, tLangName, inputText, selectedModel);
        setContextResults(res);

        saveToHistory({
          id: Date.now().toString(),
          timestamp: Date.now(),
          mode: AppMode.CONTEXT,
          sourceLang,
          targetLang,
          inputText,
          modelType: selectedModel,
          contextResults: res
        });
      } 
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [inputText, mode, sourceLang, targetLang, selectedModel, history]);

  // --------------------------------------------------------------------------------
  // Paraphrase Mode Logic (Auto-Translate & Rephrase)
  // --------------------------------------------------------------------------------

  const performParaphraseTranslation = async (text: string, direction: 'leftToRight' | 'rightToLeft') => {
    if (!text.trim()) {
        if (direction === 'leftToRight') setParaRightText('');
        else setParaLeftText('');
        return;
    }

    setIsTranslatingPara(true);
    try {
        const sLangName = SUPPORTED_LANGUAGES.find(l => l.code === sourceLang)?.name || sourceLang;
        const tLangName = SUPPORTED_LANGUAGES.find(l => l.code === targetLang)?.name || targetLang;

        // Decide Source and Target based on direction
        const actualSource = direction === 'leftToRight' ? sLangName : tLangName;
        const actualTarget = direction === 'leftToRight' ? tLangName : sLangName;

        const translated = await simpleTranslate(actualSource, actualTarget, text, selectedModel);
        
        if (direction === 'leftToRight') {
            setParaRightText(translated);
        } else {
            setParaLeftText(translated);
        }

        // Save to history (debounced)
        saveToHistory({
            id: Date.now().toString(),
            timestamp: Date.now(),
            mode: AppMode.PARAPHRASE,
            sourceLang,
            targetLang,
            inputText: text, // The text user typed
            modelType: selectedModel,
            paraphraseResult: {
                sourceText: direction === 'leftToRight' ? text : translated,
                targetText: direction === 'leftToRight' ? translated : text
            }
        });

    } catch (e) {
        console.error("Translation failed", e);
    } finally {
        setIsTranslatingPara(false);
        setIsTypingLeft(false);
        setIsTypingRight(false);
    }
  };

  const handleParaInputChange = (text: string, side: 'left' | 'right') => {
    // Clear existing timeout
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }

    if (side === 'left') {
        setParaLeftText(text);
        setIsTypingLeft(true);
        setIsTypingRight(false); // Ensure we know who is driving
        
        // Debounce 500ms
        typingTimeoutRef.current = setTimeout(() => {
            performParaphraseTranslation(text, 'leftToRight');
        }, 500);
    } else {
        setParaRightText(text);
        setIsTypingRight(true);
        setIsTypingLeft(false);

        // Debounce 500ms
        typingTimeoutRef.current = setTimeout(() => {
            performParaphraseTranslation(text, 'rightToLeft');
        }, 500);
    }
  };

  // Single Tone Rephrase Logic
  const handleSingleSideRephrase = async (side: 'left' | 'right') => {
    const textToRephrase = side === 'left' ? paraLeftText : paraRightText;
    if (!textToRephrase.trim()) return;

    const langCode = side === 'left' ? sourceLang : targetLang;
    const langName = SUPPORTED_LANGUAGES.find(l => l.code === langCode)?.name || langCode;
    const tone = side === 'left' ? leftTone : rightTone;

    setIsTranslatingPara(true); // Reuse loading state
    try {
        const rephrased = await rephraseText(langName, textToRephrase, tone, selectedModel);
        if (side === 'left') setParaLeftText(rephrased);
        else setParaRightText(rephrased);
    } catch (e) {
        console.error("Rephrase failed", e);
    } finally {
        setIsTranslatingPara(false);
    }
  };

  // --------------------------------------------------------------------------------
  // Utilities
  // --------------------------------------------------------------------------------

  const handleSpeak = (text: string, langCode: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop current playback
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode;
    window.speechSynthesis.speak(utterance);
  };

  const handleKeyDownStandard = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleStandardTranslate();
    }
  };

  const getPlaceHolder = () => {
      switch(mode) {
          case AppMode.VARIATIONS: return "Enter phrase to translate...";
          case AppMode.CONTEXT: return "Enter a word for context examples...";
          default: return "";
      }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/50 flex flex-col transition-colors duration-300">
      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        history={history}
        onSelect={handleRestoreHistoryItem}
        onDelete={handleDeleteHistoryItem}
        onClear={handleClearHistory}
      />

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 shadow-sm transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <SparklesIcon />
            <h1 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-white hidden sm:block">LinguistAI</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">
            {/* Model Selector */}
            <div className="bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg flex shrink-0 transition-colors">
              <button
                onClick={() => setSelectedModel('fast')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedModel === 'fast' 
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <ZapIcon />
                Fast
              </button>
              <button
                onClick={() => setSelectedModel('accurate')}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  selectedModel === 'accurate' 
                  ? 'bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-300 shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <StarsIcon />
                Accurate
              </button>
            </div>

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

            {/* Mode Selector */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shrink-0 transition-colors">
              <button
                onClick={() => { setMode(AppMode.VARIATIONS); resetResults(); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                  mode === AppMode.VARIATIONS 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <ListRestartIcon />
                <span className="hidden md:inline">Variations</span>
              </button>
              <button
                onClick={() => { setMode(AppMode.CONTEXT); resetResults(); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                  mode === AppMode.CONTEXT 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <BookOpenIcon />
                <span className="hidden md:inline">Context</span>
              </button>
              <button
                onClick={() => { setMode(AppMode.PARAPHRASE); resetResults(); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                  mode === AppMode.PARAPHRASE 
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                <FeatherIcon />
                <span className="hidden md:inline">Paraphrase</span>
              </button>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors shrink-0"
              title="History"
            >
              <HistoryIcon />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        
        {/* ------------------------------------------------------- */}
        {/* VIEW: Standard (Variations & Context) */}
        {/* ------------------------------------------------------- */}
        {mode !== AppMode.PARAPHRASE && (
          <>
            {/* Control Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-t-2xl border border-gray-200 dark:border-gray-700 shadow-sm mb-0 relative z-0 max-w-4xl mx-auto transition-colors">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <select 
                    value={sourceLang}
                    onChange={(e) => setSourceLang(e.target.value)}
                    className="appearance-none bg-transparent text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors text-sm md:text-base w-full md:w-auto truncate"
                  >
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code} className="bg-white dark:bg-gray-800">{l.name}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={handleSwapLanguages}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors shrink-0"
                >
                  <ArrowRightLeftIcon />
                </button>

                <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                  <select 
                    value={targetLang}
                    onChange={(e) => setTargetLang(e.target.value)}
                    className="appearance-none bg-transparent text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-gray-700 px-3 py-2 rounded-md cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-colors text-right text-sm md:text-base w-full md:w-auto truncate"
                  >
                    {SUPPORTED_LANGUAGES.map(l => (
                      <option key={l.code} value={l.code} className="bg-white dark:bg-gray-800">{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Input Area */}
              <div className="relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDownStandard}
                  placeholder={getPlaceHolder()}
                  className="w-full p-6 text-2xl md:text-3xl bg-transparent outline-none min-h-[160px] resize-none text-gray-800 dark:text-gray-100 placeholder:text-gray-300 dark:placeholder:text-gray-600 font-light"
                  spellCheck={false}
                />
                {inputText && (
                  <button 
                    onClick={() => setInputText('')}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end -mt-5 mr-6 relative z-10 max-w-4xl mx-auto">
              <button
                onClick={handleStandardTranslate}
                disabled={loading || !inputText.trim()}
                className={`h-12 w-12 md:w-auto md:px-6 md:h-10 rounded-full shadow-lg flex items-center justify-center gap-2 transition-all duration-300 
                  ${loading || !inputText.trim() ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 hover:shadow-blue-200 dark:hover:shadow-none hover:-translate-y-0.5 text-white'}`}
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

            {/* Results Area */}
            {(variationResults.length > 0 || contextResults.length > 0 || error) && (
              <div className="mt-6 animate-fade-in max-w-4xl mx-auto">
                {error && (
                  <div className="p-4 mb-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-800 text-center">
                    {error}
                  </div>
                )}

                {!error && (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
                    <div className="bg-gray-50/50 dark:bg-gray-900/50 px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        {mode === AppMode.VARIATIONS ? 'Variations' : 'Contextual Examples'}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">Generated by Gemini</span>
                    </div>
                    
                    <div className="divide-y divide-gray-50 dark:divide-gray-700">
                      {mode === AppMode.VARIATIONS && variationResults.map((item, idx) => (
                        <div key={idx} className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group flex items-start justify-between gap-4">
                          <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">{item}</p>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                              onClick={() => handleSpeak(item, targetLang)}
                              title="Listen"
                            >
                              <Volume2Icon />
                            </button>
                            <button 
                              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                              onClick={() => navigator.clipboard.writeText(item)}
                              title="Copy text"
                            >
                              <CopyIcon />
                            </button>
                          </div>
                        </div>
                      ))}

                      {mode === AppMode.CONTEXT && contextResults.map((item, idx) => (
                        <div key={idx} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-lg font-medium text-gray-900 dark:text-white">{item.original}</p>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                                onClick={() => handleSpeak(item.original, sourceLang)}
                                title="Listen original"
                              >
                                <Volume2Icon />
                              </button>
                              <button 
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1"
                                onClick={() => navigator.clipboard.writeText(`${item.original}\n${item.translated}`)}
                                title="Copy pair"
                              >
                                <CopyIcon />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-base text-gray-500 dark:text-gray-400 font-light">{item.translated}</p>
                            <button 
                                className="text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
                                onClick={() => handleSpeak(item.translated, targetLang)}
                                title="Listen translation"
                              >
                                <Volume2Icon />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ------------------------------------------------------- */}
        {/* VIEW: Paraphrase (Split View Bidirectional) */}
        {/* ------------------------------------------------------- */}
        {mode === AppMode.PARAPHRASE && (
          <div className="h-full flex flex-col">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-4 flex justify-center items-center gap-4 transition-colors">
                <button onClick={handleSwapLanguages} className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                    <ArrowRightLeftIcon />
                </button>
             </div>

            <div className="grid md:grid-cols-2 gap-4 flex-1 min-h-[400px]">
                
                {/* LEFT PANEL (Source) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
                    {/* Header Left */}
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                         <select 
                            value={sourceLang}
                            onChange={(e) => setSourceLang(e.target.value)}
                            className="bg-transparent font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {SUPPORTED_LANGUAGES.map(l => (
                            <option key={l.code} value={l.code} className="bg-white dark:bg-gray-800">{l.name}</option>
                            ))}
                        </select>
                        {isTypingRight && isTranslatingPara && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                    </div>
                    
                    {/* Text Area Left */}
                    <textarea
                        value={paraLeftText}
                        onChange={(e) => handleParaInputChange(e.target.value, 'left')}
                        placeholder="Type here..."
                        className="flex-grow p-5 text-lg md:text-xl text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-light"
                        spellCheck={false}
                    />
                    
                    {/* Footer Left */}
                    <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 gap-2 flex-wrap transition-colors">
                        <div className="flex gap-1">
                            <button 
                                onClick={() => handleSpeak(paraLeftText, sourceLang)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <Volume2Icon />
                            </button>
                            <button 
                                onClick={() => navigator.clipboard.writeText(paraLeftText)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <CopyIcon />
                            </button>
                        </div>

                        <div className="flex items-center gap-2 ml-auto">
                          <select
                            value={leftTone}
                            onChange={(e) => setLeftTone(e.target.value as ParaphraseTone)}
                            className="bg-gray-50 dark:bg-gray-700 border-none text-gray-600 dark:text-gray-300 text-xs rounded-md p-1.5 cursor-pointer outline-none hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            {PARAPHRASE_TONES.map(tone => (
                              <option key={tone} value={tone} className="bg-white dark:bg-gray-800">{tone}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleSingleSideRephrase('left')}
                            disabled={isTranslatingPara || !paraLeftText}
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-gray-500 dark:text-gray-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            title="Rephrase Original"
                          >
                            <RefreshCwIcon />
                          </button>
                       </div>
                    </div>
                </div>

                {/* RIGHT PANEL (Target) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 dark:focus-within:ring-blue-900 transition-all">
                    {/* Header Right */}
                    <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                        <select 
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="bg-transparent font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-xs outline-none cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                        >
                            {SUPPORTED_LANGUAGES.map(l => (
                            <option key={l.code} value={l.code} className="bg-white dark:bg-gray-800">{l.name}</option>
                            ))}
                        </select>
                        {isTypingLeft && isTranslatingPara && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                    </div>

                    {/* Text Area Right */}
                    <textarea
                        value={paraRightText}
                        onChange={(e) => handleParaInputChange(e.target.value, 'right')}
                        placeholder="Type here..."
                        className="flex-grow p-5 text-lg md:text-xl text-gray-800 dark:text-gray-100 bg-transparent resize-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 font-light"
                        spellCheck={false}
                    />

                    {/* Footer Right */}
                    <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 gap-2 flex-wrap transition-colors">
                       <div className="flex gap-1">
                          <button 
                            onClick={() => handleSpeak(paraRightText, targetLang)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <Volume2Icon />
                          </button>
                          <button 
                            onClick={() => navigator.clipboard.writeText(paraRightText)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                            <CopyIcon />
                          </button>
                       </div>

                       <div className="flex items-center gap-2 ml-auto">
                          <select
                            value={rightTone}
                            onChange={(e) => setRightTone(e.target.value as ParaphraseTone)}
                             className="bg-gray-50 dark:bg-gray-700 border-none text-gray-600 dark:text-gray-300 text-xs rounded-md p-1.5 cursor-pointer outline-none hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                          >
                            {PARAPHRASE_TONES.map(tone => (
                              <option key={tone} value={tone} className="bg-white dark:bg-gray-800">{tone}</option>
                            ))}
                          </select>

                          <button
                            onClick={() => handleSingleSideRephrase('right')}
                            disabled={isTranslatingPara || !paraRightText}
                            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-gray-500 dark:text-gray-400 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                            title="Rephrase Translation"
                          >
                            <RefreshCwIcon />
                          </button>
                       </div>
                    </div>
                </div>
            </div>
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
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;