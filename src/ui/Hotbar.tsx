import { BLOCK_DEFS } from '../game/blocks';
import { useGameStore } from '../store/gameStore';

export function Hotbar() {
  const hotbar = useGameStore((s) => s.hotbar);
  const selectedSlot = useGameStore((s) => s.selectedSlot);
  const setSelectedSlot = useGameStore((s) => s.setSelectedSlot);

  return (
    <div className="hotbar" role="toolbar" aria-label="Block hotbar">
      {hotbar.map((slot, i) => {
        const def = BLOCK_DEFS[slot.block];
        const selected = i === selectedSlot;
        return (
          <button
            key={slot.block}
            type="button"
            className={`hotbar-slot${selected ? ' selected' : ''}`}
            onClick={() => setSelectedSlot(i)}
            title={`${def?.name ?? 'Block'} (${i + 1})`}
          >
            <span
              className="hotbar-swatch"
              style={{ background: def?.topColor ?? def?.color ?? '#fff' }}
            />
            <span className="hotbar-count">{slot.count}</span>
            <span className="hotbar-key">{i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
