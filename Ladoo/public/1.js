// Initialize variables
let songIndex = 0;
let audioElement = new Audio();
let masterPlay = document.getElementById("masterPlay");
let previous = document.getElementById("previous");
let next = document.getElementById("next");
let ProgressBar = document.getElementById("ProgressBar");
let masterSongName = document.getElementById("masterSongName");
const menuIcon = document.querySelector(".menu-icon");
let songs = [];

// DOM elements for new functionality
const songListContainer = document.querySelector(".song-list");
const songsContainer = document.getElementById("songs-container");
let isVideoPlaying = false;

// At the top of the file, after other DOM element declarations
let songCoverContainer = document.querySelector(".song-cover-container");
const heartIcon = document.getElementById("heartIcon");

// Add these variables at the top with other initializations
let touchStartY = 0;
let touchEndY = 0;
let isSwiping = false;
let currentTransform = 0;

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Re-initialize elements after DOM is loaded
    masterPlay = document.getElementById("masterPlay");
    previous = document.getElementById("previous");
    next = document.getElementById("next");

    // Add click event listeners
    if (previous) {
        previous.removeEventListener('click', handlePreviousClick);
        previous.addEventListener('click', handlePreviousClick);
    }
    
    if (next) {
        next.removeEventListener('click', handleNextClick);
        next.addEventListener('click', handleNextClick);
    }

    // Add click handler for the arrow icon
    const rotateLeft = document.getElementById('rotateLeft');
    if (rotateLeft) {
        rotateLeft.addEventListener('click', () => {
            // Show flavor cards and search
            const flavorCardsContainer = document.getElementById('flavorCardsContainer');
            flavorCardsContainer.classList.remove('hidden');
            
            // Hide song cover
            const songCoverContainer = document.querySelector('.song-cover-container');
            if (songCoverContainer) {
                songCoverContainer.classList.add('hidden');
            }

            // Show search container
            const flavorSearchContainer = document.getElementById('flavorSearchContainer');
            if (flavorSearchContainer) {
                flavorSearchContainer.classList.remove('hidden');
            }

            // Hide navbar elements when returning to homepage
            toggleNavbarElements(false);

            // Pause the current song
            if (audioElement) {
                audioElement.pause();
                masterPlay.classList.remove('fa-pause-circle');
                masterPlay.classList.add('fa-play-circle');
            }
        });
    }

    // Initially hide navbar elements since we start on the homepage
    toggleNavbarElements(false);
});

// Handler functions
function handlePreviousClick() {
    if (isVideoPlaying) {
        removeVideoAndPlayPrevious();
        return;
    }

    const currentSong = songs[songIndex];
    if (!currentSong) return;

    const currentFlavor = currentSong.flavor;
    const currentLanguage = currentSong.language;

    let prevIndex = songIndex;
    let foundPrev = false;

    // Look for previous song with same flavor and language
    for (let i = 1; i <= songs.length; i++) {
        const testIndex = (songIndex - i + songs.length) % songs.length;
        const testSong = songs[testIndex];

        if (testSong.flavor === currentFlavor && 
            testSong.language === currentLanguage) {
            prevIndex = testIndex;
            foundPrev = true;
            break;
        }
    }

    // If no matching song found, just go to previous song
    if (!foundPrev) {
        prevIndex = (songIndex - 1 + songs.length) % songs.length;
    }

    songIndex = prevIndex;
    playSongSmooth('prev');
}

function handleNextClick() {
    if (isVideoPlaying) {
        removeVideoAndPlayNext();
        return;
    }

    const currentSong = songs[songIndex];
    if (!currentSong) return;

    const currentFlavor = currentSong.flavor;
    const currentLanguage = currentSong.language;

    let nextIndex = songIndex;
    let foundNext = false;

    // Look for next song with same flavor and language
    for (let i = 1; i <= songs.length; i++) {
        const testIndex = (songIndex + i) % songs.length;
        const testSong = songs[testIndex];

        if (testSong.flavor === currentFlavor && 
            testSong.language === currentLanguage) {
            nextIndex = testIndex;
            foundNext = true;
            break;
        }
    }

    // If no matching song found, just go to next song
    if (!foundNext) {
        nextIndex = (songIndex + 1) % songs.length;
    }

    songIndex = nextIndex;
    playSongSmooth('next');
}


