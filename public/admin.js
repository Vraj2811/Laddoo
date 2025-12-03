document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadVisualPreferences();

    // Load SVG for cover generation
    const icecreamImage = new Image();
    icecreamImage.src = 'temp.svg';
    icecreamImage.onload = () => {
        window.svgLoaded = true;
        drawCover();
    };
});

function setupEventListeners() {
    // Mode Toggles
    setupToggleGroup('desiBtn', 'videshiBtn', 'language', 'Desi', 'Videshi');

    // Lyrics Toggles
    const withTimestampBtn = document.getElementById('withTimestampBtn');
    const withoutTimestampBtn = document.getElementById('withoutTimestampBtn');
    const lyricsInput = document.getElementById('lyrics');
    const lyricsTextarea = document.getElementById('lyricsTextareaContainer');

    withTimestampBtn.addEventListener('click', () => {
        withTimestampBtn.classList.add('active');
        withoutTimestampBtn.classList.remove('active');
        lyricsInput.parentElement.classList.remove('hidden');
        lyricsTextarea.classList.add('hidden');
        lyricsInput.setAttribute('accept', '.lrc');
        lyricsInput.setAttribute('required', '');
    });

    withoutTimestampBtn.addEventListener('click', () => {
        withoutTimestampBtn.classList.add('active');
        withTimestampBtn.classList.remove('active');
        lyricsInput.parentElement.classList.add('hidden');
        lyricsTextarea.classList.remove('hidden');
        lyricsInput.removeAttribute('required');
    });

    // Size Buttons
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            saveVisualPreferences();
            drawCover();
        });
    });

    // Cover Options
    const useGeneratedBtn = document.getElementById('useGeneratedCover');
    const useCustomBtn = document.getElementById('useCustomCover');
    const customInput = document.getElementById('customCoverInput');
    const canvas = document.getElementById('coverPreview');

    useGeneratedBtn.addEventListener('click', () => {
        useGeneratedBtn.classList.add('active');
        useCustomBtn.classList.remove('active');
        customInput.classList.add('hidden');
        canvas.classList.remove('hidden');
    });

    useCustomBtn.addEventListener('click', () => {
        useCustomBtn.classList.add('active');
        useGeneratedBtn.classList.remove('active');
        customInput.classList.remove('hidden');
        canvas.classList.add('hidden');
    });

    // Live Preview Updates
    const inputs = ['flavour', 'title', 'language_song', 'album_name', 'icecreamColor', 'bgColor'];
    inputs.forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            if (id.includes('Color')) saveVisualPreferences();
            drawCover();
        });
    });

    // Form Submit
    document.getElementById('uploadForm').addEventListener('submit', handleUpload);
}

function setupToggleGroup(btn1Id, btn2Id, inputId, val1, val2) {
    const btn1 = document.getElementById(btn1Id);
    const btn2 = document.getElementById(btn2Id);
    const input = document.getElementById(inputId);

    btn1.addEventListener('click', () => {
        btn1.classList.add('active');
        btn2.classList.remove('active');
        input.value = val1;
        drawCover();
    });

    btn2.addEventListener('click', () => {
        btn2.classList.add('active');
        btn1.classList.remove('active');
        input.value = val2;
        drawCover();
    });
}

// Visual Preferences
function saveVisualPreferences() {
    const preferences = {
        size: document.querySelector('.size-btn.active').dataset.size,
        icecreamColor: document.getElementById('icecreamColor').value,
        bgColor: document.getElementById('bgColor').value
    };
    localStorage.setItem('visualPreferences', JSON.stringify(preferences));
}

function loadVisualPreferences() {
    const saved = localStorage.getItem('visualPreferences');
    if (saved) {
        const prefs = JSON.parse(saved);

        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === prefs.size);
        });

        document.getElementById('icecreamColor').value = prefs.icecreamColor;
        document.getElementById('bgColor').value = prefs.bgColor;
    }
}

// Cover Generation
function drawCover() {
    const canvas = document.getElementById('coverPreview');
    const ctx = canvas.getContext('2d');

    // Values
    const bgColor = document.getElementById('bgColor').value;
    const icecreamColor = document.getElementById('icecreamColor').value;
    const size = document.querySelector('.size-btn.active')?.dataset.size || 'M';
    const flavour = document.getElementById('flavour').value || 'Flavour';
    const title = document.getElementById('title').value || 'Song Title';
    const langSong = document.getElementById('language_song').value || 'Language';
    const album = document.getElementById('album_name').value || 'Album';

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Text Settings
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000000';

    // Album Name
    ctx.font = '28px "Courier Prime", monospace';
    ctx.fillText(album, canvas.width / 2, 100);

    // Flavour Label
    ctx.font = 'bold 35px "Courier Prime", monospace';
    ctx.fillText('Flavour', canvas.width / 2, 180);

    // Flavour Name
    ctx.font = '30px "Courier Prime", monospace';
    let displayFlavour = flavour.length > 18 ? flavour.substring(0, 15) + '...' : flavour;
    ctx.fillText(displayFlavour, canvas.width / 2, 240);

    // Ice Cream SVG
    if (window.svgLoaded) {
        const img = new Image();
        img.src = 'temp.svg';

        // Wait for image to be ready to draw
        if (img.complete) {
            drawIceCream(ctx, img, size, icecreamColor, canvas);
        } else {
            img.onload = () => drawIceCream(ctx, img, size, icecreamColor, canvas);
        }
    }

    // Size Label
    const sizeText = size === 'S' ? 'Small' : size === 'M' ? 'Medium' : 'Large';
    ctx.font = '24px "Courier Prime", monospace';
    ctx.fillText(`Size: ${sizeText}`, canvas.width / 2, canvas.height / 2 + 150);

    // Song Info Box
    drawSongInfoBox(ctx, canvas, title, langSong);
}

