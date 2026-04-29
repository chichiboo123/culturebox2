export function extractYouTubeId(raw: string): string | null {
  const value = (raw || '').trim();
  if (!value) return null;
  const urlMatch = value.match(/https?:\/\/[^\s]+/);
  const candidate = urlMatch?.[0] || value;

  if (/^[\w-]{11}$/.test(candidate)) return candidate;

  try {
    const u = new URL(candidate);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.split('/').filter(Boolean)[0] || null;
    if (host.endsWith('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return v;
      const parts = u.pathname.split('/').filter(Boolean);
      const pivot = parts.findIndex(p => ['embed', 'shorts', 'v', 'live'].includes(p));
      if (pivot >= 0 && parts[pivot + 1]) return parts[pivot + 1];
    }
  } catch {
    // URL 파싱 실패 시 아래 정규식 fallback 사용
  }

  const fallback = candidate.match(/(?:watch\?v=|embed\/|shorts\/|youtu\.be\/|\/v\/)([\w-]{11})/);
  return fallback?.[1] || null;
}

export function extractDriveFileId(rawUrl: string): string | null {
  const value = (rawUrl || '').trim();
  if (!value) return null;
  const byPath = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath?.[1]) return byPath[1];
  const byParam = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byParam?.[1] || null;
}

export function toGoogleDriveImageUrl(rawUrl: string): string {
  const id = extractDriveFileId(rawUrl);
  if (!id) return rawUrl;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
}

export function toGoogleDrivePdfEmbedUrl(rawUrl: string): string {
  const id = extractDriveFileId(rawUrl);
  if (id) return `https://drive.google.com/file/d/${id}/preview`;
  return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
}
