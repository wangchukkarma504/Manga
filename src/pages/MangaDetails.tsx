import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Play, BookOpen, Loader2 } from 'lucide-react';
import { fetchMangaDetails, fetchMangaChapters, extractMangaData } from '@/lib/mangadex';
import { Manga, useStore } from '@/store/useStore';
import { format } from 'date-fns';

export default function MangaDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isFavorite, addFavorite, removeFavorite, getProgress } = useStore();
  const isFav = id ? isFavorite(id) : false;
  const progress = id ? getProgress(id) : undefined;

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const [mangaRes, chaptersRes] = await Promise.all([
          fetchMangaDetails(id!),
          fetchMangaChapters(id!)
        ]);
        
        setManga(extractMangaData(mangaRes.data));
        setChapters(chaptersRes.data);
      } catch (error) {
        console.error('Failed to load manga details', error);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!manga) return <div className="p-4">Manga not found</div>;

  const handleFavorite = () => {
    if (isFav) {
      removeFavorite(manga.id);
    } else {
      addFavorite(manga);
    }
  };

  return (
    <div className="relative min-h-full pb-8">
      {/* Header Image */}
      <div className="relative h-64 w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center blur-sm opacity-50"
          style={{ backgroundImage: `url(${manga.coverUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        
        <button 
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-black/40 rounded-full backdrop-blur-md text-white z-10"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="relative px-4 -mt-32 z-10">
        <div className="flex gap-4">
          <div className="w-32 flex-none rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-zinc-800 bg-zinc-900">
            {manga.coverUrl && (
              <img 
                src={manga.coverUrl} 
                alt={manga.title} 
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
          <div className="flex-1 pt-12">
            <h1 className="text-xl font-bold text-white leading-tight mb-2">{manga.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {manga.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider bg-zinc-800 text-zinc-300 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Link 
            to={progress ? `/read/${manga.id}/${progress.chapterId}` : (chapters[chapters.length - 1] ? `/read/${manga.id}/${chapters[chapters.length - 1].id}` : '#')}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {progress ? <BookOpen size={20} /> : <Play size={20} fill="currentColor" />}
            {progress ? 'Continue Reading' : 'Start Reading'}
          </Link>
          <button 
            onClick={handleFavorite}
            className={`p-3 rounded-xl border flex items-center justify-center transition-colors ${
              isFav 
                ? 'border-red-500/50 bg-red-500/10 text-red-500' 
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <Heart size={24} fill={isFav ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Synopsis */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2 text-zinc-100">Synopsis</h2>
          <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">
            {manga.description}
          </p>
        </div>

        {/* Chapters */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-zinc-100">Chapters</h2>
            <span className="text-xs text-zinc-500">{chapters.length} available</span>
          </div>
          
          <div className="space-y-2">
            {chapters.length > 0 ? chapters.map((chapter) => (
              <Link 
                key={chapter.id}
                to={`/read/${manga.id}/${chapter.id}`}
                className={`block p-4 rounded-xl border transition-colors ${
                  progress?.chapterId === chapter.id 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-medium ${progress?.chapterId === chapter.id ? 'text-emerald-400' : 'text-zinc-200'}`}>
                      {chapter.attributes.chapter ? `Chapter ${chapter.attributes.chapter}` : 'Oneshot'}
                      {chapter.attributes.title && ` - ${chapter.attributes.title}`}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {chapter.attributes.publishAt ? format(new Date(chapter.attributes.publishAt), 'MMM d, yyyy') : 'Unknown date'}
                    </p>
                  </div>
                  {progress?.chapterId === chapter.id && (
                    <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                      Reading
                    </span>
                  )}
                </div>
              </Link>
            )) : (
              <div className="text-center py-8 text-zinc-500">No English chapters found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
