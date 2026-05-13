
import "./MDViewer.css"
import {useSelection} from "../SelectionContext.jsx";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


export function MDViewer() {

    const { selection } = useSelection();

    return (
        <div className="file-viewer">
            <div className="markdown-wrapper">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selection ? selection.textContent : "### No node selected"}
                </ReactMarkdown>
            </div>
        </div>
    )
}