function handleVideoClick(e) {
    e.stopPropagation(); // Prevent event bubbling
    const currentSong = songs[songIndex];
    if (!currentSong) return;

    isVideoPlaying = !isVideoPlaying;
    const videoPath = currentSong.coverPath.replace('.jpg', '.mp4');
    const videoIcon = document.getElementById("videoToggle");

    if (isVideoPlaying) {
        fetch(videoPath, { method: 'HEAD' })
            .then(response => {
                if (!response.ok) throw new Error("Video not found");

                songCoverContainer = document.querySelector(".song-cover-container");
                if (!songCoverContainer) {
                    throw new Error("Song cover container not found");
                }

                songCoverContainer.innerHTML = `
                    <video id="songVideo" class="song-cover" autoplay loop muted>
                        <source src="${videoPath}" type="video/mp4">
                        Your browser does not support video.
                    </video>
                `;

                const video = document.getElementById("songVideo");
                if (video) {
                    video.currentTime = audioElement.currentTime;
                    videoIcon.classList.remove("fa-video");
                    videoIcon.classList.add("fa-video-slash");
                }
            })
            .catch(error => {
                console.error("Video error:", error);
                alert("No video available for this song");
                isVideoPlaying = false;
                videoIcon.classList.remove("fa-video-slash");
                videoIcon.classList.add("fa-video");
            });
    } else {
        // Switch back to image
        songCoverContainer = document.querySelector(".song-cover-container");
        if (songCoverContainer) {
            restoreImage(currentSong.coverPath);
            videoIcon.classList.remove("fa-video-slash");
            videoIcon.classList.add("fa-video");
        }
    }
}

// Add this function to check if all required elements are present
function checkRequiredElements() {
    const elements = {
        masterPlay: document.getElementById("masterPlay"),
        previous: document.getElementById("previous"),
        next: document.getElementById("next"),
        songCoverContainer: document.querySelector(".song-cover-container")
    };

    const missingElements = Object.entries(elements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error("Missing required elements:", missingElements);
        return false;
    }
    return true;
}

// Fetch songs from the backend (dummy example for now)
fetch('/songs')
    .then(response => response.json())
    .then(data => {
        songs = data;
        if (!checkRequiredElements()) {
            throw new Error("Required elements not found in DOM");
        }
        renderFlavorCards();
        renderSongs();
        addEventListeners();
    })
    .catch(err => console.error("Error initializing app:", err));

function renderFlavorCards() {
    const categorizedSongs = categorizeSongs(songs);
    const flavorCardsContainer = document.getElementById('flavorCardsContainer');
    flavorCardsContainer.innerHTML = '';

    // Create array of all cards
    const cardElements = [];

    Object.entries(categorizedSongs).forEach(([language, flavors]) => {
        Object.entries(flavors).forEach(([flavor, songList]) => {
            const card = document.createElement('div');
            card.className = 'flavor-card';
            card.innerHTML = `
                <div class="flavor-language">${language}</div>
                <div class="flavor-subtitle">Flavour</div>
                <div class="flavor-name1">@${flavor.toLowerCase()}</div>
                <img src="temp.svg" alt="Ice cream" class="flavor-icon">
                <button class="play-button" data-language="${language}" data-flavor="${flavor}">
                    <img src="arrow.svg" alt="Play">
                </button>
            `;

            card.querySelector('.play-button').addEventListener('click', () => {
                const firstSongIndex = songs.findIndex(song =>
                    song.language === language && song.flavor === flavor
                );
                if (firstSongIndex !== -1) {
                    songIndex = firstSongIndex;
                    playSong();
                }
            });

            cardElements.push(card);
        });
    });

    // Add clones at start and end for infinite scroll
    const lastClone = cardElements[cardElements.length - 1].cloneNode(true);
    const firstClone = cardElements[0].cloneNode(true);
    lastClone.classList.add('clone');
    firstClone.classList.add('clone');

    // Add all cards to container
    flavorCardsContainer.appendChild(lastClone);
    cardElements.forEach(card => flavorCardsContainer.appendChild(card));
    flavorCardsContainer.appendChild(firstClone);

    // Set up infinite scroll behavior
    let isScrolling = false;
    flavorCardsContainer.addEventListener('scroll', () => {
        if (isScrolling) return;

        const scrollPosition = flavorCardsContainer.scrollLeft;
        const cardWidth = cardElements[0].offsetWidth;
        const totalWidth = cardWidth * cardElements.length;

        if (scrollPosition <= 0) {
            isScrolling = true;
            flavorCardsContainer.style.scrollBehavior = 'auto';
            flavorCardsContainer.scrollLeft = totalWidth;
            setTimeout(() => {
                flavorCardsContainer.style.scrollBehavior = 'smooth';
                isScrolling = false;
            }, 50);
        } else if (scrollPosition >= totalWidth + cardWidth) {
            isScrolling = true;
            flavorCardsContainer.style.scrollBehavior = 'auto';
            flavorCardsContainer.scrollLeft = cardWidth;
            setTimeout(() => {
                flavorCardsContainer.style.scrollBehavior = 'smooth';
                isScrolling = false;
            }, 50);
        }
    });

    // Initial scroll position
    const cardWidth = cardElements[0].offsetWidth;
    flavorCardsContainer.scrollLeft = cardWidth;

    initializeFlavorSearch();
}

