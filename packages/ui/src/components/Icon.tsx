import { resolveIcon } from "../icons/registry";

export interface IconProps {
  name: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** Единая точка рендера иконок — см. registry.ts. Не импортировать `@tabler/icons-react` напрямую в приложении. */
export function Icon({ name, size = 20, strokeWidth = 2, className }: IconProps) {
  const TablerIcon = resolveIcon(name);
  return <TablerIcon size={size} stroke={strokeWidth} className={className} aria-hidden="true" />;
}
