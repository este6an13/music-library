/**
 * playlist.js — Playlist mode, selection, export, and random mix generator.
 *
 * Depends on: Utils (utils.js)
 * Communicates with Library via callbacks set during init.
 */
const Playlist = (function () {
    'use strict';

    let allTracks = [];
    let playlistMode = false;
    let selectedPlaylistTracks = new Set(); // Stores deezer_id strings

    /* ── Callbacks (set by Library) ── */
    let onRerenderGrid = null;    // () => re-render the current grid
    let onCloseModal = null;      // () => close modal

    /* ── Initialization ── */
    function init(tracks, opts = {}) {
        allTracks = tracks;
        if (opts.onRerenderGrid) onRerenderGrid = opts.onRerenderGrid;
        if (opts.onCloseModal) onCloseModal = opts.onCloseModal;
    }

    /* ── Playlist Mode ── */
    function isPlaylistMode() {
        return playlistMode;
    }

    function isSelected(deezerId) {
        return selectedPlaylistTracks.has(String(deezerId));
    }

    function togglePlaylistMode() {
        playlistMode = !playlistMode;
        const btn = document.getElementById('playlist-mode-btn');
        const panel = document.getElementById('playlist-panel');

        if (playlistMode) {
            btn.classList.add('active');
            panel.style.display = 'flex';
            document.body.classList.add('playlist-active');
        } else {
            btn.classList.remove('active');
            panel.style.display = 'none';
            document.body.classList.remove('playlist-active');
            selectedPlaylistTracks.clear();
            updatePlaylistUI();
        }

        if (onRerenderGrid) onRerenderGrid();
    }

    function toggleTrackSelection(deezerId) {
        const idStr = String(deezerId);
        if (selectedPlaylistTracks.has(idStr)) {
            selectedPlaylistTracks.delete(idStr);
        } else {
            selectedPlaylistTracks.add(idStr);
        }

        // Update checkbox visually without re-rendering entire grid
        const card = document.querySelector(`.track-card[data-deezer-id="${idStr}"]`);
        if (card) {
            if (selectedPlaylistTracks.has(idStr)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }

            const checkbox = card.querySelector('.playlist-checkbox');
            if (checkbox) {
                if (selectedPlaylistTracks.has(idStr)) {
                    checkbox.classList.add('checked');
                } else {
                    checkbox.classList.remove('checked');
                }
            }
        }
        updatePlaylistUI();
    }

    function updatePlaylistUI() {
        const countSpan = document.getElementById('playlist-count');
        const container = document.getElementById('playlist-items-container');
        if (!countSpan || !container) return;

        countSpan.textContent = `${selectedPlaylistTracks.size} tracks selected`;

        if (selectedPlaylistTracks.size === 0) {
            container.innerHTML = `<div class="empty-state" style="padding: 1rem 0; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                Click on songs in the library to add them to your playlist.
            </div>`;
            return;
        }

        let html = '';
        const selectedIds = Array.from(selectedPlaylistTracks);
        const tracks = selectedIds.map(id => allTracks.find(t => String(t.deezer_id) === id)).filter(Boolean);

        tracks.forEach(track => {
            html += `<div class="playlist-item">
                        <div class="playlist-item-info">
                            <span class="playlist-item-title" title="${Utils.escapeAttr(track.title)}">${Utils.escapeHtml(track.title)}</span>
                            <span class="playlist-item-artist" title="${Utils.escapeAttr(track.artist)}">${Utils.escapeHtml(track.artist)}</span>
                        </div>
                        <button class="playlist-item-remove" onclick="Library.toggleTrackSelection('${Utils.escapeAttr(track.deezer_id)}')" title="Remove">
                            <span class="material-symbols-outlined" style="font-size: 1.2rem;">close</span>
                        </button>
                    </div>`;
        });

        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    }

    function clearPlaylist() {
        selectedPlaylistTracks.clear();
        updatePlaylistUI();

        document.querySelectorAll('.playlist-checkbox.checked').forEach(el => {
            el.classList.remove('checked');
        });
        document.querySelectorAll('.track-card.selected').forEach(el => {
            el.classList.remove('selected');
        });
    }

    /* ── Export ── */
    function exportPlaylist(format) {
        if (selectedPlaylistTracks.size === 0) {
            alert('Please select some tracks first.');
            return;
        }

        const input = document.getElementById('playlist-name-input');
        let filename = input ? input.value.trim() : '';
        if (!filename) filename = 'My Playlist';

        const selectedIds = Array.from(selectedPlaylistTracks);
        const tracks = selectedIds.map(id => allTracks.find(t => String(t.deezer_id) === id)).filter(Boolean);

        let content = '';
        let mimeType = 'text/plain';

        if (format === 'm3u') {
            content += '#EXTM3U\n';
            tracks.forEach(t => {
                const durationInfo = t.duration ? Math.round(t.duration) : -1;
                content += `#EXTINF:${durationInfo},${t.artist} - ${t.title}\n`;
                content += `https://www.deezer.com/track/${t.deezer_id}\n`;
            });
            mimeType = 'audio/x-mpegurl';
            filename += '.m3u';
        }
        else if (format === 'csv') {
            content += 'Track Name,Artist Name,Album,ISRC\n';
            tracks.forEach(t => {
                const title = `"${(t.title || '').replace(/"/g, '""')}"`;
                const artist = `"${(t.artist || '').replace(/"/g, '""')}"`;
                const album = `"${(t.album || '').replace(/"/g, '""')}"`;
                const isrc = t.isrc || '';
                content += `${title},${artist},${album},${isrc}\n`;
            });
            mimeType = 'text/csv';
            filename += '.csv';
        }
        else if (format === 'txt') {
            tracks.forEach(t => {
                content += `${t.artist} - ${t.title}\n`;
            });
            filename += '.txt';
        }

        Utils.downloadBlob(content, filename, mimeType);
    }

    /* ── Random Mix Generator ── */
    function openRandomPlaylistModal() {
        if (!playlistMode) return;

        const tagSet = new Set();
        const artistSet = new Set();
        allTracks.forEach(t => {
            if (t.tags) t.tags.forEach(tag => tagSet.add(tag));
            if (t.artist) artistSet.add(t.artist);
        });
        const uniqueTags = Array.from(tagSet).sort();
        const uniqueArtists = Array.from(artistSet).sort((a, b) => a.localeCompare(b));

        let html = '<div class="detail-card" style="padding: 1.5rem;">';
        html += '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">';
        html += '<h2 style="font-family: var(--font-serif); margin: 0; font-size: 1.4rem;">Random Mix</h2>';
        html += '<button class="nav-icon-btn" onclick="closeModal()" title="Close" style="color: var(--text-muted);"><span class="material-symbols-outlined">close</span></button>';
        html += '</div>';

        // Size slider
        html += '<div class="random-mix-section">';
        html += '<label class="random-mix-label">Number of Tracks: <span id="random-mix-size-val" class="random-mix-slider-val">20</span></label>';
        html += '<input type="range" id="random-mix-size" class="random-mix-slider" min="1" max="100" value="20" oninput="document.getElementById(\'random-mix-size-val\').innerText=this.value">';
        html += '</div>';

        // Artist Search
        html += '<div class="random-mix-section">';
        html += '<label class="random-mix-label">Include Artists (Optional)</label>';
        html += '<div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">';
        html += '<input type="text" id="random-artist-input" class="artist-search-input" list="random-artist-list" placeholder="Search artists..." onkeydown="if(event.key===\'Enter\'){ event.preventDefault(); Library.addRandomMixArtist(); }">';
        html += '<datalist id="random-artist-list">';
        uniqueArtists.forEach(a => html += `<option value="${Utils.escapeAttr(a)}">`);
        html += '</datalist>';
        html += '<button type="button" class="btn btn-secondary" onclick="Library.addRandomMixArtist()">Add</button>';
        html += '</div>';
        html += '<div id="random-artist-chips" class="random-chip-container"></div>';
        html += '</div>';

        // Tag Filters
        html += '<div class="random-mix-section">';
        html += '<label class="random-mix-label">Include Tags (Optional)</label>';
        html += '<div class="random-chip-container">';
        uniqueTags.forEach(tag => {
            html += `<button type="button" class="random-chip tag-filter-chip" onclick="this.classList.toggle('selected')">${Utils.escapeHtml(tag)}</button>`;
        });
        if (uniqueTags.length === 0) html += '<span style="color: var(--text-muted); font-size: 0.8rem;">No tags available</span>';
        html += '</div>';
        html += '<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; line-height: 1.4;">If no artists or tags are selected, the mix will be truly random across all songs. If filters are active, the pool will contain songs that match <strong>any</strong> selected artist OR tag.</p>';
        html += '</div>';

        // Actions
        html += '<div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">';
        html += '<button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>';
        html += '<button type="button" class="btn btn-primary" onclick="Library.generateRandomPlaylist()">Generate</button>';
        html += '</div>';

        html += '</div>';

        const modalOverlay = document.getElementById('track-modal');
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = html;
        modalOverlay.classList.add('active');
    }

    function addRandomMixArtist() {
        const input = document.getElementById('random-artist-input');
        const val = input.value.trim();
        if (!val) return;

        const container = document.getElementById('random-artist-chips');
        const existing = Array.from(container.querySelectorAll('.random-chip')).map(el => el.textContent.replace(' ×', '').trim());
        if (existing.includes(val)) {
            input.value = '';
            return;
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'random-chip artist-filter-chip selected';
        btn.innerHTML = `${Utils.escapeHtml(val)} &times;`;
        btn.onclick = function () { this.remove(); };
        container.appendChild(btn);

        input.value = '';
    }

    function generateRandomPlaylist() {
        const sizeInput = document.getElementById('random-mix-size');
        if (!sizeInput) return;
        const size = parseInt(sizeInput.value, 10);

        const artistChips = Array.from(document.querySelectorAll('#random-artist-chips .artist-filter-chip'));
        const targetArtists = new Set(artistChips.map(el => el.textContent.replace(' ×', '').trim()).filter(Boolean));

        const tagChips = Array.from(document.querySelectorAll('.tag-filter-chip.selected'));
        const targetTags = new Set(tagChips.map(el => el.textContent.trim()).filter(Boolean));

        const hasFilters = targetArtists.size > 0 || targetTags.size > 0;

        let pool = [];
        if (!hasFilters) {
            pool = allTracks.slice();
        } else {
            pool = allTracks.filter(t => {
                const matchesArtist = t.artist && targetArtists.has(t.artist);
                const matchesTag = t.tags && t.tags.some(tag => targetTags.has(tag));
                return matchesArtist || matchesTag;
            });
        }

        if (pool.length === 0) {
            alert('No tracks match your selected filters. Try broadening your selection.');
            return;
        }

        // Fisher-Yates shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = pool[i];
            pool[i] = pool[j];
            pool[j] = temp;
        }

        const selectedSubset = pool.slice(0, size);

        clearPlaylist();
        selectedSubset.forEach(t => selectedPlaylistTracks.add(String(t.deezer_id)));

        if (onCloseModal) onCloseModal();
        updatePlaylistUI();

        if (onRerenderGrid) onRerenderGrid();
    }

    /* ── Public Interface ── */
    return {
        init,
        isPlaylistMode,
        isSelected,
        togglePlaylistMode,
        toggleTrackSelection,
        clearPlaylist,
        updatePlaylistUI,
        exportPlaylist,
        openRandomPlaylistModal,
        addRandomMixArtist,
        generateRandomPlaylist,
    };
})();
