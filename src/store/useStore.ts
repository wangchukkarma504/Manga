import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Manga {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  tags: string[];
  lastChapter?: string;
}

export interface ReadingProgress {
  mangaId: string;
  chapterId: string;
  chapterTitle: string;
  page: number;
  timestamp: number;
}

export interface ReaderSettings {
  readingMode: 'vertical' | 'ltr' | 'rtl';
  pageFit: 'width' | 'height';
}

interface AppState {
  favorites: Manga[];
  readingProgress: Record<string, ReadingProgress>; // mangaId -> progress
  readerSettings: ReaderSettings;
  addFavorite: (manga: Manga) => void;
  removeFavorite: (mangaId: string) => void;
  isFavorite: (mangaId: string) => boolean;
  updateProgress: (progress: ReadingProgress) => void;
  getProgress: (mangaId: string) => ReadingProgress | undefined;
  updateReaderSettings: (settings: Partial<ReaderSettings>) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      readingProgress: {},
      readerSettings: {
        readingMode: 'vertical',
        pageFit: 'width',
      },
      addFavorite: (manga) =>
        set((state) => ({
          favorites: state.favorites.some((f) => f.id === manga.id)
            ? state.favorites
            : [...state.favorites, manga],
        })),
      removeFavorite: (mangaId) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== mangaId),
        })),
      isFavorite: (mangaId) => get().favorites.some((f) => f.id === mangaId),
      updateProgress: (progress) =>
        set((state) => ({
          readingProgress: {
            ...state.readingProgress,
            [progress.mangaId]: progress,
          },
        })),
      getProgress: (mangaId) => get().readingProgress[mangaId],
      updateReaderSettings: (settings) =>
        set((state) => ({
          readerSettings: { ...state.readerSettings, ...settings },
        })),
    }),
    {
      name: 'manga-reader-storage',
    }
  )
);
