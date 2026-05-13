import {ContentProvider} from "./ContentContext.jsx";
import GraphViewer from "./GraphViewer/GraphViewer.jsx";
import {Panel, Group, Separator} from "react-resizable-panels";
import {MDViewer} from "./MDViewer/MDViewer.jsx";
import "./ContentContainer.css"
import {SelectionProvider} from "./SelectionContext.jsx";
import {NodeProvider} from "./NodeContext.jsx";
import GraphPanel from "./GraphPanel/GraphPanel.jsx";

export default function ContentContainer() {

    return (
        <ContentProvider>
            <SelectionProvider>
                <NodeProvider>
                    <div className="wrapper">
                        <div className="ContentContainer">
                            <Group direction="horizontal" className="ContentContainer">
                                <Panel id="left" defaultSize="50%" minSize="30%" className="ContentContainer">
                                    <MDViewer></MDViewer>
                                </Panel>

                                <Separator className="separatorStyle" disabled={false} draggable={true} id="separator"/>

                                <Panel id="right" minSize="30%" className="ContentContainer">
                                    <GraphPanel></GraphPanel>
                                </Panel>

                            </Group>
                        </div>
                    </div>
                </NodeProvider>
            </SelectionProvider>
        </ContentProvider>
    )
}