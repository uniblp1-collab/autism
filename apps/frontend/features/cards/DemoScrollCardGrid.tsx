"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Сетка карточек офлайн-демо (TASK_DEMO_ENHANCEMENTS.md §2/§3) — заменяет постраничную
 * пагинацию стрелкой (PagedCardGrid, TASK_GRID_AND_TTS.md §A.3) на вертикальную прокрутку:
 * заказчик решил, что жест понятнее ребёнку, чем стрелка.
 *
 * Ключевое отличие от PagedCardGrid: размер плитки считается ТОЛЬКО из ширины контейнера и
 * числа карточек в ряду (колонок) — не из количества карточек в разделе. Это важно для
 * моторного планирования (AAC): карточка одного и того же физического размера что в разделе
 * из 4 карточек, что из 10 — лишние просто уходят вниз под прокрутку, а не уменьшают всех.
 *
 * Перетаскивание (@dnd-kit) — только когда `reorderable` (режим редактирования, раздел 3):
 * PointerSensor с activationConstraint.delay имитирует "зажатие" (long-press) вместо
 * мгновенного драга по первому же движению — короткий тап по-прежнему доходит до onClick
 * кнопки карточки (озвучивание), а не перехватывается как начало перетаскивания.
 */

const GAP_PX = 12;
// Долгое нажатие перед стартом драга — чтобы обычный тап (озвучить карточку) не путался с
// намерением переставить её; tolerance — на сколько px можно дрогнуть пальцем за это время.
const LONG_PRESS_DELAY_MS = 250;
const LONG_PRESS_TOLERANCE_PX = 8;

interface DemoScrollCardGridProps {
  /** Карточек в ряду — задаёт фиксированный размер плитки (см. JSDoc компонента). */
  cardsPerRow: number;
  /** Упорядоченный список id карточек — единственный источник порядка отображения. */
  cardIds: string[];
  /** Рендерит содержимое одной плитки по id — сама сетка не знает про Card/CardButton. */
  renderCard: (cardId: string, tileSize: number) => ReactNode;
  /** Разрешить перетаскивание (режим редактирования + обычный раздел, не «Избранное»). */
  reorderable?: boolean;
  /** Новый порядок id после drag-and-drop — сохраняется в localStorage вызывающей стороной. */
  onReorder?: (nextOrder: string[]) => void;
  /** Дополнительная плитка в конце сетки (например, оставлено для симметрии API — в демо не
   * используется, т.к. добавление карточек запрещено, раздел 8). */
  trailingTile?: ReactNode;
}

function SortableTile({ id, tileSize, children }: { id: string; tileSize: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        // "manipulation", а не "none": до истечения activationConstraint.delay (long-press)
        // PointerSensor ещё не перехватил жест, поэтому браузер должен свободно скроллить как
        // обычно — иначе в режиме редактирования, где карточки занимают почти весь экран, скролл
        // вниз не работает нигде, кроме узких зазоров между плитками (баг: карточки для
        // перестановки ниже первого экрана становились недостижимы). "none" тут не нужен: как
        // только долгое нажатие срабатывает и dnd-kit реально начинает драг, он сам перехватывает
        // последующие touchmove через preventDefault — "manipulation" лишь убирает двойной тап-зум,
        // не мешая обычной вертикальной прокрутке. Действует только пока карточки перетаскиваемые
        // (reorderable) — обычный просмотр вообще не рендерит SortableTile.
        touchAction: "manipulation",
        width: tileSize,
        height: tileSize,
      }}
    >
      {children}
    </div>
  );
}

export function DemoScrollCardGrid({
  cardsPerRow,
  cardIds,
  renderCard,
  reorderable = false,
  onReorder,
  trailingTile,
}: DemoScrollCardGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function recompute() {
      const node = containerRef.current;
      if (!node) return;
      const width = node.clientWidth;
      if (width <= 0) return;
      // Только ширина и число колонок — высота/число карточек намеренно не участвуют
      // (см. JSDoc: размер плитки фиксирован независимо от длины списка).
      const size = (width - (cardsPerRow - 1) * GAP_PX) / cardsPerRow;
      setTileSize((prev) => (Math.abs(prev - size) < 0.5 ? prev : size));
    }
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardsPerRow]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: LONG_PRESS_DELAY_MS, tolerance: LONG_PRESS_TOLERANCE_PX },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = cardIds.indexOf(String(active.id));
    const newIndex = cardIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(cardIds, oldIndex, newIndex));
  }

  const gridStyle = {
    gridTemplateColumns: `repeat(${cardsPerRow}, ${tileSize}px)`,
    gridAutoRows: `${tileSize}px`,
    gap: GAP_PX,
  };

  // Пока не измерили контейнер — не рендерим (иначе плитки нулевого размера мигнут на кадр).
  const ready = tileSize > 0;

  const tiles = ready
    ? cardIds.map((id) =>
        reorderable ? (
          <SortableTile key={id} id={id} tileSize={tileSize}>
            {renderCard(id, tileSize)}
          </SortableTile>
        ) : (
          <div key={id} style={{ width: tileSize, height: tileSize }}>
            {renderCard(id, tileSize)}
          </div>
        ),
      )
    : null;

  return (
    // overflow-y-auto + native inertial scroll (нативное поведение, без кастомных скроллбаров,
    // раздел 2) — вертикаль свободно прокручивается, лишние карточки просто ниже во весь рост.
    <div ref={containerRef} className="h-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      {ready ? (
        reorderable ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cardIds} strategy={rectSortingStrategy}>
              <div className="grid content-start justify-center pb-4" style={gridStyle}>
                {tiles}
                {trailingTile}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="grid content-start justify-center pb-4" style={gridStyle}>
            {tiles}
            {trailingTile}
          </div>
        )
      ) : null}
    </div>
  );
}
