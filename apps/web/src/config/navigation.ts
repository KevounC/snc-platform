// ── Public Types ──

export interface NavLink {
  readonly to: string;
  readonly label: string;
}

// ── Public API ──

export const NAV_LINKS: readonly NavLink[] = [
  { to: "/feed", label: "Feed" },
  { to: "/creators", label: "Creators" },
  { to: "/services", label: "Services" },
  { to: "/merch", label: "Merch" },
  { to: "/pricing", label: "Pricing" },
  { to: "/emissions", label: "Emissions" },
] as const;