// Categorize songs by language and flavor
function categorizeSongs(songs) {
    const categorized = {};

    songs.forEach(song => {
        const { language, flavor } = song;

        // Initialize categories if they don't exist
        if (!categorized[language]) categorized[language] = {};
        if (!categorized[language][flavor]) categorized[language][flavor] = [];

        categorized[language][flavor].push(song);
    });

    return categorized;
}

// Capitalize the first letter of a string
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Add event listeners
function addEventListeners() {
    // Toggle song list
    menuIcon.addEventListener('click', () => {
        if (songListContainer.classList.contains("hidden")) {
            songListContainer.classList.remove("hidden");
        } else {
            songListContainer.classList.add("hidden");
        }
    });

    // Play/pause functionality for song items
    const makeAllPlays = () => {
        Array.from(document.getElementsByClassName('songItemPlay')).forEach(el => {
            el.innerHTML = '<i class="far fa-play-circle"></i>';
        });
    };

    Array.from(document.getElementsByClassName('songItemPlay')).forEach(element => {
        element.addEventListener('click', e => {
            const button = e.target.closest("button");
            if (!button) {
                console.error("Play button not found for the clicked element:", e.target);
                return;
            }

            songIndex = parseInt(button.id);
            audioElement.src = songs[songIndex].filePath;
            makeAllPlays();
            button.innerHTML = '<i class="far fa-pause-circle"></i>';
            masterSongName.innerText = songs[songIndex].songName;
            masterPlay.classList.remove('fa-play-circle');
            masterPlay.classList.add('fa-pause-circle');
            audioElement.currentTime = 0;
            playSong();

            // Close the song list container after song selection
            const songListContainer = document.querySelector('.song-list-container');
            if (songListContainer) {
                songListContainer.classList.add('hidden');
            }
            
            // Reset menu icon state
            const menuIcon = document.querySelector('.menu-icon');
            if (menuIcon) {
                menuIcon.classList.remove('active');
            }
        });
    });

    // Master play/pause
    masterPlay.addEventListener('click', () => {
        if (audioElement.paused || audioElement.currentTime <= 0) {
            audioElement.play();
            masterPlay.classList.remove('fa-play-circle');
            masterPlay.classList.add('fa-pause-circle');
        } else {
            audioElement.pause();
            masterPlay.classList.remove('fa-pause-circle');
            masterPlay.classList.add('fa-play-circle');
        }
    });

    // Update progress bar during playback
    audioElement.addEventListener('timeupdate', () => {
        ProgressBar.value = (audioElement.currentTime / audioElement.duration) * 100;
    });

    // Seek functionality
    ProgressBar.addEventListener('change', () => {
        audioElement.currentTime = (ProgressBar.value * audioElement.duration) / 100;
    });

    // Next and previous buttons
    if (next) {
        next.addEventListener('click', (e) => {
            e.preventDefault();
            if (isVideoPlaying) {
                removeVideoAndPlayNext();
            } else {
                const currentSong = songs[songIndex];
                const currentFlavor = currentSong.flavor;
                const currentLanguage = currentSong.language;

                let nextIndex = songIndex;
                let foundNext = false;

                for (let i = 1; i <= songs.length; i++) {
                    const testIndex = (songIndex + i) % songs.length;
                    const testSong = songs[testIndex];

                    if (testSong.flavor === currentFlavor &&
                        testSong.language === currentLanguage) {
                        nextIndex = testIndex;
                        foundNext = true;
                        break;
                    }
                }

                if (!foundNext) {
                    nextIndex = (songIndex + 1) % songs.length;
                }

                songIndex = nextIndex;
                playSongSmooth('next');
            }
        });
    }

    if (previous) {
        previous.addEventListener('click', (e) => {
            e.preventDefault();
            if (isVideoPlaying) {
                removeVideoAndPlayPrevious();
            } else {
                const currentSong = songs[songIndex];
                const currentFlavor = currentSong.flavor;
                const currentLanguage = currentSong.language;

                let prevIndex = songIndex;
                let foundPrev = false;

                for (let i = 1; i <= songs.length; i++) {
                    const testIndex = (songIndex - i + songs.length) % songs.length;
                    const testSong = songs[testIndex];

                    if (testSong.flavor === currentFlavor &&
                        testSong.language === currentLanguage) {
                        prevIndex = testIndex;
                        foundPrev = true;
                        break;
                    }
                }

                if (!foundPrev) {
                    prevIndex = (songIndex - 1 + songs.length) % songs.length;
                }

                songIndex = prevIndex;
                playSongSmooth('prev');
            }
        });
    }


    // Heart icon click handler
    if (heartIcon) {
        heartIcon.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling
            console.log('Heart clicked'); // Debug log
            
            if (heartIcon.classList.contains('fa-regular')) {
                heartIcon.classList.remove('fa-regular');
                heartIcon.classList.add('fa-solid');
                heartIcon.style.color = "#ff0000";
                showTempOverlay();
            } else {
                heartIcon.classList.remove('fa-solid');
                heartIcon.classList.add('fa-regular');
                heartIcon.style.color = "";
            }
        });
        
        // Make sure the icon is clickable
        heartIcon.style.cursor = 'pointer';
        heartIcon.style.zIndex = '1000';
        heartIcon.style.position = 'relative';
    }

    // Video icon click handler
    const videoIcon = document.getElementById("videoToggle");
    if (videoIcon) {
        videoIcon.addEventListener('click', handleVideoClick);
        videoIcon.style.cursor = 'pointer';
        videoIcon.style.zIndex = '1000';
    }
}

