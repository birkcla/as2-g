import { useState, useEffect } from "react";
import { extractName } from "../../utils/extractName.js";
import { extractLinks } from "../../utils/extractLinks.js";
import { extractColor } from "../../utils/extractColor.js";
import { useNodes } from "../NodeContext.jsx";

export function useGraphData(contentFiles) {
    const { setNodes } = useNodes();
    const [graphData, setGraphData] = useState({ nodes: [], links: [] });

    useEffect(() => {
        if (contentFiles.length === 0) return;

        const parseFiles = async () => {

            const files = await Promise.all(
                contentFiles.map(async (file) => {
                    const name = await extractName(file);
                    const slug = file.name.replace(".md", "");
                    const links = await extractLinks(file);
                    const color = await extractColor(file);
                    const textContent = await file.text();
                    return { slug, name, links, color, textContent, visible: true };
                })
            );

            const seen = new Set();
            const uniqueFiles = files.filter(f => !seen.has(f.slug) && seen.add(f.slug));

            const slugs = new Set(uniqueFiles.map((f) => f.slug));

            const nodes = uniqueFiles.map((n) => ({
                id: n.slug,
                name: n.name,
                textContent: n.textContent,
                val: 1 + n.links.length,
                color: n.color,
                visible: n.visible,
            }));

            const links = uniqueFiles.flatMap((n) =>
                n.links
                    .filter((link) => slugs.has(link))
                    .map((link) => ({ source: n.slug, target: link }))
            );

            setGraphData({ nodes, links });
            setNodes(nodes);
        };

        parseFiles();
    }, [contentFiles]);

    return graphData;
}