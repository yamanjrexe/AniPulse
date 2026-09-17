
export const escapeHtml = (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    const d = new Date(dateString);
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    return d.toLocaleDateString();
};

export const formatCompactNumber = (num) => {
    if (num == null) return '0';
    if (num >= 1e6) return (num / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
};

export const formatNumberShort = (num) => {
    if (num == null) return '0';
    if (num >= 1e6) { const v = Math.floor(num / 1e5) / 10; return v % 1 === 0 ? v.toFixed(0) + 'M' : v + 'M'; }
    if (num >= 1e3) { const v = Math.floor(num / 1e2) / 10; return v % 1 === 0 ? v.toFixed(0) + 'K' : v + 'K'; }
    return num.toString();
};

export const parseDateSafely = (s) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
};

export const getCurrentMonth = () => new Date().toLocaleString('default', { month: 'long' });
