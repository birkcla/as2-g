import {createContext, useContext, useState} from "react";

const selectionContext = createContext(null);

export const useSelection = () => useContext(selectionContext);

export function SelectionProvider({children}) {
    const [ selection, setSelection ] = useState(null)

    return <selectionContext.Provider value={{selection, setSelection}}>{children}</selectionContext.Provider>
}