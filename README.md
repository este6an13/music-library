# Music Library

A personal music collection site built with FastAPI, Jinja2, and Vanilla JS. It allows users to manage a local database of their favorite tracks, utilizing the Deezer public API to fetch rich metadata and cover art.

## Features

- **Add Tracks via Deezer**: Simply input a Deezer track ID to fetch complete metadata (title, artist, album, year, duration) and automatically download the cover art.
- **Dynamic Organization**: Group your collection by Artist, Year, or Tags. Filter tracks client-side with instant search.
- **Tag Management**: Add, remove, and filter by custom tags for personal categorization.
- **Global Audio Player**: Listen to 30-second previews seamlessly with a persistent "Now Playing" bar.
- **Radio Mode (Autoplay)**: An intelligent autoplay engine that selects the next track based on artist similarity, shared tags, and release era, with an added temperature factor for surprising musical discoveries.
- **Random Playlists**: Generate random playlists on the fly by selecting specific tags or artists, and limiting the track count.
- **Playlist Export**: Select specific tracks and export playlists in `.M3U`, `.CSV`, or `.TXT` formats.
- **Library Import/Export**: Import tracks in bulk using CSV, JSON, or XLSX files. Export your entire library for backup.
- **Sleek UI/UX**: Features a dark theme with glassmorphism effects, inspired by modern design paradigms.

## Architecture

The project follows a standard lightweight FastAPI structure:

```text
music-library/
├── app/
│   ├── main.py           # FastAPI application and route definitions
│   └── music_service.py  # Deezer API client and rate-limiting logic
├── data/                 # Auto-generated directory for local storage
│   ├── library.json      # JSON database of all tracks
│   └── covers/           # Locally downloaded cover images
├── static/
│   ├── css/style.css     # Vanilla CSS design system
│   └── js/library.js     # Client-side UI logic and player state
├── templates/
│   ├── base.html         # Base Jinja2 layout (Header, Player, Footer)
│   ├── add.html          # Add/Import track page
│   └── library.html      # Main library grid and modals
├── pyproject.toml        # Project dependencies
└── README.md
```

## Prerequisites

- **Python 3.11+**
- **uv** (recommended for fast dependency management and execution)

## Setup & Running

1. **Install uv** (if you haven't already):
   ```bash
   pip install uv
   ```

2. **Run the Development Server**:
   Navigate to the project directory and run the uvicorn server via `uv`:
   ```bash
   uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Note: `uv run` will automatically resolve dependencies from `pyproject.toml` and run the application in an isolated environment.*

3. **Open the Application**:
   Navigate to `http://127.0.0.1:8000` in your web browser.

## Managing Data

- **Storage**: All data is stored locally in the `data/` folder (which is ignored by Git). 
- `data/library.json` acts as the single source of truth for your track metadata.
- Cover images are downloaded to `data/covers/` to avoid hotlinking and ensure they are always available offline.
- Previews are fetched live from the Deezer API to ensure the URLs do not expire.
