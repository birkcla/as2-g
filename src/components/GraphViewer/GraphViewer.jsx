import {useCallback, useEffect, useRef, useState} from "react";
import ForceGraph3D from "react-force-graph-3d";
import {useContent} from "../ContentContext.jsx";
import "./GraphViewer.css"
import * as THREE from "three";
import {UnrealBloomPass} from "three/addons";
import {useSelection} from "../SelectionContext.jsx";
import SpriteText from "three-spritetext";
import {useGraphData} from "../hooks/useGraphData.jsx";
import * as d3 from "d3-force-3d";


export default function GraphViewer() {



    const { selection, setSelection } = useSelection();

    const graphRef = useRef(null);

    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 100, height: 100 });







    const { contentFiles } = useContent();
    const graphData = useGraphData(contentFiles);
    const [loadedGraph, setLoadedGraph] = useState({ nodes: [], links: [] });

    //recalculate the currenly shown graph
    function recalculateLoadedGraph() {
        let visibleNodes;
        let visibleLinks;

        if (selection) {
            const selectedId = selection.id;
            const linkedIds = new Set([selectedId]);

            graphData.links
                .filter(l => (l.source?.id || l.source) === selectedId
                    || (l.target?.id || l.target) === selectedId)
                .forEach(l => {
                    linkedIds.add(l.source?.id || l.source);
                    linkedIds.add(l.target?.id || l.target);
                });

            visibleNodes = graphData.nodes.filter(n => linkedIds.has(n.id));
            visibleLinks = graphData.links.filter(
                l => linkedIds.has(l.source?.id || l.source)
                    && linkedIds.has(l.target?.id || l.target)
            );
        } else {
            visibleNodes = graphData.nodes.filter(n => n.visible);
            const visibleIds = new Set(visibleNodes.map(n => n.id));
            visibleLinks = graphData.links.filter(
                l => visibleIds.has(l.source?.id || l.source)
                    && visibleIds.has(l.target?.id || l.target)
            );
        }

        setLoadedGraph({ nodes: visibleNodes, links: visibleLinks });
    }

    //Make sure the recalculation ic triggered at beginning and whenever the files chang
    useEffect(() => {
        recalculateLoadedGraph();
    }, [graphData]);











    function startDelayedReframe() {
        if (!graphRef.current || loadedGraph.nodes.length === 0) return;
        graphRef.current.d3Force('charge').strength(-50);
        graphRef.current.d3Force('collide', d3.forceCollide(25));
        graphRef.current.d3ReheatSimulation();

        if (selection) {
            setTimeout(() => {
                graphRef.current.zoomToFit(2000, -20);
            }, 100);
        }

    }



    //make onrefresh called everytime new selection is here
    useEffect(() => {
        recalculateLoadedGraph()
    }, [selection])


    useEffect(() => {
        startDelayedReframe()
    }, [loadedGraph]);

    //make sure resizing is observed
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width: Math.round(width), height: Math.round(height) });
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);


    //ake sure resizing is recalculated
    useEffect(() => {
        if (!graphRef.current) return;
        const scale = 2000 / Math.max(dimensions.width, dimensions.height);
        graphRef.current.renderer().setPixelRatio(scale);
    }, [dimensions]);


    //make sure effects are applied
    useEffect(() => {
        if (!graphRef.current) return;
        const renderer = graphRef.current.renderer();
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.6;
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth / 4, window.innerHeight / 4),
            0.06, 0.4, 0.9,
        );
        graphRef.current.postProcessingComposer().addPass(bloom);
    }, []);

    //load lighting needs to be on loadedsubset
    useEffect(() => {
        if (!graphRef.current) return;
        const scene = graphRef.current.scene();
        scene.children.filter(c => c.isLight).forEach(l => scene.remove(l));
        scene.add(new THREE.AmbientLight("#ffffff", 0.1));
        //scene.add(new THREE.DirectionalLight("#ffffff", 0.3))
    }, [graphData]);







    const makeNode = useCallback((node) => {
        const color = node.color || "#aaaaaa";
        const group = new THREE.Group();
        const isSelected = selection?.id === node.id;

        group.add(new THREE.Mesh(
            new THREE.SphereGeometry(5, 8, 8),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: isSelected ? 8 : 0.2,
            })
        ));

        const hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(12, 4, 4),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        group.add(hitbox);

        const label = new SpriteText(node.name);
        label.color = "#ffffff";
        label.textHeight = isSelected ? 5 : 3;
        label.fontWeight = isSelected ? "bold" : "normal";
        label.position.y = 12;
        label.backgroundOpacity = 0;
        group.add(label);

        return group;
    }, [selection]);


    function onNodeSelection(node) {
        setSelection(node)
    }



  return (
    <div className="viewerMain" ref={containerRef}>
        <ForceGraph3D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={loadedGraph}
            nodeLabel="name"
            nodeResolution={4}
            linkWidth={0.75}
            linkColor="#ffffff"
            linkColor={(link) => {
                if (!selection) return "#888888";
                const src = link.source?.id || link.source;
                const tgt = link.target?.id || link.target;
                return (src === selection.id || tgt === selection.id) ? "#ffffff" : "#aaaaaa";
            }}
            linkOpacity={0.75}
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.8}
            backgroundColor="#000000"
            nodeThreeObject={makeNode}
            enableNodeDrag={true}
            onNodeClick={(n) => onNodeSelection(n)}
            onEngineTick={() => {
                if (!graphRef.current || loadedGraph.nodes.length === 0) return;
                const cam = graphRef.current.camera();
                let near = 0;
                if (selection) {
                    const n = loadedGraph.nodes.find(n => n.id === selection.id);
                    if (n) near = cam.position.distanceTo(new THREE.Vector3(n.x || 0, n.y || 0, n.z || 0));
                }
                const maxDist = Math.max(...loadedGraph.nodes.map(n => {
                    return cam.position.distanceTo(new THREE.Vector3(n.x || 0, n.y || 0, n.z || 0));
                }), 1);
                graphRef.current.scene().fog = new THREE.Fog("#000000", near, maxDist * 1.2);
            }}
        />
    </div>
  )
}