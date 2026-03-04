import type React from "react";
import type { MerchVariant } from "@snc/shared";

import styles from "./variant-selector.module.css";

// ── Public Types ──

export interface VariantSelectorProps {
  readonly variants: MerchVariant[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}

// ── Public API ──

export function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: VariantSelectorProps): React.ReactElement {
  return (
    <div className={styles.container} role="radiogroup" aria-label="Product variants">
      {variants.map((variant) => {
        const isSelected = variant.id === selectedId;
        const isDisabled = !variant.available;

        return (
          <button
            key={variant.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            className={
              isSelected
                ? `${styles.chip} ${styles.chipSelected}`
                : isDisabled
                  ? `${styles.chip} ${styles.chipDisabled}`
                  : styles.chip
            }
            onClick={() => onSelect(variant.id)}
          >
            {variant.title}
          </button>
        );
      })}
    </div>
  );
}
