import { createContext, useContext, useState } from "react";

const nodeContext = createContext(null);

export const useNodes = () => useContext(nodeContext);

export function NodeProvider({ children }) {
    const [nodes, setNodes] = useState([]);

    return <nodeContext.Provider value={{ nodes, setNodes }}>{children}</nodeContext.Provider>
}