import React, { createContext, useContext, useState } from "react";
import { Page } from "../types";

interface NavCtx {
  page: Page;
  navigate: (page: Page) => void;
  history: Page[];
  back: () => void;
}

const Ctx = createContext<NavCtx | null>(null);

export function NavProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<Page[]>([{ id: "home" }]);

  const page = history[history.length - 1];

  const navigate = (next: Page) => {
    setHistory((h) => [...h, next]);
  };

  const back = () => {
    setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  };

  return (
    <Ctx.Provider value={{ page, navigate, history, back }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useNav must be within NavProvider");
  return ctx;
}