function drawIceCream(ctx, img, size, colorHex, canvas) {
    const scale = size === 'S' ? 0.8 : size === 'M' ? 0.9 : 1.0;
    const w = 200 * scale;
    const h = 200 * scale;
    const x = (canvas.width - w) / 2;
    const y = (canvas.height - h) / 2;

    // Create temp canvas for tinting
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');

    tempCtx.drawImage(img, 0, 0, w, h);

    // Tint Logic
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const data = imageData.data;
    const rgb = hexToRgb(colorHex);

    for (let i = 0; i < data.length; i += 4) {
        // Simple threshold for black/dark pixels to tint
        if (data[i] < 50 && data[i + 1] < 50 && data[i + 2] < 50) {
            data[i] = rgb.r;
            data[i + 1] = rgb.g;
            data[i + 2] = rgb.b;
        }
    }

    tempCtx.putImageData(imageData, 0, 0);
    ctx.drawImage(tempCanvas, x, y);
}

function drawSongInfoBox(ctx, canvas, title, lang) {
    const y = canvas.height - 120;

    // Language
    ctx.fillStyle = '#000000';
    ctx.font = '22px "Courier Prime", monospace';
    ctx.fillText(lang, canvas.width / 2, y - 60);

    // Box
    const padding = 40;
    const textWidth = ctx.measureText(title).width;
    const boxWidth = Math.max(200, textWidth + padding);
    const boxHeight = 50;
    const radius = 25;

    ctx.beginPath();
    ctx.roundRect((canvas.width - boxWidth) / 2, y - boxHeight / 2, boxWidth, boxHeight, radius);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px "Courier Prime", monospace';
    let displayTitle = title.length > 20 ? title.substring(0, 17) + '...' : title;
    ctx.fillText(displayTitle, canvas.width / 2, y + 8);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

async function handleUpload(e) {
    e.preventDefault();
    const formData = new FormData();

    // Text Fields
    ['language', 'flavour', 'language_song', 'title', 'album_name'].forEach(id => {
        formData.append(id, document.getElementById(id).value);
    });

    // Validate Files
    const MAX_LYRICS_SIZE = 1 * 1024 * 1024; // 1MB
    const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

    // Audio (no size check specified in instruction, keeping original)
    const audio = document.getElementById('audio').files[0];
    if (audio) formData.append('audio', audio);

    // Video
    const video = document.getElementById('video').files[0];
    if (video) {
        if (video.size > MAX_VIDEO_SIZE) {
            alert(`Video file is too large. Max size is 50MB. Current: ${(video.size / 1024 / 1024).toFixed(2)}MB`);
            return;
        }
        formData.append('video', video);
    }

    // Lyrics
    if (document.getElementById('withoutTimestampBtn').classList.contains('active')) {
        const text = document.getElementById('lyricsText').value;
        if (text) formData.append('lyrics', new Blob([text], { type: 'text/plain' }), 'lyrics.txt');
    } else {
        const file = document.getElementById('lyrics').files[0];
        if (file) {
            if (file.size > MAX_LYRICS_SIZE) {
                alert(`Lyrics file is too large. Max size is 1MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                return;
            }
            formData.append('lyrics', file);
        }
    }

    // Cover
    if (document.getElementById('useGeneratedCover').classList.contains('active')) {
        const canvas = document.getElementById('coverPreview');
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.9));
        formData.append('cover', blob, 'cover.jpg');
    } else {
        const file = document.getElementById('coverFile').files[0];
        if (file) {
            if (file.size > MAX_IMAGE_SIZE) {
                alert(`Cover image is too large. Max size is 2MB. Current: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
                return;
            }
            formData.append('cover', file);
        }
    }

    // Visual Prefs
    const prefs = {
        size: document.querySelector('.size-btn.active').dataset.size,
        icecreamColor: document.getElementById('icecreamColor').value,
        bgColor: document.getElementById('bgColor').value
    };
    formData.append('visualPreferences', JSON.stringify(prefs));

    try {
        const res = await fetch('/admin/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error(await res.text());
        alert('Upload Successful!');
        e.target.reset();
        drawCover();
    } catch (err) {
        alert('Upload Failed: ' + err.message);
    }
}
