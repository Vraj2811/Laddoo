// State
let state = {
    songs: [],
    currentMode: 'Desi', // 'Desi' or 'Videshi'
    currentView: 'home', // 'home' or 'reels'
    selectedAlbum: null,
    playingIndex: -1,
    isPlaying: false,
    lyrics: [],
    observer: null,
    videoMode: true // Default to showing video if available
};

// DOM Elements
const els = {
    homeBtn: document.getElementById('homeBtn'),
    homeView: document.getElementById('homeView'),
    reelsView: document.getElementById('reelsView'),
    desiBtn: document.getElementById('desiBtn'),
    videshiBtn: document.getElementById('videshiBtn'),
    albumSearch: document.getElementById('albumSearch'),
    albumsGrid: document.getElementById('albumsGrid'),
    feedList: document.getElementById('feedList'),
    lyricsOverlay: document.getElementById('lyricsOverlay'),
    lyricsContent: document.getElementById('lyricsContent'),
    closeLyrics: document.getElementById('closeLyrics')
};

const audio = new Audio();

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchSongs();
    setupEventListeners();
    setupObserver();
});

function setupEventListeners() {
    // Navigation
    els.homeBtn.addEventListener('click', showHome);

    // Header Search
    document.getElementById('headerSearchIcon').addEventListener('click', () => {
        showHome();
        setTimeout(() => els.albumSearch.focus(), 100);
    });

    // Mode Toggles
    els.desiBtn.addEventListener('click', () => setMode('Desi'));
    els.videshiBtn.addEventListener('click', () => setMode('Videshi'));

    // Search
    els.albumSearch.addEventListener('input', renderAlbums);

    // Audio Events
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNext);

    // Lyrics
    els.closeLyrics.addEventListener('click', () => els.lyricsOverlay.classList.remove('active'));
}

function setupObserver() {
    const options = {
        root: els.feedList,
        threshold: 0.6
    };

    state.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const index = parseInt(entry.target.dataset.index);
                playSong(index);
            }
        });
    }, options);
}

// Fetch Data
async function fetchSongs() {
    try {
        const res = await fetch('/songs');
        state.songs = await res.json();
        renderAlbums();
    } catch (err) {
        console.error('Failed to load songs:', err);
    }
}

// Navigation Logic
function showHome() {
    state.currentView = 'home';
    state.selectedAlbum = null;
    state.isPlaying = false;
    audio.pause();

    els.homeView.classList.remove('hidden');
    els.reelsView.classList.add('hidden');
    renderAlbums();
}

function showReels(album) {
    state.currentView = 'reels';
    state.selectedAlbum = album;

    els.homeView.classList.add('hidden');
    els.reelsView.classList.remove('hidden');
    renderReels();
}

function setMode(mode) {
    state.currentMode = mode;
    els.desiBtn.classList.toggle('active', mode === 'Desi');
    els.videshiBtn.classList.toggle('active', mode === 'Videshi');
    renderAlbums();
}

// Render Logic
function renderAlbums() {
    const query = els.albumSearch.value.toLowerCase();

    // Filter songs by mode
    const modeSongs = state.songs.filter(s => s.language === state.currentMode);

    // Group by Flavor (Album)
    const albums = {};
    modeSongs.forEach(song => {
        if (!albums[song.flavor]) {
            albums[song.flavor] = {
                name: song.flavor,
                cover: song.coverPath,
                count: 0
            };
        }
        albums[song.flavor].count++;
    });

    // Filter by search
    const filteredAlbums = Object.values(albums).filter(album =>
        album.name.toLowerCase().includes(query)
    );

    els.albumsGrid.innerHTML = filteredAlbums.map(album => `
        <div class="album-card" onclick="showReels('${album.name}')">
            <div class="album-cover">
                <img src="${album.cover || 'images.png'}" alt="${album.name}">
            </div>
            <div class="album-info">
                <div class="album-title">${album.name}</div>
                <div class="album-count">${album.count} Songs</div>
            </div>
        </div>
    `).join('');
}

function renderReels() {
    // Filter songs by selected album
    const albumSongs = state.songs.filter(s =>
        s.language === state.currentMode && s.flavor === state.selectedAlbum
    );

    els.feedList.innerHTML = albumSongs.map((song) => {
        const globalIndex = state.songs.indexOf(song);

        return `
        <div class="reel-item" data-index="${globalIndex}">
            <!-- Media -->
            ${state.videoMode && song.videoPath ?
                `<video class="reel-media" src="${song.videoPath}" loop muted playsinline poster="${song.coverPath || 'images.png'}"></video>` :
                `<img class="reel-media" src="${song.coverPath || 'images.png'}" alt="${song.songName}">`
            }
            
            <div class="reel-overlay"></div>

            <div class="play-overlay" id="playOverlay-${globalIndex}">
                <i class="fas fa-play"></i>
            </div>

            <div class="reel-progress">
                <div class="progress-fill" id="progress-${globalIndex}"></div>
            </div>

            <div class="reel-info">
                <div class="reel-flavor">${song.flavor}</div>
                <div class="reel-title">${song.songName}</div>
                <div class="reel-artist">
                    <i class="fas fa-music"></i> ${song.language}
                </div>
            </div>

            <div class="reel-actions">
                <!-- Lyrics Button -->
                <div class="action-btn" onclick="showLyrics(${globalIndex})">
                    <i class="fas fa-align-left action-icon"></i>
                    <span class="action-label">Lyrics</span>
                </div>

                <!-- Video Button -->
                <div class="action-btn" onclick="${song.videoPath ? `toggleVideoMode(event, ${globalIndex})` : ''}" style="${song.videoPath ? '' : 'opacity: 0.3; cursor: default;'}">
                    <i class="fas fa-video action-icon ${state.videoMode && song.videoPath ? 'liked' : ''}"></i>
                    <span class="action-label">Video</span>
                </div>

                <!-- Heart Button -->
                <div class="action-btn" onclick="toggleLike(this)">
                    <i class="far fa-heart action-icon"></i>
                    <span class="action-label">Like</span>
                </div>
            </div>

            <div style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:2;" onclick="togglePlay()"></div>
        </div>
    `}).join('');

    // Observe new elements
    document.querySelectorAll('.reel-item').forEach(el => state.observer.observe(el));
}