function playSong() {
    audioElement.src = songs[songIndex].filePath;
    masterSongName.innerText = songs[songIndex].songName;

    // Set the cover image dynamically
    const songCoverImage = document.getElementById("songCoverImage");
    if (songs[songIndex].coverPath) {
        songCoverImage.src = songs[songIndex].coverPath;
    } else {
        songCoverImage.src = "/default/cover.jpg";
    }

    // Hide flavor cards and show cover
    const flavorCardsContainer = document.getElementById('flavorCardsContainer');
    flavorCardsContainer.classList.add('hidden');
    songCoverContainer.classList.remove('hidden');

    const flavorSearchContainer = document.getElementById('flavorSearchContainer');
    flavorSearchContainer.classList.add('hidden');  

    let songName = songs[songIndex].songName;
    if (songName.length > 18) {
        // Add a delay before starting the animation
        setTimeout(() => {
            masterSongName.innerHTML = `<div class="scrolling">${songName}</div>`;
        }, 1000);
    } else {
        masterSongName.innerHTML = songName;
    }

    // Reset time and ensure playback
    audioElement.currentTime = 0;
    const playPromise = audioElement.play();

    if (playPromise !== undefined) {
        playPromise.then(() => {
            // Playback started successfully
            masterPlay.classList.remove('fa-play-circle');
            masterPlay.classList.add('fa-pause-circle');
        })
            .catch(error => {
                console.error("Playback failed:", error);
            });
    }

    if (lyricsContainer.classList.contains("visible")) {
        lyricsContainer.classList.remove("visible");
    }

    // Show navbar elements when playing a song
    toggleNavbarElements(true);
}

