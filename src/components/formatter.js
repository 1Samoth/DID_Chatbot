// fetch url page title
async function fetchPageTitle(url) {
    try {
        const response = await fetch(`http://localhost:3000/fetch-title?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        return data.title || 'titre non trouvé';
    } catch (error) {
        console.error(`Erreur lors du fetch du titre: ${error}`);
        return null;
    }
}

// replace URLs in text with their titles
export async function formatTextWithUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex);
    if (!urls) {
        return text; // No URLs found, return original text
    }

    for (const url of urls) {
        const title = await fetchPageTitle(url);
        const anchorTag = `<a href="${url}" target="_blank">${title}</a>`;
        text = text.replace(url, anchorTag);
    }

    return text;
}

export async function removeUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlRegex);
    if (!urls) {
        return text; // No URLs found, return original text
    }

    for (const url of urls) {
        const title = await fetchPageTitle(url);
        const anchorTag = `${title}`;
        text = text.replace(url, anchorTag).replace('*', '');
    }

    return text;
}