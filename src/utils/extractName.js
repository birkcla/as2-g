export async function extractName(file) {
    const text = await file.text();
    // Erste # Überschrift als Name, sonst Dateiname
    const match = text.match(/^#\s+(.+)/m);
    return match ? match[1] : file.name.replace(".md", "");
}