// Playback Logic
function playSong(index) {
    if (state.playingIndex === index && state.isPlaying) return;

    state.playingIndex = index;
    const song = state.songs[index];

    audio.src = song.filePath;
    audio.play()
        .then(() => {
            state.isPlaying = true;
            updatePlayIcon(false);

            // Play video if active
            if (state.videoMode) {
                const reel = document.querySelector(`.reel-item[data-index="${index}"]`);
                const video = reel?.querySelector('video');
                if (video) {
                    video.currentTime = 0;
                    video.play();
                }
            }
        })
        .catch(err => console.error('Playback failed:', err));
}

function togglePlay() {
    if (audio.paused) {
        audio.play();
        state.isPlaying = true;
        updatePlayIcon(false);

        if (state.videoMode) {
            const video = document.querySelector(`.reel-item[data-index="${state.playingIndex}"] video`);
            if (video) video.play();
        }
    } else {
        audio.pause();
        state.isPlaying = false;
        updatePlayIcon(true);

        if (state.videoMode) {
            const video = document.querySelector(`.reel-item[data-index="${state.playingIndex}"] video`);
            if (video) video.pause();
        }
    }
}

function updatePlayIcon(show) {
    const overlay = document.getElementById(`playOverlay-${state.playingIndex}`);
    if (overlay) {
        if (show) {
            overlay.classList.add('show');
            overlay.innerHTML = '<i class="fas fa-play"></i>';
        } else {
            overlay.classList.remove('show');
        }
    }
}

function playNext() {
    const currentReel = document.querySelector(`.reel-item[data-index="${state.playingIndex}"]`);
    if (currentReel && currentReel.nextElementSibling) {
        currentReel.nextElementSibling.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateProgress() {
    const percent = (audio.currentTime / audio.duration) * 100;
    const bar = document.getElementById(`progress-${state.playingIndex}`);
    if (bar) {
        bar.style.width = `${percent}%`;
    }

    if (els.lyricsOverlay.classList.contains('active')) {
        syncLyrics();
    }
}

// Video Mode
window.toggleVideoMode = (e, index) => {
    e.stopPropagation();
    const song = state.songs[index];
    if (!song.videoPath) return;

    state.videoMode = !state.videoMode;
    renderReels(); // Re-render to swap img/video

    // Restore playback state
    if (state.isPlaying) {
        const reel = document.querySelector(`.reel-item[data-index="${index}"]`);
        reel.scrollIntoView(); // Ensure we stay on the same reel
    }
};

// Lyrics
window.showLyrics = (index) => {
    const song = state.songs[index];
    if (!song.lyricsPath) {
        els.lyricsContent.innerHTML = '<p>No lyrics available</p>';
        els.lyricsOverlay.classList.add('active');
        return;
    }

    fetch(song.lyricsPath)
        .then(res => res.text())
        .then(text => {
            if (song.lyricsPath.endsWith('.lrc')) {
                state.lyrics = parseLRC(text);
                renderLRCLyrics();
            } else {
                state.lyrics = [];
                els.lyricsContent.innerHTML = text.split('\n').map(line => `<div class="lyrics-line">${line}</div>`).join('');
            }
            els.lyricsOverlay.classList.add('active');
        });
};

function parseLRC(lrc) {
    const lines = lrc.split('\n');
    const result = [];
    for (const line of lines) {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
        if (match) {
            const time = parseInt(match[1]) * 60 + parseInt(match[2]) + parseInt(match[3]) / 100;
            result.push({ time, text: match[4].trim() });
        }
    }
    return result;
}

function renderLRCLyrics() {
    els.lyricsContent.innerHTML = state.lyrics.map((line, i) =>
        `<div class="lyrics-line" id="line-${i}">${line.text}</div>`
    ).join('');
}

function syncLyrics() {
    if (!state.lyrics.length) return;

    const time = audio.currentTime;
    let activeIndex = state.lyrics.findIndex((line, i) => {
        const nextLine = state.lyrics[i + 1];
        return time >= line.time && (!nextLine || time < nextLine.time);
    });

    if (activeIndex !== -1) {
        document.querySelectorAll('.lyrics-line').forEach((el, i) => {
            el.classList.toggle('current', i === activeIndex);
            if (i === activeIndex) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });
    }
}

// Like
window.toggleLike = (btn) => {
    const icon = btn.querySelector('.action-icon');
    icon.classList.toggle('liked');
    icon.classList.toggle('fas');
    icon.classList.toggle('far');

    icon.style.transform = 'scale(1.2)';
    setTimeout(() => icon.style.transform = 'scale(1)', 200);
};
