import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface MenuPanelProps {
  onNewGame: () => void;
}

const RULES = [
  "Blackjack pays 3 to 2",
  "Dealer hits on soft 16, stands on soft 17",
  "Double Down on first two cards only",
  "Split identical-rank cards (once)",
  "Insurance available when dealer shows Ace",
  "6-deck shoe, reshuffled at 25% remaining",
];

export function MenuPanel({ onNewGame }: MenuPanelProps) {
  const [open, setOpen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  function openMenu() {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen(true);
    setShowRules(false);
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const btn = buttonRef.current;
      const panel = document.getElementById("bj-menu-dropdown");
      if (btn && btn.contains(target)) return;
      if (panel && panel.contains(target)) return;
      setOpen(false);
      setShowRules(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const dropdown = (
    <AnimatePresence>
      {open && (
        <motion.div
          id="bj-menu-dropdown"
          initial={{ opacity: 0, scale: 0.92, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: -8 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "fixed",
            top: dropdownPos.top,
            right: dropdownPos.right,
            minWidth: 220,
            background: "linear-gradient(160deg, hsl(150,35%,14%) 0%, hsl(150,30%,10%) 100%)",
            border: "1px solid rgba(212,187,130,0.25)",
            borderRadius: 12,
            boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
            overflow: "hidden",
            zIndex: 9999,
          }}
          data-testid="menu-panel"
        >
          {!showRules ? (
            <>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                  color: "rgba(212,187,130,0.45)",
                  borderBottom: "1px solid rgba(212,187,130,0.1)",
                }}
              >
                Blackjack
              </div>

              <MenuBtn
                label="New Game  ($1,000)"
                icon="♻"
                onClick={() => {
                  onNewGame();
                  setOpen(false);
                }}
                testId="menu-new-game"
              />
              <MenuBtn
                label="How to Play"
                icon="?"
                onClick={() => setShowRules(true)}
                testId="menu-rules"
              />
              <div style={{ borderTop: "1px solid rgba(212,187,130,0.1)" }}>
                <MenuBtn
                  label="Close"
                  icon="✕"
                  onClick={() => setOpen(false)}
                  testId="menu-close"
                  danger
                />
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "8px 16px",
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 600,
                  color: "rgba(212,187,130,0.45)",
                  borderBottom: "1px solid rgba(212,187,130,0.1)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => setShowRules(false)}
                  style={{
                    color: "hsl(43,74%,55%)",
                    fontSize: 14,
                    lineHeight: 1,
                    cursor: "pointer",
                    background: "none",
                    border: "none",
                    padding: 0,
                  }}
                  data-testid="menu-back"
                >
                  ←
                </button>
                Rules
              </div>
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {RULES.map((rule, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: "hsl(43,74%,55%)", fontSize: 10, marginTop: 3, flexShrink: 0 }}>◆</span>
                    <span style={{ fontSize: "0.75rem", color: "rgba(212,187,130,0.85)", lineHeight: 1.6 }}>
                      {rule}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        ref={buttonRef}
        className="rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
        style={{
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(212,187,130,0.25)",
          color: "hsl(43,74%,65%)",
          cursor: "pointer",
        }}
        onClick={openMenu}
        data-testid="button-menu"
      >
        <span style={{ fontSize: 16, lineHeight: 1 }}>☰</span>
        Menu
      </button>

      {createPortal(dropdown, document.body)}
    </>
  );
}

function MenuBtn({
  label,
  icon,
  onClick,
  testId,
  danger,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  testId: string;
  danger?: boolean;
}) {
  return (
    <button
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        fontSize: "0.875rem",
        fontWeight: 500,
        textAlign: "left",
        color: danger ? "hsl(0,65%,65%)" : "rgba(212,187,130,0.9)",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = "transparent";
      }}
      onClick={onClick}
      data-testid={testId}
    >
      <span style={{ width: 20, textAlign: "center", fontSize: 13, opacity: 0.75 }}>{icon}</span>
      {label}
    </button>
  );
}
