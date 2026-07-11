"use client";

import { useEffect } from "react";
import { AvatarInitials, useTheme } from "@autism-connect/ui";
import { useChildren } from "../../features/children/useChildren";
import { useUiStore } from "../../store/uiStore";

export function ChildSelector() {
  const { tokens } = useTheme();
  const { data: children = [] } = useChildren();
  const selectedChildId = useUiStore((state) => state.selectedChildId);
  const setSelectedChildId = useUiStore((state) => state.setSelectedChildId);

  useEffect(() => {
    if (!selectedChildId && children.length > 0) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId, setSelectedChildId]);

  if (children.length === 0) return null;

  const selectedChild = children.find((child) => child.id === selectedChildId);

  return (
    <label className="flex items-center gap-2" style={{ fontSize: 14, fontWeight: 400, color: tokens.textSecondary }}>
      {selectedChild ? <AvatarInitials name={selectedChild.name} size={32} /> : null}
      <select
        className="px-2 py-1"
        style={{ border: `1px solid ${tokens.border}`, borderRadius: 10, backgroundColor: tokens.surface }}
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
