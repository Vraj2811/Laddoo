const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 8000;

// Serve static files
app.use(express.static('public'));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const { language, flavour } = req.body;

        if (!language || !flavour) {
            return cb(new Error('Language and flavour are required!'));
        }

        const uploadPath = path.join(__dirname, 'public', language, flavour);

        // Ensure the directory exists
        fs.mkdirSync(uploadPath, { recursive: true });

        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const { title } = req.body;

        if (!title) {
            return cb(new Error('Title is required!'));
        }

        // Extract the file extension
        const ext = path.extname(file.originalname);

        // Save as `title.extension`
        cb(null, `${title}${ext}`);
    },
});

const upload = multer({ storage });

// Utility function to check if a file already exists
function fileExists(directory, title) {
    const songPath = path.join(directory, `${title}.mp3`);
    const coverPath = path.join(directory, `${title}.jpg`);
    return fs.existsSync(songPath) || fs.existsSync(coverPath);
}

// API to get the list of songs
app.get('/songs', (req, res) => {
    const songDir = path.join(__dirname, 'public');
    const songs = [];

    try {
        const languages = fs.readdirSync(songDir);

        languages.forEach(language => {
            const languagePath = path.join(songDir, language);

            // Check if the current item is a directory
            if (fs.statSync(languagePath).isDirectory()) {
                fs.readdirSync(languagePath).forEach(flavour => {
                    const flavourPath = path.join(languagePath, flavour);

                    // Check if the current item is a directory
                    if (fs.statSync(flavourPath).isDirectory()) {
                        const files = fs.readdirSync(flavourPath);

                        files.forEach(file => {
                            if (file.endsWith('.mp3')) {
                                const title = file.replace('.mp3', '');

                                // Find cover image with supported extensions
                                const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
                                let coverPath = '';
                                for (const ext of imageExtensions) {
                                    if (files.includes(`${title}${ext}`)) {
                                        coverPath = `${language}/${flavour}/${title}${ext}`;
                                        break;
                                    }
                                }
                                // Fallback if no cover found (client handles empty/default)

                                // Find lyrics file
                                const lyricsExtensions = ['.lrc', '.txt'];
                                let lyricsPath = '';
                                for (const ext of lyricsExtensions) {
                                    if (files.includes(`${title}${ext}`)) {
                                        lyricsPath = `${language}/${flavour}/${title}${ext}`;
                                        break;
                                    }
                                }

                                // Find video file
                                const videoExtensions = ['.mp4', '.webm'];
                                let videoPath = '';
                                for (const ext of videoExtensions) {
                                    if (files.includes(`${title}${ext}`)) {
                                        videoPath = `${language}/${flavour}/${title}${ext}`;
                                        break;
                                    }
                                }

                                songs.push({
                                    songName: title,
                                    filePath: `${language}/${flavour}/${file}`,
                                    coverPath: coverPath,
                                    lyricsPath: lyricsPath,
                                    videoPath: videoPath, // New field
                                    flavor: flavour,
                                    language: language,
                                });
                            }
                        });
                    }
                });
            }
        });

        res.json(songs);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to load songs' });
    }
});

// Admin route for uploading songs and covers
app.post(
    '/admin/upload',
    upload.fields([
        { name: 'audio' },
        { name: 'cover' },
        { name: 'lyrics' },
        { name: 'video' },
    ]),
    (req, res) => {
        const { language, flavour, title } = req.body;

        if (!language || !flavour || !title) {
            return res.status(400).json({ message: 'Language, flavour, and title are required!' });
        }

        // Ensure the files were uploaded
        const audioFile = req.files.audio ? req.files.audio[0] : null;
        const coverFile = req.files.cover ? req.files.cover[0] : null;

        if (!audioFile || !coverFile) {
            return res.status(400).json({ message: 'Both audio and cover files are required!' });
        }

        res.json({
            message: 'Upload successful!',
            files: {
                audio: audioFile?.filename,
                cover: coverFile?.filename,
                lyrics: req.files.lyrics?.[0]?.filename,
                video: req.files.video?.[0]?.filename,
            },
        });
    }
);

// API for deleting files
app.post('/admin/delete', (req, res) => {
    const { language, flavour, title } = req.body;

    if (!language || !flavour || !title) {
        return res.status(400).json({ message: 'Language, flavour, and title are required!' });
    }

    const directory = path.join(__dirname, 'public', language, flavour);

    try {
        // Validate if directory exists
        if (!fs.existsSync(directory)) {
            return res.status(404).json({ message: 'Directory not found!' });
        }

        // Define file paths to delete
        const audioFile = path.join(directory, `${title}.mp3`);
        const coverFile = path.join(directory, `${title}.jpg`);
        const lyricsFile = path.join(directory, `${title}.lrc`);
        const videoFile = path.join(directory, `${title}.mp4`);
        const txtFile = path.join(directory, `${title}.txt`);

        // Delete files if they exist
        [audioFile, coverFile, lyricsFile, videoFile, txtFile].forEach((file) => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });

        // Check if the directory is empty after file deletion
        const filesInDirectory = fs.readdirSync(directory);
        if (filesInDirectory.length === 0) {
            // Remove the directory if it's empty
            fs.rmdirSync(directory);
            return res.json({ message: `Files for '${title}' deleted successfully, and the empty directory is removed!` });
        }

        res.json({ message: `Files for '${title}' deleted successfully!` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete files!', error: err.message });
    }
});



// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
