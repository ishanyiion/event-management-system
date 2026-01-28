/**
 * Utility to get a high-quality event image from Unsplash
 * @param {string} category - The event category name
 * @param {string} title - The event title
 * @returns {string} - Unsplash image URL
 */
export const formatEventImage = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/assets/')) return url;
    return `http://localhost:5000${url}`;
};

export const getEventImage = (category, title) => {
    // 1. Title Based Overrides (Local Assets)
    const titleOverrides = {
        'summer beats music fest': '/assets/images/events/summer-beats.png',
        'fun fest': '/assets/images/events/fun-fest.png',
        'fun fest event': '/assets/images/events/fun-fest.png',
        'ras garba': '/assets/images/events/ras-garba.png',
        'traditional play': '/assets/images/events/ras-garba.png'
    };

    const cleanTitle = title?.toLowerCase().trim();
    if (titleOverrides[cleanTitle]) return titleOverrides[cleanTitle];

    // 2. Category Based (Unsplash)
    const categoryMap = {
        'wedding': '1511795409834-ef04bbd61622',
        'corporate': '1505373877841-8d25f7d46678',
        'music': '1470225620800-ad1d5ec71412',
        'birthday': '1530103043440-ad2a2016584c',
        'workshop': '1524178232363-1fb2b075b655',
        'tech conference': '1504384308090-c894fdcc538d',
        'sports meet': '1461896742125-9922e4310398',
        'art exhibition': '1533158326339-7f3cf2404354',
        'food festival': '1555939594-58d7cb561ad1',
        'fashion show': '1558769132-cb1aea458c5e',
        'fest': '1533174072545-7a4b6ad7a6c3'
    };

    const catKey = category?.toLowerCase().trim() || '';
    let photoId = categoryMap[catKey];

    // 3. Keyword Based Fallbacks (if no exact match)
    if (!photoId) {
        if (catKey.includes('wedding')) photoId = categoryMap['wedding'];
        else if (catKey.includes('fest')) photoId = categoryMap['fest'];
        else if (catKey.includes('music')) photoId = categoryMap['music'];
        else if (catKey.includes('tech') || catKey.includes('code')) photoId = categoryMap['tech conference'];
        else if (catKey.includes('meet') || catKey.includes('conference') || catKey.includes('corporate')) photoId = categoryMap['corporate'];
        else if (catKey.includes('art')) photoId = categoryMap['art exhibition'];
        else if (catKey.includes('food')) photoId = categoryMap['food festival'];
        else if (catKey.includes('fashion')) photoId = categoryMap['fashion show'];
        else if (catKey.includes('birth')) photoId = categoryMap['birthday'];
    }

    photoId = photoId || '1501281668745-f7f07944d319'; // Default event crowd

    return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=80&w=800`;
};
