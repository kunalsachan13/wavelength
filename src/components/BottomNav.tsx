import React from "react";
import { useNav } from "../store/useNavigation";
import { Page } from "../types";
import { Home, Search, Library, User } from "lucide-react";

interface TabItem {
  id: Page["id"];
  label: string;
  icon: (active: boolean) => React.ReactElement;
}

const tabs: TabItem[] = [
  {
    id: "home",
    label: "Home",
    icon: (active) => (
      <Home
        className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
        strokeWidth={active ? 2.5 : 2}
      />
    ),
  },
  {
    id: "search",
    label: "Search",
    icon: (active) => (
      <Search
        className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
        strokeWidth={active ? 2.5 : 2}
      />
    ),
  },
  {
    id: "library",
    label: "Library",
    icon: (active) => (
      <Library
        className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
        strokeWidth={active ? 2.5 : 2}
      />
    ),
  },
  {
    id: "profile",
    label: "Profile",
    icon: (active) => (
      <User
        className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
        strokeWidth={active ? 2.5 : 2}
      />
    ),
  },
];


export default function BottomNav() {
  const { page, navigate } = useNav();

  return (
    <div
      className="flex items-center justify-around px-2 sm:px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-white/5 bg-black/95 backdrop-blur-xl relative z-20"
    >
      {tabs.map((tab) => {
        const active = page.id === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate({ id: tab.id } as Page)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              active ? "text-[#5EEAD4]" : "text-[#a7a7a7] hover:text-white"
            }`}
          >
            {tab.icon(active)}
            <span
              className={`text-[10px] font-display font-semibold transition-colors ${
                active ? "text-[#5EEAD4]" : "text-[#a7a7a7]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

