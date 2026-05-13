import GraphViewer from "../GraphViewer/GraphViewer.jsx";
import NodeSearch from "../NodeSearch/NodeSearch.jsx";
import "./GraphPanel.css"

export default function GraphPanel() {
    return (
        <div className="graph-panel">
            <GraphViewer></GraphViewer>
            <NodeSearch></NodeSearch>
        </div>

    )
}