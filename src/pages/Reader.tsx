import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Settings, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { fetchChapterPages, fetchMangaChapters } from '@/lib/mangadex';
import { useStore } from '@/store/useStore';

export default function Reader() {
  const { mangaId, chapterId } = useParams<{ mangaId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  const [nextChapter, setNextChapter] = useState<{ id: string; chapter: string } | null>(null);
  const [prevChapter, setPrevChapter] = useState<{ id: string; chapter: string } | null>(null);
  
  const updateProgress = useStore(state => state.updateProgress);
  const readerSettings = useStore(state => state.readerSettings);
  const updateReaderSettings = useStore(state => state.updateReaderSettings);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chapterId || !mangaId) return;

    async function loadData() {
      setLoading(true);
      setCurrentPage(0);
      try {
        const [pagesRes, chaptersRes] = await Promise.all([
          fetchChapterPages(chapterId!),
          fetchMangaChapters(mangaId!, 0, 500) // Fetch up to 500 chapters to find prev/next
        ]);
        
        const baseUrl = pagesRes.baseUrl;
        const hash = pagesRes.chapter.hash;
        const pageUrls = pagesRes.chapter.data.map((filename: string) => 
          `${baseUrl}/data/${hash}/${filename}`
        );
        setPages(pageUrls);

        // Find next and prev chapters
        const chapters = chaptersRes.data;
        const currentIndex = chapters.findIndex((c: any) => c.id === chapterId);
        
        if (currentIndex !== -1) {
          // Chapters are sorted descending by chapter number
          const next = chapters[currentIndex - 1];
          const prev = chapters[currentIndex + 1];
          
          setNextChapter(next ? { id: next.id, chapter: next.attributes.chapter } : null);
          setPrevChapter(prev ? { id: prev.id, chapter: prev.attributes.chapter } : null);
        }
      } catch (error) {
        console.error('Failed to load reader data', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [chapterId, mangaId]);

  // Track reading progress
  useEffect(() => {
    if (mangaId && chapterId && pages.length > 0) {
      updateProgress({
        mangaId,
        chapterId,
        chapterTitle: 'Chapter', // Could fetch chapter details if needed
        page: currentPage,
        timestamp: Date.now(),
      });
    }
  }, [currentPage, mangaId, chapterId, pages.length, updateProgress]);

  // Intersection observer to track current page
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            setCurrentPage(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    const pageElements = document.querySelectorAll('.manga-page');
    pageElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pages, readerSettings.readingMode]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center z-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const isVertical = readerSettings.readingMode === 'vertical';
  const isRTL = readerSettings.readingMode === 'rtl';

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col">
      {/* Top Controls */}
      <div 
        className={`absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between z-20 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="text-white font-medium text-sm drop-shadow-md bg-black/40 px-3 py-1 rounded-full backdrop-blur-md">
          {currentPage + 1} / {pages.length}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowSettings(true);
          }}
          className="p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Reader Content */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-auto hide-scrollbar ${
          isVertical ? 'flex flex-col snap-y snap-mandatory' : 
          isRTL ? 'flex flex-row-reverse snap-x snap-mandatory' : 
          'flex flex-row snap-x snap-mandatory'
        }`}
        onClick={() => setShowControls(!showControls)}
      >
        {pages.map((url, index) => (
          <div 
            key={index} 
            className={`manga-page flex-none flex items-center justify-center bg-zinc-950 snap-center ${
              isVertical ? 'w-full min-h-screen py-2' : 'w-full h-full p-2'
            }`}
            data-index={index}
          >
            <img
              src={url}
              alt={`Page ${index + 1}`}
              className={`${
                readerSettings.pageFit === 'width' ? 'w-full h-auto' : 'h-full w-auto'
              } object-contain max-w-3xl`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
        
        {/* End of chapter */}
        <div className={`flex-none flex flex-col items-center justify-center text-zinc-500 snap-center bg-zinc-950 ${
          isVertical ? 'w-full py-32' : 'w-full h-full'
        }`}>
          <p className="mb-8 text-lg font-medium text-zinc-400">End of Chapter</p>
          
          <div className="flex flex-col gap-4 w-full max-w-xs px-4">
            {nextChapter && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/read/${mangaId}/${nextChapter.id}`, { replace: true });
                }}
                className="w-full py-3 bg-emerald-500 text-zinc-950 font-bold rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                Next: Chapter {nextChapter.chapter} <ChevronRight size={20} />
              </button>
            )}
            
            {prevChapter && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/read/${mangaId}/${prevChapter.id}`, { replace: true });
                }}
                className="w-full py-3 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <ChevronLeft size={20} /> Prev: Chapter {prevChapter.chapter}
              </button>
            )}

            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(-1);
              }}
              className="w-full py-3 bg-transparent border border-zinc-700 text-zinc-400 font-medium rounded-xl hover:bg-zinc-800 transition-colors mt-4"
            >
              Back to Details
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-6 pb-8 bg-gradient-to-t from-black/90 via-black/80 to-transparent z-20 transition-transform duration-300 ${
          showControls ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-md mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (prevChapter) navigate(`/read/${mangaId}/${prevChapter.id}`, { replace: true });
              }}
              disabled={!prevChapter}
              className="p-2 text-zinc-300 disabled:opacity-30 hover:text-emerald-400 transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (nextChapter) navigate(`/read/${mangaId}/${nextChapter.id}`, { replace: true });
              }}
              disabled={!nextChapter}
              className="p-2 text-zinc-300 disabled:opacity-30 hover:text-emerald-400 transition-colors"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-zinc-400 font-medium w-6 text-right">1</span>
            <input 
              type="range" 
              min="0" 
              max={pages.length - 1} 
              value={currentPage}
              onChange={(e) => {
                const newPage = Number(e.target.value);
                const pageEl = document.querySelector(`.manga-page[data-index="${newPage}"]`);
                if (pageEl) {
                  pageEl.scrollIntoView({ behavior: 'auto' });
                }
              }}
              className="flex-1 accent-emerald-500 h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-zinc-400 font-medium w-6">{pages.length}</span>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div 
            className="bg-zinc-900 w-full sm:w-96 sm:rounded-2xl rounded-t-2xl p-6 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-zinc-100">Reader Settings</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Reading Mode */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Reading Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'vertical', label: 'Vertical' },
                    { id: 'ltr', label: 'LTR ➔' },
                    { id: 'rtl', label: 'RTL ⬅' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updateReaderSettings({ readingMode: mode.id as any })}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                        readerSettings.readingMode === mode.id
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page Fit */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-zinc-400 uppercase tracking-wider">Page Fit</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'width', label: 'Fit Width' },
                    { id: 'height', label: 'Fit Height' }
                  ].map((fit) => (
                    <button
                      key={fit.id}
                      onClick={() => updateReaderSettings({ pageFit: fit.id as any })}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                        readerSettings.pageFit === fit.id
                          ? 'bg-emerald-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {fit.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSettings(false)}
              className="w-full mt-8 py-3 bg-zinc-800 text-zinc-100 font-medium rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
