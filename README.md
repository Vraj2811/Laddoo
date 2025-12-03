# Laddoo Music - Reels-Style Music Streaming Application

A modern, immersive web-based music streaming application that brings the engaging "Reels" experience to music discovery. Built with Node.js and Vanilla JavaScript, it features a full-screen vertical scrolling interface, auto-play functionality, and a robust admin panel for content management.

## Overview

Laddoo Music reimagines the music player for the short-form content era. Instead of traditional lists, users swipe through full-screen song cards, each with its own visual identity, lyrics, and optional video background. It caters to diverse tastes with distinct "Desi" and "Videshi" modes and organizes content into "Flavors" (Albums).

## Key Features

### 1. Immersive Reels UI
*   **Full-Screen Experience**: Songs take up the entire screen for maximum visual impact.
*   **Snap Scrolling**: Smooth, TikTok-like vertical scrolling that snaps to each song.
*   **Auto-Play**: Media (audio/video) plays automatically as it snaps into view.
*   **Video Integration**: Support for video backgrounds that play in sync with the audio.

### 2. Smart Navigation & Discovery
*   **Dual Modes**: Toggle between "Desi" (Local) and "Videshi" (International) content.
*   **Home Page**: A dedicated hub to browse "Flavors" (Albums) and search for specific collections.
*   **Search**: Real-time search functionality to find albums and songs instantly.

### 3. Interactive Player Controls
*   **Overlay Controls**: Minimalist controls for Play/Pause, Like, and Share overlaid on the media.
*   **Lyrics Support**: Full-screen, scrolling lyrics overlay (supports both synced `.lrc` and plain text).
*   **Video Toggle**: Switch between Cover Art and Video mode with a single tap.

### 4. Powerful Admin Panel
*   **Content Management**: Upload songs, videos, and lyrics through a secure interface.
*   **Cover Generator**: Create custom cover art on the fly with customizable colors, text, and graphics.
*   **File Validation**: Built-in checks to ensure files meet size and format requirements (Lyrics < 1MB, Video < 50MB, Image < 2MB).
*   **Dark Theme**: A sleek, gold-accented dark UI for the admin dashboard.

## Technology Stack

*   **Backend**: Node.js with Express framework
*   **Frontend**: HTML5, CSS3, Vanilla JavaScript
*   **Database**: JSON-based file storage (NoSQL-style)
*   **Styling**: Custom CSS with CSS Scroll Snap and Glassmorphism effects

## Getting Started

### Prerequisites
*   Node.js (v14+ recommended)
*   npm (Node Package Manager)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/Vraj2811/Laddoo.git
    cd Laddoo
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the application**
    ```bash
    npm start
    ```

4.  **Access the App**
    *   **Player**: Open `http://localhost:8000` in your browser.
    *   **Admin Panel**: Open `http://localhost:8000/admin.html` to manage content.

## Usage

### For Listeners
1.  **Select Mode**: Choose "Desi" or "Videshi" on the Home Page.
2.  **Pick a Flavor**: Browse the grid or search for an album.
3.  **Enjoy**: Swipe up/down to change songs. Tap "Lyrics" to sing along.

### For Admins
1.  **Navigate to Admin**: Go to `/admin.html`.
2.  **Enter Details**: Fill in Song Title, Language, and Album.
3.  **Customize Cover**: Use the built-in generator to create a unique cover image.
4.  **Upload Media**: Attach MP3, Video (optional), and Lyrics files.
5.  **Submit**: Click upload to add the song to the library.

## Features Highlights

*   ✨ **Phone-Optimized Layout** - Designed to mimic a mobile app experience on any device.
*   🎨 **Dynamic Cover Generation** - Admin tool to generate consistent, branded cover art.
*   📜 **Synced Lyrics** - Support for `.lrc` files for karaoke-style scrolling lyrics.
*   🎥 **Hybrid Media** - Seamlessly handles both audio-only and video content.
*   🌗 **Dark Mode Aesthetic** - Premium dark interface with "Laddoo Gold" accents.
