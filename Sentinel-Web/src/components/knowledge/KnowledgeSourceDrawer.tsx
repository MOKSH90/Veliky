import React, { useState, useEffect } from 'react';
import { OpenNotebookService, KnowledgeNotebook, SearchResultItem } from '../../services/openNotebookService';
import { BookOpen, Search, Upload, FileText, CheckCircle2, Database, Layers } from 'lucide-react';

export const KnowledgeSourceDrawer: React.FC = () => {
  const [notebooks, setNotebooks] = useState<KnowledgeNotebook[]>([]);
  const [selectedNotebook, setSelectedNotebook] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');

  useEffect(() => {
    OpenNotebookService.getNotebooks().then((data) => {
      setNotebooks(data);
      if (data.length > 0) setSelectedNotebook(data[0].id);
    });
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const results = await OpenNotebookService.searchKnowledge(searchQuery, selectedNotebook);
    setSearchResults(results);
  };

  const handleIngest = async () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsIngesting(true);
    await OpenNotebookService.addSource(selectedNotebook, newTitle, newContent, 'text');
    setIsIngesting(false);
    setNewTitle('');
    setNewContent('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-lg">Open-Notebook RAG Knowledge Vault</h3>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
          SurrealDB Vector Store Active
        </span>
      </div>

      {/* Notebook Selector & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-400 mb-1 block">Notebook Context</label>
          <select
            value={selectedNotebook}
            onChange={(e) => setSelectedNotebook(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            {notebooks.map((nb) => (
              <option key={nb.id} value={nb.id}>
                {nb.name} ({nb.sourceCount} sources)
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={handleSearch} className="md:col-span-2 flex items-end space-x-2">
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 mb-1 block">Vector Search Query</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search indexed codebase or document chunks..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>
          </div>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>Search</span>
          </button>
        </form>
      </div>

      {/* RAG Search Results View */}
      {searchResults.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Retrieved RAG Snippets ({searchResults.length})</span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {searchResults.map((res) => (
              <div key={res.id} className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
                  <span className="flex items-center space-x-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{res.sourceTitle}</span>
                  </span>
                  <span className="bg-slate-700/50 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                    Similarity: {(res.score * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 line-clamp-3 italic">"{res.snippet}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Document Ingestion Form */}
      <div className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-3 space-y-2">
        <h4 className="text-xs font-bold text-slate-300 flex items-center space-x-1">
          <Upload className="w-3.5 h-3.5 text-blue-400" />
          <span>Ingest New Source into Knowledge Vault</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Document Title (e.g. Pump_Manual.md)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500"
          />
          <input
            type="text"
            placeholder="Content text or document URL..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 md:col-span-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleIngest}
            disabled={isIngesting}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
          >
            <Database className="w-3 h-3" />
            <span>{isIngesting ? 'Ingesting Vector Chunks...' : 'Ingest to Open-Notebook'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
