import { mapColor } from "./mapColor.js";

export async function extractColor(file) {
    const text = await file.text();
    //console.log("text: ", text)
    const match = text.match(/^Type:\s*(.+)$/mi);
    const type = match ? match[1].trim() : null;
    return mapColor(type) ?? "#444444";
}