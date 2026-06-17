const playdl = require('play-dl');

/**
 * Resolves a query (URL or search term) into a song object or array (playlist).
 * Returns: { type: 'song'|'playlist', songs: [...] }
 */
async function resolve(query) {
  query = query.trim();

  // ── YouTube Playlist ──────────────────────────────────────────────────────
  if (playdl.yt_validate(query) === 'playlist') {
    const playlist = await playdl.playlist_info(query, { incomplete: true });
    const videos = await playlist.all_videos();
    const songs = videos.map(v => ({
      title: v.title || 'Unknown',
      url: v.url,
      thumbnail: v.thumbnails?.[0]?.url || null,
      duration: fmtDuration(v.durationInSec),
      durationSec: v.durationInSec || 0,
    }));
    return { type: 'playlist', name: playlist.title, songs };
  }

  // ── YouTube Video URL ─────────────────────────────────────────────────────
  if (playdl.yt_validate(query) === 'video') {
    const info = await playdl.video_info(query);
    const v = info.video_details;
    return {
      type: 'song',
      songs: [{
        title: v.title || 'Unknown',
        url: v.url,
        thumbnail: v.thumbnails?.[0]?.url || null,
        duration: fmtDuration(v.durationInSec),
        durationSec: v.durationInSec || 0,
      }],
    };
  }

  // ── YouTube Search ────────────────────────────────────────────────────────
  const results = await playdl.search(query, { limit: 1, source: { youtube: 'video' } });
  if (!results.length) throw new Error('No results found for your query.');
  const v = results[0];
  return {
    type: 'song',
    songs: [{
      title: v.title || 'Unknown',
      url: v.url,
      thumbnail: v.thumbnails?.[0]?.url || null,
      duration: fmtDuration(v.durationInSec),
      durationSec: v.durationInSec || 0,
    }],
  };
}

/**
 * Search and return top N results (for the search command).
 */
async function search(query, limit = 5) {
  const results = await playdl.search(query, { limit, source: { youtube: 'video' } });
  return results.map(v => ({
    title: v.title || 'Unknown',
    url: v.url,
    thumbnail: v.thumbnails?.[0]?.url || null,
    duration: fmtDuration(v.durationInSec),
    durationSec: v.durationInSec || 0,
  }));
}

function fmtDuration(sec) {
  if (!sec) return 'LIVE';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = { resolve, search };
