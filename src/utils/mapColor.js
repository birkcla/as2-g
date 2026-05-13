export function mapColor(type) {
    const colors = {
        term: "#ff4444",
        person:  "#44aaff",
        discovery:   "#ffaa00",
        theory: "#00ff00",
        default: "#aaaaaa",
    };
    return colors[type] || colors.default;
}