import {
  BLOCK_DEFS,
  PALETTE_CATEGORIES,
  getPaletteBlocks,
  type BlockCategory,
  type BlockId,
} from '../game/blocks';
import { useGameStore } from '../store/gameStore';

export function CreativePalette() {
  const open = useGameStore((s) => s.paletteOpen);
  const selectedSlot = useGameStore((s) => s.selectedSlot);
  const setHotbarBlock = useGameStore((s) => s.setHotbarBlock);
  const setPaletteOpen = useGameStore((s) => s.setPaletteOpen);

  if (!open) return null;

  const blocks = getPaletteBlocks();

  const pick = (id: BlockId) => {
    setHotbarBlock(selectedSlot, id);
  };

  return (
    <div
      className="palette-overlay"
      onMouseDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label="Creative block palette"
    >
      <div className="palette-panel">
        <div className="palette-header">
          <h2>Creative Palette</h2>
          <p>
            Click a block to put it in hotbar slot <strong>{selectedSlot + 1}</strong>
          </p>
          <button type="button" className="palette-close" onClick={() => setPaletteOpen(false)}>
            Close (E)
          </button>
        </div>
        {PALETTE_CATEGORIES.map((cat) => (
          <CategorySection
            key={cat.id}
            category={cat.id}
            label={cat.label}
            blocks={blocks.filter((b) => b.category === cat.id)}
            onPick={pick}
          />
        ))}
      </div>
    </div>
  );
}

function CategorySection({
  category,
  label,
  blocks,
  onPick,
}: {
  category: BlockCategory;
  label: string;
  blocks: { id: BlockId; name: string; color: string; topColor?: string }[];
  onPick: (id: BlockId) => void;
}) {
  if (blocks.length === 0) return null;
  void category;
  return (
    <section className="palette-category">
      <h3>{label}</h3>
      <div className="palette-grid">
        {blocks.map((b) => {
          const def = BLOCK_DEFS[b.id];
          return (
            <button
              key={b.id}
              type="button"
              className="palette-item"
              title={b.name}
              onClick={() => onPick(b.id)}
            >
              <span
                className="palette-swatch"
                style={{
                  background: def?.topColor ?? def?.color ?? b.color,
                  opacity: def?.transparent ? def.opacity ?? 0.4 : 1,
                }}
              />
              <span className="palette-name">{b.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
