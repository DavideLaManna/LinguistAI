import React from 'react';
import { HistoryItem, AppMode, SUPPORTED_LANGUAGES } from '../types';
import { XIcon, TrashIcon, ArrowRightIcon, ListRestartIcon, BookOpenIcon, FeatherIcon } from './Icons';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onClear: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  history,
  onSelect,
  onDelete,
  onClear,
}) => {
  const getLangName = (code: string) => SUPPORTED_LANGUAGES.find(l => l.code === code)?.name || code;

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('default', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(timestamp));
  };

  const getModeIcon = (mode: AppMode) => {
    switch (mode) {
      case AppMode.VARIATIONS: return <ListRestartIcon />;
      case AppMode.CONTEXT: return <BookOpenIcon />;
      case AppMode.PARAPHRASE: return <FeatherIcon />;
      default: return <ListRestartIcon />;
    }
  };

  const getModeLabel = (mode: AppMode) => {
    switch (mode) {
        case AppMode.VARIATIONS: return 'Variations';
        case AppMode.CONTEXT: return 'Context';
        case AppMode.PARAPHRASE: return 'Paraphrase';
        default: return 'Variations';
    }
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 transition-colors">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">History</h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <XIcon />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 text-center p-4">
                <p>No history yet.</p>
                <p className="text-sm mt-1">Your translations will appear here.</p>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="bg-white dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500 transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {getModeIcon(item.mode)}
                      <span className="uppercase tracking-wide">{getModeLabel(item.mode)}</span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(item.timestamp)}</span>
                  </div>

                  <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">
                    {item.inputText}
                  </h3>

                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 gap-2 mb-1">
                    <span className="bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">{getLangName(item.sourceLang)}</span>
                    <span className="text-gray-300 dark:text-gray-500"><ArrowRightIcon /></span>
                    <span className="bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded text-blue-600 dark:text-blue-300">{getLangName(item.targetLang)}</span>
                  </div>

                  <button 
                    onClick={(e) => onDelete(item.id, e)}
                    className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete item"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {history.length > 0 && (
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors">
              <button 
                onClick={onClear}
                className="w-full py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistorySidebar;