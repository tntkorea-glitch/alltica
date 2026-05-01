"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Props {
  href: string;
  label: string;
  disabled?: boolean;
  disabledLabel?: string;
}

export default function StickyApplyCTA({ href, label, disabled, disabledLabel }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-safe-bottom pb-5 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
      <div className="max-w-lg mx-auto pointer-events-auto">
        {disabled ? (
          <div className="w-full bg-gray-200 text-gray-500 py-4 rounded-2xl font-bold text-base text-center cursor-not-allowed">
            {disabledLabel}
          </div>
        ) : (
          <Link
            href={href}
            className="block w-full text-center bg-brand text-white py-4 rounded-2xl font-extrabold text-base hover:bg-brand-hover transition-colors shadow-2xl shadow-brand/40"
          >
            {label}
          </Link>
        )}
      </div>
    </div>
  );
}
