const BASE_URL = '/api/mangadex';

export async function fetchMangaList(params: Record<string, any> = {}) {
  const url = new URL(`${BASE_URL}/manga`, window.location.origin);
  url.searchParams.append('includes[]', 'cover_art');
  url.searchParams.append('includes[]', 'author');
  url.searchParams.append('availableTranslatedLanguage[]', 'en');
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => url.searchParams.append(`${key}[]`, v));
    } else {
      url.searchParams.append(key, value);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch manga list');
  return res.json();
}

export async function fetchMangaDetails(id: string) {
  const url = new URL(`${BASE_URL}/manga/${id}`, window.location.origin);
  url.searchParams.append('includes[]', 'cover_art');
  url.searchParams.append('includes[]', 'author');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch manga details');
  return res.json();
}

export async function fetchMangaChapters(mangaId: string, offset = 0, limit = 100) {
  const url = new URL(`${BASE_URL}/manga/${mangaId}/feed`, window.location.origin);
  url.searchParams.append('translatedLanguage[]', 'en');
  url.searchParams.append('order[chapter]', 'desc');
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('offset', offset.toString());
  
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch chapters');
  return res.json();
}

export async function fetchChapterPages(chapterId: string) {
  const res = await fetch(`${BASE_URL}/at-home/server/${chapterId}`);
  if (!res.ok) throw new Error('Failed to fetch chapter pages');
  return res.json();
}

export async function fetchMangaTags() {
  const url = new URL(`${BASE_URL}/manga/tag`, window.location.origin);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch tags');
  return res.json();
}

export function getCoverUrl(mangaId: string, fileName: string) {
  return `https://uploads.mangadex.org/covers/${mangaId}/${fileName}`;
}

export function extractMangaData(item: any) {
  const coverArt = item.relationships.find((r: any) => r.type === 'cover_art');
  const coverFileName = coverArt?.attributes?.fileName;
  const coverUrl = coverFileName ? getCoverUrl(item.id, coverFileName) : '';
  
  const title = item.attributes.title.en || Object.values(item.attributes.title)[0] || 'Unknown Title';
  const description = item.attributes.description.en || Object.values(item.attributes.description)[0] || 'No description available.';
  const tags = item.attributes.tags.map((t: any) => t.attributes.name.en);
  const lastChapter = item.attributes.lastChapter || '?';
  
  return {
    id: item.id,
    title,
    coverUrl,
    description,
    tags,
    lastChapter,
  };
}
