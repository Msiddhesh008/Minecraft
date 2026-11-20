import { BLOCK_DEFS } from '../game/blocks';
import { useGameStore } from '../store/gameStore';

export function Hotbar() {
  const hotbar = useGameStore((s) => s.hotbar);
  const selectedSlot = useGameStore((s) => s.selectedSlot);
  const setSelectedSlot = useGameStore((s) => s.setSelectedSlot);
  const flying = useGameStore((s) => s.flying);

  return (
    <div className="hotbar-wrap">
      {flying ? <div className="fly-badge">FLY</div> : null}
      <div className="hotbar" role="toolbar" aria-label="Block hotbar">
        {hotbar.map((slot, i) => {
          const def = BLOCK_DEFS[slot.block];
          const selected = i === selectedSlot;
          return (
            <button
              key={`${i}-${slot.block}`}
              type="button"
              className={`hotbar-slot${selected ? ' selected' : ''}`}
              onClick={() => setSelectedSlot(i)}
              title={`${def?.name ?? 'Block'} (${i + 1})`}
            >
              <span
                className="hotbar-swatch"
                style={{
                  background: def?.topColor ?? def?.color ?? '#fff',
                  opacity: def?.transparent ? def.opacity ?? 0.4 : 1,
                }}
              />
              <span className="hotbar-inf">∞</span>
              <span className="hotbar-key">{i + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
