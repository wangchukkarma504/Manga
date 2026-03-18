import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import { fetchMangaList, extractMangaData } from '@/lib/mangadex';
import { Manga } from '@/store/useStore';
import { useDebounce } from '@/hooks/useDebounce';

export default function Search() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 500);
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    async function search() {
      setLoading(true);
      try {
        const res = await fetchMangaList({ title: debouncedQuery, limit: 20 });
        setResults(res.data.map(extractMangaData));
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    }

    search();
  }, [debouncedQuery]);

  return (
    <div className="p-4 flex flex-col h-full">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-zinc-500" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-zinc-800 rounded-xl leading-5 bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
          placeholder="Search manga..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {results.map((manga) => (
              <Link key={manga.id} to={`/manga/${manga.id}`} className="group">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 mb-2">
                  {manga.coverUrl && (
                    <img
                      src={manga.coverUrl}
                      alt={manga.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
                <h3 className="text-sm font-medium line-clamp-2 text-zinc-200 group-hover:text-emerald-400">
                  {manga.title}
                </h3>
              </Link>
            ))}
          </div>
        ) : debouncedQuery ? (
          <div className="text-center text-zinc-500 py-8">No results found</div>
        ) : (
          <div className="text-center text-zinc-500 py-8">
            Type to start searching
          </div>
        )}
      </div>
    </div>
  );
}
