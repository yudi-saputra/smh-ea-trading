"use client";

import { useEffect } from "react";

/** Blocks browser context menu while this page is mounted. */
export function DisableContextMenu() {
  useEffect(() => {
    const onContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, []);

  return null;
}
