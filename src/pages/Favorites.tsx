import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { HeartOff } from 'lucide-react';

export default function Favorites() {
  const favorites = useStore((state) => state.favorites);
  const removeFavorite = useStore((state) => state.removeFavorite);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-zinc-100">Favorites</h1>
      
      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
          <HeartOff className="w-16 h-16 mb-4 opacity-50" />
          <p>No favorites yet.</p>
          <Link to="/search" className="text-emerald-500 mt-2 hover:underline">
            Discover some manga
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {favorites.map((manga) => (
            <div key={manga.id} className="relative group">
              <Link to={`/manga/${manga.id}`} className="block">
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
              <button
                onClick={(e) => {
                  e.preventDefault();
                  removeFavorite(manga.id);
                }}
                className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-red-500 hover:bg-black/80 transition-colors"
                aria-label="Remove from favorites"
              >
                <HeartOff size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
