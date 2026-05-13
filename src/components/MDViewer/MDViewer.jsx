import "./MDViewer.css"
import { useSelection } from "../SelectionContext.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {useNodes} from "../NodeContext.jsx";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {useEffect, useRef} from "react";

export function MDViewer() {
    const { selection, setSelection } = useSelection(); // assumes nodes is in context
    const { nodes } = useNodes()

    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = 0;
        }
    }, [selection]);

    const processedContent = selection
        ? selection.textContent.replace(/\[\[([^\]]+)\]\]/g, (_, name) => `[${name}](${encodeURIComponent(name)})`)
        : null;

    const handleLinkClick = (href) => {
        const name = decodeURIComponent(href);
        console.log("clicked:", name);
        console.log("nodes:", nodes);
        const target = nodes.find(n => n.name === name);
        console.log("found:", target);
        if (target) setSelection(target);
    };

    function getContent() {
        if (!selection) {
            return <div>No node selected</div>
        } else {
            return (
                <div className="markdown-wrapper" ref={scrollRef}>
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
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
            )
        }
    }

    return (
        <div className="file-viewer">
            <div className="file-box">
                {getContent()}
            </div>
        </div>
    );
}