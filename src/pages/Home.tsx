import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Loader2, Filter, X } from 'lucide-react';
import { fetchMangaList, extractMangaData, fetchMangaTags } from '@/lib/mangadex';
import { Manga } from '@/store/useStore';

const MANGA_TYPES = [
  { id: 'ja', name: 'Manga' },
  { id: 'ko', name: 'Manhwa' },
  { id: 'zh', name: 'Manhua' }
];

const STATUSES = [
  { id: 'ongoing', name: 'Ongoing' },
  { id: 'completed', name: 'Completed' },
  { id: 'hiatus', name: 'Hiatus' },
  { id: 'cancelled', name: 'Cancelled' }
];

export default function Home() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter States
  const [showFilters, setShowFilters] = useState(false);
  const [allTags, setAllTags] = useState<any[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Temp Filter States (for modal)
  const [tempTypes, setTempTypes] = useState<string[]>([]);
  const [tempStatuses, setTempStatuses] = useState<string[]>([]);
  const [tempTags, setTempTags] = useState<string[]>([]);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetchMangaTags();
        // Filter out only genres and themes to keep it manageable
        const filteredTags = res.data.filter((t: any) => 
          t.attributes.group === 'genre' || t.attributes.group === 'theme'
        );
        setAllTags(filteredTags);
      } catch (error) {
        console.error('Failed to load tags', error);
      }
    }
    loadTags();
  }, []);

  const loadMangas = async (
    pageNum: number, 
    isRefresh = false, 
    types = selectedTypes, 
    statuses = selectedStatuses, 
    tags = selectedTags
  ) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { 
        limit: 20, 
        offset: pageNum * 20, 
        'order[createdAt]': 'desc' 
      };
      
      if (types.length > 0) params.originalLanguage = types;
      if (statuses.length > 0) params.status = statuses;
      if (tags.length > 0) params.includedTags = tags;

      const res = await fetchMangaList(params);
      const newMangas = res.data.map(extractMangaData);
      
      if (isRefresh) {
        setMangas(newMangas);
      } else {
        setMangas(prev => [...prev, ...newMangas]);
      }
      
      setHasMore(newMangas.length === 20);
    } catch (error) {
      console.error('Failed to load home data', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadMangas(0, true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load more on scroll
  useEffect(() => {
    if (page > 0) {
      loadMangas(page, false);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => {
    setRefreshing(true);
    setPage(0);
    loadMangas(0, true);
  };

  const openFilters = () => {
    setTempTypes(selectedTypes);
    setTempStatuses(selectedStatuses);
    setTempTags(selectedTags);
    setShowFilters(true);
  };

  const applyFilters = () => {
    setSelectedTypes(tempTypes);
    setSelectedStatuses(tempStatuses);
    setSelectedTags(tempTags);
    setShowFilters(false);
    setPage(0);
    loadMangas(0, true, tempTypes, tempStatuses, tempTags);
  };

  const clearFilters = () => {
    setTempTypes([]);
    setTempStatuses([]);
    setTempTags([]);
  };

  const toggleTempItem = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-emerald-500">MangaReader</h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={openFilters}
            className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:text-emerald-400 hover:bg-zinc-700 transition-colors relative"
          >
            <Filter size={20} />
            {(selectedTypes.length > 0 || selectedStatuses.length > 0 || selectedTags.length > 0) && (
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-zinc-950"></span>
            )}
          </button>
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-zinc-800 rounded-full text-zinc-300 hover:text-emerald-400 hover:bg-zinc-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-4">
        {mangas.map((manga, index) => {
          const isLast = index === mangas.length - 1;
          return (
            <Link 
              key={`${manga.id}-${index}`} 
              to={`/manga/${manga.id}`} 
              className="group"
              ref={isLast ? lastElementRef : null}
            >
              <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 mb-2 relative">
                {manga.coverUrl ? (
                  <img
                    src={manga.coverUrl}
                    alt={manga.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No Cover</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100" />
                <div className="absolute bottom-2 right-2 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-emerald-400">
                  Ch. {manga.lastChapter}
                </div>
              </div>
              <h3 className="text-sm font-medium line-clamp-2 text-zinc-200 group-hover:text-emerald-400">
                {manga.title}
              </h3>
            </Link>
          );
        })}
      </div>
      
      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      )}

      {/* Filter Modal */}
      {showFilters && (
        <div className="fixed inset-0 bg-zinc-950 z-[100] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-zinc-100">Filters</h2>
            <button onClick={() => setShowFilters(false)} className="p-2 text-zinc-400 hover:text-zinc-100">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-8 hide-scrollbar">
            {/* Type Filter */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Type</h3>
              <div className="flex flex-wrap gap-2">
                {MANGA_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => toggleTempItem(tempTypes, setTempTypes, type.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tempTypes.includes(type.id) 
                        ? 'bg-emerald-500 text-zinc-950' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Status Filter */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map(status => (
                  <button
                    key={status.id}
                    onClick={() => toggleTempItem(tempStatuses, setTempStatuses, status.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      tempStatuses.includes(status.id) 
                        ? 'bg-emerald-500 text-zinc-950' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {status.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Genre Filter */}
            <section>
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Genres & Themes</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTempItem(tempTags, setTempTags, tag.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      tempTags.includes(tag.id) 
                        ? 'bg-emerald-500 text-zinc-950' 
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {tag.attributes.name.en}
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="p-4 border-t border-zinc-800 flex gap-4 bg-zinc-900">
            <button 
              onClick={clearFilters} 
              className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-300 font-medium hover:bg-zinc-800 transition-colors"
            >
              Clear All
            </button>
            <button 
              onClick={applyFilters} 
              className="flex-1 py-3 rounded-xl bg-emerald-500 text-zinc-950 font-bold hover:bg-emerald-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
