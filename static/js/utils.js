/**
 * utils.js — Shared utility functions for the music library.
 */
const Utils = (function () {
    'use strict';

    function escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeAttr(str) {
        if (!str) return '';
        return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function downloadBlob(content, filename, mimeType) {
        const a = document.createElement('a');
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        a.setAttribute('href', url);
        a.setAttribute('download', filename);
        a.click();
        URL.revokeObjectURL(url);
    }

    return { escapeHtml, escapeAttr, downloadBlob };
})();
