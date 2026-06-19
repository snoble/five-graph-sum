import { useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edge, NODE_LABELS, pairKey, reverse } from "../puzzle";

type ColId = "left" | "right";

interface EdgeEditorProps {
  left: readonly Edge[];
  right: readonly Edge[];
  /** Propagation amount per edge in application order (left then right). */
  amounts: readonly number[];
  onChange: (left: Edge[], right: Edge[]) => void;
}

export function EdgeEditor({ left, right, amounts, onChange }: EdgeEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    // Mouse: a small drag starts reordering; a plain click flips direction.
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // Touch: press-and-hold to drag, quick tap to flip. The delay (plus
    // `touch-action: none` on chips) keeps drags from fighting page scroll.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const edgeById = new Map<string, Edge>(
    [...left, ...right].map((e) => [pairKey(e.from, e.to), e]),
  );
  const leftIds = left.map((e) => pairKey(e.from, e.to));
  const rightIds = right.map((e) => pairKey(e.from, e.to));
  const containers: Record<ColId, string[]> = { left: leftIds, right: rightIds };

  // Global application order: left column first, then right.
  const orderOf = new Map<string, number>();
  leftIds.forEach((id, i) => orderOf.set(id, i + 1));
  rightIds.forEach((id, i) => orderOf.set(id, leftIds.length + i + 1));

  const idsToEdges = (ids: string[]): Edge[] =>
    ids.map((id) => edgeById.get(id)!);

  function findContainer(id: string): ColId | null {
    if (id === "left" || id === "right") return id;
    if (leftIds.includes(id)) return "left";
    if (rightIds.includes(id)) return "right";
    return null;
  }

  // Keep the global order (left then right) but re-split evenly so the two
  // columns stay balanced after a cross-column drop.
  function commit(next: Record<ColId, string[]>) {
    const seq = [...next.left, ...next.right];
    const half = Math.ceil(seq.length / 2);
    onChange(idsToEdges(seq.slice(0, half)), idsToEdges(seq.slice(half)));
  }

  function reverseOne(id: string) {
    const flip = (arr: readonly Edge[]) =>
      arr.map((e) => (pairKey(e.from, e.to) === id ? reverse(e) : e));
    if (leftIds.includes(id)) onChange(flip(left), [...right]);
    else onChange([...left], flip(right));
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const dragId = String(active.id);
    const overId = String(over.id);
    const from = findContainer(dragId);
    const to = findContainer(overId);
    if (!from || !to) return;

    if (from === to) {
      const arr = [...containers[from]];
      const oldIndex = arr.indexOf(dragId);
      const overIndex = arr.indexOf(overId);
      commit({
        ...containers,
        [from]: arrayMove(arr, oldIndex, overIndex < 0 ? arr.length - 1 : overIndex),
      });
      return;
    }

    const src = containers[from].filter((i) => i !== dragId);
    const dst = [...containers[to]];
    const overIndex = overId === to ? dst.length : dst.indexOf(overId);
    dst.splice(overIndex < 0 ? dst.length : overIndex, 0, dragId);
    commit({ ...containers, [from]: src, [to]: dst });
  }

  const activeEdge = activeId ? edgeById.get(activeId) : null;
  const activeOrder = activeId ? orderOf.get(activeId) ?? 0 : 0;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="editor">
        <Column
          id="left"
          ids={leftIds}
          edgeById={edgeById}
          orderOf={orderOf}
          amounts={amounts}
          onReverse={reverseOne}
        />
        <Column
          id="right"
          ids={rightIds}
          edgeById={edgeById}
          orderOf={orderOf}
          amounts={amounts}
          onReverse={reverseOne}
        />
      </div>
      <DragOverlay>
        {activeEdge ? (
          <div className="chip dragging">
            <ChipContent
              edge={activeEdge}
              order={activeOrder}
              amount={amounts[activeOrder - 1] ?? 0}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

interface ColumnProps {
  id: ColId;
  ids: string[];
  edgeById: Map<string, Edge>;
  orderOf: Map<string, number>;
  amounts: readonly number[];
  onReverse: (id: string) => void;
}

function Column({ id, ids, edgeById, orderOf, amounts, onReverse }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <SortableContext items={ids} strategy={verticalListSortingStrategy}>
      <div ref={setNodeRef} className={`col-list${isOver ? " over" : ""}`}>
        {ids.map((id) => {
          const order = orderOf.get(id)!;
          return (
            <EdgeChip
              key={id}
              id={id}
              edge={edgeById.get(id)!}
              order={order}
              amount={amounts[order - 1] ?? 0}
              onReverse={onReverse}
            />
          );
        })}
      </div>
    </SortableContext>
  );
}

interface EdgeChipProps {
  id: string;
  edge: Edge;
  order: number;
  amount: number;
  onReverse: (id: string) => void;
}

function EdgeChip({ id, edge, order, amount, onReverse }: EdgeChipProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="chip"
      {...attributes}
      {...listeners}
      onClick={() => onReverse(id)}
      title="Click to reverse direction · drag to reorder"
    >
      <ChipContent edge={edge} order={order} amount={amount} />
    </div>
  );
}

function ChipContent({
  edge,
  order,
  amount,
}: {
  edge: Edge;
  order: number;
  amount: number;
}) {
  return (
    <>
      <span className="chip-order">{order}</span>
      <span className="chip-edge">
        {NODE_LABELS[edge.from]}
        <span className="chip-arrow">→</span>
        {NODE_LABELS[edge.to]}
      </span>
      <span className="chip-amt">+{amount}</span>
    </>
  );
}
