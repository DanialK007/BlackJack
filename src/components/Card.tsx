import { motion, useAnimationControls } from "framer-motion";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Card as CardType } from "@/hooks/useBlackjack";
import { useDeckContext } from "@/contexts/DeckContext";

interface CardProps {
  card: CardType;
  index?: number;
  small?: boolean;
  isCollecting?: boolean;
  collectIndex?: number;
}

const SUIT_SYMBOLS: Record<string, string> = {
  Spades: "♠",
  Hearts: "♥",
  Diamonds: "♦",
  Clubs: "♣",
};

const RED_SUITS = ["Hearts", "Diamonds"];

function CardFace({ card, small }: { card: CardType; small?: boolean }) {
  const isRed = RED_SUITS.includes(card.suit);
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const color = isRed ? "#c62828" : "#1a1a1a";
  const w = small ? 52 : 72;
  const h = small ? 76 : 100;
  const fontSize = small ? "0.65rem" : "0.85rem";
  const suitSize = small ? "1.1rem" : "1.5rem";

  return (
    <div
      className="cardHover"
      style={{
        width: w,
        height: h,
        backgroundColor: "#fafaf8",
        borderRadius: 8,
        border: "1.5px solid #d4d4d0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: small ? "3px 4px" : "4px 6px",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1.1,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {card.rank}
        </span>
        <span style={{ fontSize: small ? "0.6rem" : "0.75rem", color }}>
          {suitSymbol}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flex: 1,
        }}
      >
        <span style={{ fontSize: suitSize, color, lineHeight: 1 }}>
          {suitSymbol}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          lineHeight: 1.1,
          transform: "rotate(180deg)",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 700,
            color,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {card.rank}
        </span>
        <span style={{ fontSize: small ? "0.6rem" : "0.75rem", color }}>
          {suitSymbol}
        </span>
      </div>
    </div>
  );
}

function CardBack({ small }: { small?: boolean }) {
  const w = small ? 52 : 72;
  const h = small ? 76 : 100;
  return (
    <div
      style={{
        width: w,
        height: h,
        background:
          "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)",
        borderRadius: 8,
        border: "2px solid rgba(255,255,255,0.15)",
        boxShadow:
          "0 4px 12px rgba(0,0,0,0.5), inset 0 0 0 4px rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: w - 14,
          height: h - 14,
          border: "1.5px solid rgba(255,255,255,0.2)",
          borderRadius: 6,
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 8px)`,
        }}
      />
    </div>
  );
}

export function PlayingCard({
  card,
  index = 0,
  small = false,
  isCollecting = false,
  collectIndex = 0,
}: CardProps) {
  const { deckRef } = useDeckContext();
  const cardRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();
  const prevHidden = useRef(card.isHidden);
  const [flipping, setFlipping] = useState(false);
  const [showFace, setShowFace] = useState(!card.isHidden);

  // Fly-from-deck animation on first mount
  useLayoutEffect(() => {
    let offsetX = 0;
    let offsetY = -40;

    if (cardRef.current && deckRef.current) {
      const cardRect = cardRef.current.getBoundingClientRect();
      const deckRect = deckRef.current.getBoundingClientRect();
      offsetX =
        deckRect.left +
        deckRect.width / 2 -
        (cardRect.left + cardRect.width / 2);
      offsetY =
        deckRect.top +
        deckRect.height / 2 -
        (cardRect.top + cardRect.height / 2);
    }

    // Snap to deck position (before paint)
    controls.set({
      x: offsetX,
      y: offsetY,
      opacity: 0,
      scale: 0.82,
      rotate: -10,
    });

    // Animate to natural position with stagger
    const timer = setTimeout(() => {
      controls.start({
        x: 0,
        y: 0,
        opacity: 1,
        scale: 1,
        rotate: 0,
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
      });
    }, index * 145);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flip reveal when hidden card is flipped face-up
  useEffect(() => {
    if (prevHidden.current && !card.isHidden) {
      setFlipping(true);
      setTimeout(() => {
        setShowFace(true);
        setFlipping(false);
      }, 200);
    }
    prevHidden.current = card.isHidden;
  }, [card.isHidden]);

  useEffect(() => {
    if (!isCollecting || !cardRef.current || !deckRef.current) return;

    const cardRect = cardRef.current.getBoundingClientRect();
    const deckRect = deckRef.current.getBoundingClientRect();
    const targetX =
      deckRect.left +
      deckRect.width / 2 -
      (cardRect.left + cardRect.width / 2);
    const targetY =
      deckRect.top +
      deckRect.height / 2 -
      (cardRect.top + cardRect.height / 2);

    controls.start({
      x: targetX,
      y: targetY,
      opacity: [1, 1, 0],
      scale: [1, 0.92, 0.78],
      rotate: card.isHidden ? -6 : 10,
      transition: {
        delay: collectIndex * 0.085,
        duration: 0.5,
        ease: [0.55, 0, 0.35, 1],
        opacity: {
          times: [0, 0.82, 1],
          duration: 0.5,
        },
        scale: {
          times: [0, 0.7, 1],
          duration: 0.5,
        },
      },
    });
  }, [card.isHidden, collectIndex, controls, deckRef, isCollecting]);

  const w = small ? 52 : 72;
  const h = small ? 76 : 100;

  return (
    <motion.div
      ref={cardRef}
      animate={controls}
      data-testid={
        card.isHidden ? "card-hidden" : `card-${card.rank}-${card.suit}`
      }
      style={{
        perspective: 600,
        width: w,
        height: h,
        flexShrink: 0,
        position: "relative",
      }}
    >
      <motion.div
        animate={{ rotateY: flipping ? 90 : 0 }}
        transition={{ duration: 0.2, ease: "easeIn" }}
        style={{ transformStyle: "preserve-3d", width: w, height: h }}
      >
        {showFace ? (
          <CardFace card={card} small={small} />
        ) : (
          <CardBack small={small} />
        )}
      </motion.div>
    </motion.div>
  );
}
