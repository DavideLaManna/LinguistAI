import React from 'react';
import { HistoryItem, AppMode, SUPPORTED_LANGUAGES } from '../types';
import { XIcon, TrashIcon, ArrowRightIcon, ListRestartIcon, BookOpenIcon } from './Icons';

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
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-gray-900">History</h2>
            <button 
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <XIcon />
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center p-4">
                <p>No history yet.</p>
                <p className="text-sm mt-1">Your translations will appear here.</p>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => onSelect(item)}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      {item.mode === AppMode.VARIATIONS ? <ListRestartIcon /> : <BookOpenIcon />}
                      <span className="uppercase tracking-wide">{item.mode === AppMode.VARIATIONS ? 'Variations' : 'Context'}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(item.timestamp)}</span>
                  </div>

                  <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                    {item.inputText}
                  </h3>

                  <div className="flex items-center text-xs text-gray-500 gap-2 mb-1">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{getLangName(item.sourceLang)}</span>
                    <span className="text-gray-300"><ArrowRightIcon /></span>
                    <span className="bg-blue-50 px-2 py-0.5 rounded text-blue-600">{getLangName(item.targetLang)}</span>
                  </div>

                  <button 
                    onClick={(e) => onDelete(item.id, e)}
                    className="absolute top-3 right-3 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
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
            <div className="p-4 border-t border-gray-100 bg-white">
              <button 
                onClick={onClear}
                className="w-full py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
