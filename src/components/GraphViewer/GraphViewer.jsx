import {useCallback, useEffect, useRef, useState} from "react";
import ForceGraph3D from "react-force-graph-3d";
import {extractName} from "../../utils/extractName.js";
import {extractLinks} from "../../utils/extractLinks.js";
import {useContent} from "../ContentContext.jsx";
import "./GraphViewer.css"
import {extractColor} from "../../utils/extractColor.js";
import * as THREE from "three";
import {UnrealBloomPass} from "three/addons";
import {useSelection} from "../SelectionContext.jsx";
import SpriteText from "three-spritetext";
import {useNodes} from "../NodeContext.jsx";

export default function GraphViewer() {

    const { setNodes } = useNodes();

    const { selection, setSelection } = useSelection();

    const { contentFiles } = useContent();

    const graphRef = useRef(null);

    const [ graphData, setGraphData ] = useState({nodes:[], links:[]});


    let linkedIds = new Set();
    if (selection) {
        graphData.links
            .filter(l => (l.source?.id || l.source) === selection.id || (l.target?.id || l.target) === selection.id)
            .flatMap(l => [l.source?.id || l.source, l.target?.id || l.target])
            .forEach(id => linkedIds.add(id));
        linkedIds.add(selection.id);
    }


    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 100, height: 100 });

    function loadFiles() {
        if (contentFiles.length === 0) return;

        const parseFiles = async () => {
            const files = await Promise.all(
                contentFiles.map(async (file) => {
                    const name = await extractName(file);
                    const slug= file.name.replace(".md", "")
                    const links = await extractLinks(file)
                    const color = await extractColor(file)
                    const textContent = await file.text()
                    return {slug: slug, name: name, links: links, color: color, textContent: textContent, visible: true}
                }))

            const slugs = new Set(files.map(( file) => file.slug));

            const nodes = files.map((n) => ({
                id: n.slug,
                name: n.name,
                textContent: n.textContent,
                val: 1 + n.links.length,
                color: n.color,
                visible: n.visible,
            }))



            const links = files.flatMap((n) =>
            n.links
                .filter((link) => slugs.has(link))
                .map((link) => ({ source: n.slug, target: link}))
            )

            setGraphData({nodes, links})
            setNodes(nodes)
        }

        parseFiles()

    }

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(([entry]) => {
            const { width, height } = entry.contentRect;
            setDimensions({ width: Math.round(width), height: Math.round(height) });
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);


    useEffect(() => {
        loadFiles()
    }, [contentFiles])

    useEffect(() => {
        if (!graphRef.current) return;
        const scene = graphRef.current.scene();
        scene.children.filter(c => c.isLight).forEach(l => scene.remove(l));
        scene.add(new THREE.AmbientLight("#ffffff", 0.1));
        //scene.add(new THREE.DirectionalLight("#ffffff", 0.3))
    }, [graphData]);

    useEffect(() => {
        if (!graphRef.current) return;
        const scene = graphRef.current.scene();

        // remove old selection lights
        scene.children
            .filter(c => c.name?.startsWith("selectionLight"))
            .forEach(l => scene.remove(l));

        if (!selection) return;
        const node = selection;

        // main light on selected
        const light = new THREE.PointLight(node.color || "#ffffff", 6000, 150);
        light.name = "selectionLight_main";
        light.position.set(node.x || 0, node.y || 0, node.z || 0);
        scene.add(light);

    }, [selection]);

    useEffect(() => {
        if (!graphRef.current) return;
        const renderer = graphRef.current.renderer();
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.6;
        const bloom = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth / 4, window.innerHeight / 4),
            0.03, 0.4, 0.9,
        );
        graphRef.current.postProcessingComposer().addPass(bloom);
    }, []);

    useEffect(() => {
        if (!graphRef.current) return;
        const scale = 2000 / Math.max(dimensions.width, dimensions.height);
        graphRef.current.renderer().setPixelRatio(scale);
    }, [dimensions]);

    function onSelection(n) {
        setSelection(n);
    }

    useEffect(() => {
        const n = selection;
        if (!n) return;

        const linkedIds = new Set(
            graphData.links
                .filter(l => (l.source?.id || l.source) === n.id || (l.target?.id || l.target) === n.id)
                .flatMap(l => [l.source?.id || l.source, l.target?.id || l.target])
        );
        linkedIds.add(n.id);

        const linkedNodes = graphData.nodes.filter(node => linkedIds.has(node.id));
        if (linkedNodes.length === 0) return;

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;

        for (const node of linkedNodes) {
            minX = Math.min(minX, node.x || 0);
            maxX = Math.max(maxX, node.x || 0);
            minY = Math.min(minY, node.y || 0);
            maxY = Math.max(maxY, node.y || 0);
            minZ = Math.min(minZ, node.z || 0);
            maxZ = Math.max(maxZ, node.z || 0);
        }

        const cx = (minX + maxX) / 2;
        const cy = (minY + maxY) / 2;
        const cz = (minZ + maxZ) / 2;
        const spread = 1.4 * Math.max(maxX - minX, maxY - minY, maxZ - minZ, 50);

        const dx = maxX - minX;
        const dy = maxY - minY;
        const dz = maxZ - minZ;

        let camX = cx, camY = cy, camZ = cz;

        if (dx <= dy && dx <= dz) {
            camX = cx + spread * 1.5;
        } else if (dy <= dx && dy <= dz) {
            camY = cy + spread * 1.5;
        } else {
            camZ = cz + spread * 1.5;
        }

        setTimeout(() => {
            graphRef.current.cameraPosition(
                { x: camX, y: camY, z: camZ },
                { x: cx, y: cy, z: cz },
                1000
            );
            graphRef.current.controls().target.set(cx, cy, cz);
        }, 100);
    }, [selection])


    const makeNode = useCallback((node) => {
        const color = node.color || "#aaaaaa";
        const group = new THREE.Group();
        const isSelected = selection?.id === node.id;

        group.add(new THREE.Mesh(
            new THREE.SphereGeometry(5, 8, 8),
            new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: isSelected ? 4 : 0.2,
            })
        ));

        const hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(12, 4, 4),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        group.add(hitbox);

        const label = new SpriteText(node.name);
        label.color = "#ffffff";
        label.textHeight = 3;
        label.position.y = 12;
        label.backgroundOpacity = 0;
        group.add(label);

        return group;
    }, [selection]);



    const nodeVis = useCallback((node) => !selection || linkedIds.has(node.id), [selection, linkedIds]);

    const linkVis = useCallback((link) => {
        if (!selection) return true;
        const s = link.source?.id || link.source;
        const t = link.target?.id || link.target;
        return linkedIds.has(s) && linkedIds.has(t);
    }, [selection]);



  return (
    <div className="viewerMain" ref={containerRef}>
        <ForceGraph3D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            linkColor="#ffffff"
            nodeResolution={4}
            linkWidth={0.75}
            linkOpacity={0.5}
            nodeVisibility={nodeVis}
            linkVisibility={linkVis}
            backgroundColor="#000000"
            nodeThreeObject={makeNode}
            enableNodeDrag={true}
            onNodeClick={(n) => onSelection(n)}
        />
    </div>
  )
}