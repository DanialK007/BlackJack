import { createContext, useContext, useRef } from "react";
import type { RefObject } from "react";

interface DeckContextType {
  deckRef: RefObject<HTMLDivElement | null>;
}

const DeckContext = createContext<DeckContextType>({
  deckRef: { current: null },
});

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const deckRef = useRef<HTMLDivElement>(null);
  return (
    <DeckContext.Provider value={{ deckRef }}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDeckContext() {
  return useContext(DeckContext);
}