// Replace the existing touch event listeners with these new ones
songCoverContainer.addEventListener("touchstart", (e) => {
    touchStartY = e.touches[0].clientY;
    isSwiping = true;
    
    // Get the cover image
    const coverImage = document.getElementById("songCoverImage");
    if (coverImage) {
        coverImage.style.transition = 'none';
    }
});

songCoverContainer.addEventListener("touchmove", (e) => {
    if (!isSwiping) return;
    
    touchEndY = e.touches[0].clientY;
    const deltaY = touchEndY - touchStartY;
    
    // Get the cover image
    const coverImage = document.getElementById("songCoverImage");
    if (coverImage) {
        // Apply transform with some resistance
        const resistance = 0.4;
        currentTransform = deltaY * resistance;
        coverImage.style.transform = `translateY(${currentTransform}px)`;
        coverImage.style.opacity = 1 - Math.abs(deltaY) / 1000;
    }
});

songCoverContainer.addEventListener("touchend", () => {
    if (!isSwiping) return;
    isSwiping = false;
    
    const deltaY = touchEndY - touchStartY;
    const coverImage = document.getElementById("songCoverImage");
    
    if (coverImage) {
        coverImage.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
        coverImage.style.transform = 'translateY(0)';
        coverImage.style.opacity = '1';
    }
    
    // Threshold for swipe
    const SWIPE_THRESHOLD = 100;
    
    if (Math.abs(deltaY) > SWIPE_THRESHOLD) {
        if (deltaY > 0) {
            // Swipe down (previous song)
            previousSongSmooth();
        } else {
            // Swipe up (next song)
            nextSongSmooth();
        }
    }
    
    // Reset values
    touchStartY = 0;
    touchEndY = 0;
    currentTransform = 0;
});

// Smoothly transition to the next song
function nextSongSmooth() {
    songIndex = (songIndex + 1) % songs.length;
    playSongSmooth('next');
}

// Smoothly transition to the previous song
function previousSongSmooth() {
    songIndex = (songIndex - 1 + songs.length) % songs.length;
    playSongSmooth('prev');
}

