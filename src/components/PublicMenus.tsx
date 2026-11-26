"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { publicNavigation } from "@/lib/public-paths";

function closeGroups(root: HTMLElement) {
  root.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(group => { group.open = false; });
}

function useMenuDismiss() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    if (!host) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !host.contains(event.target)) closeGroups(host);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, []);
  return root;
}

function escapeMenu(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== "Escape" || !(event.target instanceof Element)) return;
  const group = event.target.closest<HTMLDetailsElement>("details[open]");
  if (!group) return;
  event.preventDefault();
  group.open = false;
  group.querySelector<HTMLElement>("summary")?.focus();
}

function Groups({ name, close }: { name: string; close: () => void }) {
  return publicNavigation.map(group => <details className="public-nav-group" name={name} key={group.label}>
    <summary>{group.label}</summary>
    <div className="public-subnav">
      <ul>
        {group.links.map(([label, href]) => <li key={href}><Link href={href} onNavigate={close}>{label}</Link></li>)}
      </ul>
    </div>
  </details>);
}

export function PublicDesktopNavigation() {
  const ref = useMenuDismiss();
  return <div ref={ref} className="public-desktop-menu" onKeyDown={escapeMenu} onBlur={event => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeGroups(event.currentTarget);
  }}>
    <nav className="public-main-nav" aria-label="Primary navigation">
      <Groups name="wpu-desktop" close={() => { if (ref.current) closeGroups(ref.current); }} />
    </nav>
  </div>;
}

export function PublicMobileNavigation() {
  const ref = useMenuDismiss();
  return <div ref={ref} className="public-mobile-shell" onKeyDown={escapeMenu}>
    <details className="public-mobile-menu" onToggle={event => {
      if (!event.currentTarget.open) closeGroups(event.currentTarget);
    }}>
      <summary>Menu</summary>
      <nav aria-label="Mobile navigation">
        <Groups name="wpu-mobile" close={() => { if (ref.current) closeGroups(ref.current); }} />
      </nav>
    </details>
  </div>;
}
