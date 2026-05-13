import "./MDViewer.css"
import { useSelection } from "../SelectionContext.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {useNodes} from "../NodeContext.jsx";

export function MDViewer() {
    const { selection, setSelection } = useSelection(); // assumes nodes is in context
    const { nodes } = useNodes()

    const processedContent = selection
        ? selection.textContent.replace(/\[\[([^\]]+)\]\]/g, (_, name) => `[${name}](${encodeURIComponent(name)})`)
        : "### No node selected";

    const handleLinkClick = (href) => {
        const name = decodeURIComponent(href);
        console.log("clicked:", name);
        console.log("nodes:", nodes);
        const target = nodes.find(n => n.name === name);
        console.log("found:", target);
        if (target) setSelection(target);
    };

    return (
        <div className="file-viewer">
            <div className="markdown-wrapper">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        a: ({ href, children }) => {
                            const isExternal = href.startsWith("http://") || href.startsWith("https://");

                            if (isExternal) {
                                return (
                                    <a href={href} target="_blank" rel="noreferrer">
                                        {href}
                                    </a>
                                );
                            }

                            return (
                                <a href={href} onClick={(e) => { e.preventDefault(); handleLinkClick(href); }}>
                                    {children}
                                </a>
                            );
                        }
                    }}
                >
                    {processedContent}
                </ReactMarkdown>
            </div>
        </div>
    );
}