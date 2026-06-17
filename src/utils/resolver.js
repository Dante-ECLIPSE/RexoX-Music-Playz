const playdl = require('play-dl');

async function resolve(query) {
    query = query.trim();

    try {
        // YouTube Playlist
        if (playdl.yt_validate(query) === 'playlist') {
            const playlist = await playdl.playlist_info(query, {
                incomplete: true
            });

            const videos = await playlist.all_videos();

            return {
                type: 'playlist',
                name: playlist.title,
                songs: videos.map(video => ({
                    title: video.title,
                    url: video.url,
                    thumbnail: video.thumbnails?.[0]?.url || null,
                    duration: formatDuration(video.durationInSec),
                    durationSec: video.durationInSec || 0,
                })),
            };
        }

        // YouTube Video URL
        if (playdl.yt_validate(query) === 'video') {
            const info = await playdl.video_info(query);
            const video = info.video_details;

            return {
                type: 'song',
                songs: [{
                    title: video.title,
                    url: video.url,
                    thumbnail: video.thumbnails?.[0]?.url || null,
                    duration: formatDuration(video.durationInSec),
                    durationSec: video.durationInSec || 0,
                }],
            };
        }

        // Search Query
        const results = await playdl.search(query, {
            limit: 1
        });

        if (!results || results.length === 0) {
            throw new Error('No results found.');
        }

        const video = results[0];

        return {
            type: 'song',
            songs: [{
                title: video.title,
                url: video.url,
                thumbnail: video.thumbnails?.[0]?.url || null,
                duration: formatDuration(video.durationInSec),
                durationSec: video.durationInSec || 0,
            }],
        };

    } catch (err) {
        console.error('[Resolver Error]', err);
        throw err;
    }
}

async function search(query, limit = 5) {
    try {
        const results = await playdl.search(query, {
            limit
        });

        return results.map(video => ({
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnails?.[0]?.url || null,
            duration: formatDuration(video.durationInSec),
            durationSec: video.durationInSec || 0,
        }));
    } catch (err) {
        console.error('[Search Error]', err);
        return [];
    }
}

function formatDuration(sec) {
    if (!sec) return 'LIVE';

    const hours = Math.floor(sec / 3600);
    const minutes = Math.floor((sec % 3600) / 60);
    const seconds = sec % 60;

    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

module.exports = {
    resolve,
    search
};