// Smooth play transition
function playSongSmooth(direction) {
    audioElement.pause();

    const songCoverContainer = document.querySelector(".song-cover-container");
    const songCoverImage = document.getElementById("songCoverImage");
    const currentSrc = songCoverImage.src;
    const nextSrc = songs[songIndex].coverPath;

    // Update song name with animation
    updateSongNameWithAnimation(direction);

    const transitionWrapper = document.createElement('div');
    transitionWrapper.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
    `;

    const currentImage = new Image();
    currentImage.src = currentSrc;
    currentImage.className = 'song-cover transitioning';

    const nextImage = new Image();
    nextImage.src = nextSrc;
    nextImage.className = 'song-cover transitioning';

    // Set initial positions for vertical transition
    currentImage.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        transform: translateY(0);
        transition: transform 0.4s ease, opacity 0.4s ease;
        z-index: 1;
    `;

    nextImage.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        transform: translateY(${direction === 'next' ? '100%' : '-100%'});
        transition: transform 0.4s ease, opacity 0.4s ease;
        z-index: 2;
        opacity: 0;
    `;

    transitionWrapper.appendChild(currentImage);
    transitionWrapper.appendChild(nextImage);
    songCoverContainer.innerHTML = '';
    songCoverContainer.appendChild(transitionWrapper);

    // Trigger animation with opacity
    requestAnimationFrame(() => {
        currentImage.style.transform = `translateY(${direction === 'next' ? '-100%' : '100%'})`;
        currentImage.style.opacity = '0';
        nextImage.style.transform = 'translateY(0)';
        nextImage.style.opacity = '1';
    });

    // Rest of the function remains the same...
    setTimeout(() => {
        let songName = songs[songIndex].songName;
        if (songName.length > 18) {
            // Add a delay before starting the animation
            setTimeout(() => {
                masterSongName.innerHTML = `<div class="scrolling">${songName}</div>`;
            }, 1000);
        } else {
            masterSongName.innerHTML = songName;
        }

        songCoverContainer.innerHTML = `<img id="songCoverImage" class="song-cover" src="${nextSrc}" alt="Song Cover">`;

        const flavorCardsContainer = document.getElementById('flavorCardsContainer');
        flavorCardsContainer.classList.add('hidden');
        songCoverContainer.classList.remove('hidden');

        audioElement.src = songs[songIndex].filePath;
        audioElement.currentTime = 0;
        ProgressBar.value = 0;

        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                masterPlay.classList.remove('fa-play-circle');
                masterPlay.classList.add('fa-pause-circle');
            }).catch(error => {
                console.error("Playback failed:", error);
            });
        }

        if (lyricsContainer.classList.contains("visible")) {
            lyricsContainer.classList.remove("visible");
        }
    }, 400);
}

// Add this new function after playSongSmooth
function updateSongNameWithAnimation(direction) {
    const songName = songs[songIndex].songName;
    const masterSongName = document.getElementById("masterSongName");
    
    // First remove any existing animation
    masterSongName.style.opacity = '0';
    
    setTimeout(() => {
        if (songName.length > 18) {
            masterSongName.innerHTML = `<div class="scrolling">${songName}</div>`;
        } else {
            masterSongName.innerHTML = songName;
        }
        masterSongName.style.opacity = '1';
    }, 200); // Short delay for smooth transition
}

let lyricsContainer = document.getElementById("lyricsContainer");
let lyricsContent = document.getElementById("lyricsContent");
let lyrics = [];

// Pen icon click to show lyrics
document.querySelector('.fa-pen-nib').addEventListener('click', () => {
    lyricsContainer.classList.toggle('visible'); // Toggle the 'visible' class
    if (lyricsContainer.classList.contains('visible')) {
        loadLyrics();
    }
});

function loadLyrics() {
    const currentSong = songs[songIndex];
    if (!currentSong) return; // Ensure the current song exists

    // Construct paths for both .lrc and .txt
    const lrcPath = currentSong.filePath.replace('.mp3', '.lrc');
    const txtPath = currentSong.filePath.replace('.mp3', '.txt');

    // Attempt to load .lrc file first
    fetch(lrcPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('LRC file not found'); // Proceed to .txt file
            }
            return response.text();
        })
        .then(data => {
            lyrics = parseLyrics(data); // Parse .lrc format
            displayLyrics();
        })
        .catch(() => {
            // Fallback to .txt file
            fetch(txtPath)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Lyrics file not found');
                    }
                    return response.text();
                })
                .then(data => {
                    displayPlainLyrics(data); // Display plain text lyrics
                })
                .catch(err => {
                    lyricsContent.innerHTML = "<p>Lyrics not available for this song.</p>";
                    console.error("Failed to load lyrics:", err);
                });
        });
}

function displayPlainLyrics(text) {
    // Clear previous lyrics content
    lyricsContent.innerHTML = "";

    // Split text by lines and create divs for each line
    const lines = text.split('\n');
    lines.forEach(line => {
        const lineDiv = document.createElement("div");
        lineDiv.classList.add("lyrics-line");
        lineDiv.innerText = line.trim();
        lyricsContent.appendChild(lineDiv);
    });

    // Remove timestamp synchronization for plain text lyrics
    audioElement.removeEventListener("timeupdate", updateLyrics);
}

// Parse lyrics from .lrc file
function parseLyrics(lrcText) {
    const lines = lrcText.split('\n');
    const parsedLyrics = lines.map(line => {
        const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/); // Time format [mm:ss.xx]
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const milliseconds = parseInt(match[3]);
            const lyricText = match[4].trim();
            const timeInSeconds = minutes * 60 + seconds + milliseconds / 100;
            return { time: timeInSeconds, text: lyricText };
        }
        return null;
    }).filter(line => line !== null); // Filter out invalid lines

    return parsedLyrics;
}

// Display lyrics based on current playback time
function displayLyrics() {
    // Clear previous lyrics content
    lyricsContent.innerHTML = "";

    // Add all lyrics lines
    lyrics.forEach((lyric, index) => {
        const line = document.createElement("div");
        line.classList.add("lyrics-line");
        line.dataset.index = index; // To keep track of lines
        line.innerText = lyric.text;
        lyricsContent.appendChild(line);
    });

    // Update lyrics scrolling and highlighting
    updateLyrics();
}

function updateLyrics() {
    const currentTime = audioElement.currentTime;

    // Find the closest lyric before or at the current time
    let currentIndex = lyrics.findIndex((lyric, i) => {
        return currentTime >= lyric.time &&
            (i === lyrics.length - 1 || currentTime < lyrics[i + 1].time);
    });

    if (currentIndex !== -1) {
        // Highlight the current line
        const lines = document.querySelectorAll(".lyrics-line");
        lines.forEach((line, index) => {
            line.classList.toggle("current", index === currentIndex);
        });

        // Scroll to keep the current line in the middle
        const currentLine = lines[currentIndex];
        if (currentLine) {
            lyricsContainer.scrollTo({
                top: currentLine.offsetTop - lyricsContainer.clientHeight / 2,
                behavior: "smooth"
            });
        }
    }
}

// Update lyrics while playing
audioElement.addEventListener("timeupdate", () => {
    if (lyricsContainer.classList.contains("visible")) {
        updateLyrics();
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const toggleIcon = document.getElementById('toggleIcon');

    toggleIcon.addEventListener('click', () => {
        if (toggleIcon.classList.contains('fa-pen-nib')) {
            toggleIcon.classList.remove('fa-pen-nib');
            toggleIcon.classList.add('fa-rotate-left');
        } else {
            toggleIcon.classList.remove('fa-rotate-left');
            toggleIcon.classList.add('fa-pen-nib');
        }
    });
});

// Restore image function
function restoreImage(coverPath) {
    songCoverContainer = document.querySelector(".song-cover-container");
    if (songCoverContainer) {
        songCoverContainer.innerHTML = `
            <img id="songCoverImage" class="song-cover" src="${coverPath}" alt="Song Cover">
        `;
    }
}

// Remove video on next/previous button clicks
next.addEventListener("click", () => {
    removeVideoAndPlayNext();
});

previous.addEventListener("click", () => {
    removeVideoAndPlayPrevious();
});

function removeVideoAndPlayNext() {
    restoreImage(songs[songIndex].coverPath);
    isVideoPlaying = false;
    handleNextClick(); // Use the main handler
}

function removeVideoAndPlayPrevious() {
    restoreImage(songs[songIndex].coverPath);
    isVideoPlaying = false;
    handlePreviousClick(); // Use the main handler
}


// Add this new function to handle the temp overlay
function showTempOverlay() {
    console.log('Showing overlay'); // Debug log
    const overlay = document.createElement("div");
    overlay.className = "temp-overlay";
    overlay.innerHTML = `<img src="temp.png" alt="Temp" class="temp-overlay-image">`;
    
    const songCoverContainer = document.querySelector(".song-cover-container");
    if (songCoverContainer) {
        songCoverContainer.appendChild(overlay);
        
        // Force reflow
        overlay.offsetHeight;
        
        // Add show class
        overlay.classList.add("show");
        
        // Remove overlay after animation
        setTimeout(() => {
            overlay.classList.remove("show");
            setTimeout(() => overlay.remove(), 300);
        }, 1500);
    }
}

// Add this helper function for video playback
function handleVideoPlay(videoPath, currentSong) {
    fetch(videoPath, { method: 'HEAD' })
        .then(response => {
            if (!response.ok) throw new Error("Video not found");

            if (!songCoverContainer) {
                throw new Error("Song cover container not found");
            }

            songCoverContainer.innerHTML = `
                <video id="songVideo" class="song-cover" autoplay loop>
                    <source src="${videoPath}" type="video/mp4">
                    Your browser does not support video.
                </video>
            `;
        })
        .catch(error => {
            console.error("Video error:", error);
            alert("No video available for this song");
            isVideoPlaying = false;
        });
}

function initializeFlavorSearch() {
    const searchBox = document.getElementById('flavorSearchBox');
    const flavorCards = document.querySelectorAll('.flavor-card:not(.clone)'); // Exclude clones from search
    const flavorCardsContainer = document.getElementById('flavorCardsContainer');

    searchBox.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let firstMatchFound = false;
        
        flavorCards.forEach(card => {
            const flavorName = card.querySelector('.flavor-name1').textContent.toLowerCase();
            const flavorLanguage = card.querySelector('.flavor-language').textContent.toLowerCase();
            
            if (flavorName.includes(searchTerm) || flavorLanguage.includes(searchTerm)) {
                card.classList.remove('filtered');
                
                // Scroll to first match
                if (!firstMatchFound) {
                    firstMatchFound = true;
                    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
                }
            } else {
                card.classList.add('filtered');
            }
        });

        // If search is empty, reset all cards
        if (searchTerm === '') {
            flavorCards.forEach(card => card.classList.remove('filtered'));
            // Scroll to the first non-clone card
            const firstCard = document.querySelector('.flavor-card:not(.clone)');
            if (firstCard) {
                firstCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        }
    });

    // Add focus/blur effects
    searchBox.addEventListener('focus', () => {
        searchBox.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    });

    searchBox.addEventListener('blur', () => {
        searchBox.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    });
}

const searchInput = document.getElementById("searchInput");
const searchResultsContainer = document.getElementById("searchResultsContainer");

searchInput.addEventListener("input", function (event) {
    const query = event.target.value.toLowerCase();

    // Clear previous search results
    searchResultsContainer.innerHTML = "";

    if (query === "") {
        searchResultsContainer.classList.add("hidden");
        return;
    }

    // i need list of songs that match the query
    const filteredSongs = songs.filter(song => song.songName.toLowerCase().includes(query));

    // display the filtered songs in the search results container
    filteredSongs.forEach(song => {
        const songElement = document.createElement("div");
        songElement.classList.add("search-result-item");
        songElement.textContent = song.songName;
        searchResultsContainer.appendChild(songElement);
    });

    searchResultsContainer.classList.remove("hidden");

    // I need to add a click listener to each song in the search results container
    searchResultsContainer.addEventListener("click", (event) => {
        const songElement = event.target;
        songIndex = songs.findIndex(s => s.songName === songElement.textContent);
        playSong();
    });

    // close the search results container when a song is clicked
    searchResultsContainer.addEventListener("click", () => {
        searchResultsContainer.classList.add("hidden");
        searchInput.value = '';
    });
});


function renderSongs() {
    const categorizedSongs = categorizeSongs(songs);

    const html = Object.entries(categorizedSongs).map(([language, flavors]) => {
        // I want the svg to be of white color
        return `
                <div class="language-category">
                    <h2>${capitalize(language)} Flavours
                    <img src="temp.svg" alt="temp" class="temp-svg"></h2>
                    ${Object.entries(flavors).map(([flavor, songList]) => {
            const songCount = songList.length;
            return `
                            <div class="flavor-category">
                                <h4 class="flavor-name" data-flavor="${flavor}">
                                    ${capitalize(flavor)} 
                                    <span class="arrow">▼</span>
                                </h4>
                                <ul class="song-list hidden">
                                    ${songList.map(song => {
                const globalIndex = songs.findIndex(s => s === song); // Get global index
                return `
                                            <li class="song-item" data-index="${globalIndex}">
                                                <span>${song.songName}</span>
                                                <button id="${globalIndex}" class="songItemPlay">
                                                    <i class="far fa-play-circle"></i>
                                                </button>
                                            </li>
                                        `;
            }).join('')}
                                </ul>
                            </div>
                        `;
        }).join('')}
                </div>
            `;
    }).join('');

    songsContainer.innerHTML = html;

    // Add toggle functionality for flavor categories
    document.querySelectorAll('.flavor-name').forEach(header => {
        header.addEventListener('click', () => {
            const songList = header.nextElementSibling;
            songList.classList.toggle('hidden');
            const arrow = header.querySelector('.arrow');
            arrow.textContent = songList.classList.contains('hidden') ? '▼' : '▲';
        });
    });
}

// Add this function to toggle navbar elements
function toggleNavbarElements(showElements) {
    const searchBar = document.querySelector('.search-bar');
    const menuIcon = document.querySelector('.menu-icon');
    
    if (showElements) {
        searchBar.classList.remove('hidden');
        menuIcon.classList.remove('hidden');
    } else {
        searchBar.classList.add('hidden');
        menuIcon.classList.add('hidden');
    }
}
