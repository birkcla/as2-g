import {createContext, useContext, useState} from "react";

const contentContext = createContext(null);

const mdFiles = import.meta.glob("/content/*/*.md" , {query: "?raw", import: "default", eager: true});

export const useContent = () => useContext(contentContext);

export function ContentProvider({children}) {


    function loadFiles() {
        const entries = Object.entries(mdFiles)
        const result = []
        for (const [path, content] of entries) {
            const name = path.split("/").pop().replace(".md", "")
            const file = new File([content], name, { type: "text/markdown" });
            result.push(file)
        }
        return result
    }

    const [ contentFiles ] = useState(loadFiles)

    return <contentContext.Provider value={{contentFiles}}>{children}</contentContext.Provider>
}