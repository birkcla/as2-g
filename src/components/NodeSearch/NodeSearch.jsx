import {useState} from "react";
import {useNodes} from "../NodeContext.jsx";
import Select from "react-select";
import "./NodeSearch.css"
import {useSelection} from "../SelectionContext.jsx";

export default function NodeSearch() {
    const { nodes } = useNodes()
    const { setSelection } = useSelection()
    if (!nodes) return null;
    const allOptions = nodes.map(n => ({ value: n.id, label: n.name, node: n }));
    return (
        <div className="node-search">
            <Select
                menuPlacement="top"
                classNamePrefix="rs"
                unstyled
                options={allOptions}
                onChange={(opt) => {
                    if (opt) setSelection(opt.node);
                }}
                placeholder="Search..."
                isClearable
            />
        </div>
    )
}