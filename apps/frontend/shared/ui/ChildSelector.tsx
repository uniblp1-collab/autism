"use client";

import { useEffect } from "react";
import { useChildren } from "../../features/children/useChildren";
import { useUiStore } from "../../store/uiStore";

export function ChildSelector() {
  const { data: children = [] } = useChildren();
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const setSelectedChildId = useUiStore((state) => state.setSelectedChildId);

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId, setSelectedChildId]);

  if (children.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-sm">
      Ребёнок:
      <select
        className="rounded-md border-2 border-gray-300 px-2 py-1"
        value={selectedChildId ?? ""}
        onChange={(e) => setSelectedChildId(e.target.value)}
      >
        {children.map((child) => (
          <option key={child.id} value={child.id}>
            {child.name}
          </option>
        ))}
      </select>
    </label>
  );
}
