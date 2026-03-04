import { Link } from "@tanstack/react-router";
import type React from "react";
import type { MerchProduct } from "@snc/shared";

import { formatPrice } from "../../lib/format.js";
import styles from "./product-card.module.css";

// ── Public Types ──

export interface ProductCardProps {
  readonly product: MerchProduct;
}

// ── Public API ──

export function ProductCard({
  product,
}: ProductCardProps): React.ReactElement {
  return (
    <Link
      to="/merch/$handle"
      params={{ handle: product.handle }}
      className={styles.card}
    >
      <div className={styles.imageWrapper}>
        {product.image ? (
          <img
            src={product.image.url}
            alt={product.image.altText ?? product.title}
            className={styles.image}
            loading="lazy"
          />
        ) : (
          <div className={styles.imagePlaceholder} />
        )}
      </div>
      <div className={styles.info}>
        <h3 className={styles.title}>{product.title}</h3>
        <span className={styles.price}>{formatPrice(product.price)}</span>
        {product.creatorName && (
          <span className={styles.creator}>
            {product.creatorId ? (
              <Link
                to="/creators/$creatorId"
                params={{ creatorId: product.creatorId }}
                className={styles.creatorLink}
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
              >
                {product.creatorName}
              </Link>
            ) : (
              product.creatorName
            )}
          </span>
        )}
      </div>
    </Link>
  );
}
