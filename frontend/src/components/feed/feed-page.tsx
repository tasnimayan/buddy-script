"use client";

import { useState } from "react";
import { FeedColumns } from "./feed-columns";
import { FeedNav } from "./feed-nav";
import { ModeSwitch } from "./mode-switch";

export default function FeedPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  return (
    <div
      className={`_layout _layout_main_wrapper ${isDarkMode ? "_dark_wrapper" : ""}`}
    >
      {/* Theme Mode Switching Btn */}
      <ModeSwitch onToggle={toggleDarkMode} />

      <div className="_main_layout">
        <FeedNav />
        <FeedColumns />
      </div>
    </div>
  );
}
