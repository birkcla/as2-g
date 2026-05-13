export async function extractLinks(file) {
    const text = await file.text();
    // Alle [[wiki-links]] extrahieren
    return [...text.matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1]);
}