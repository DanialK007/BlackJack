import { motion, AnimatePresence } from "framer-motion";
import type { CSSProperties } from "react";
import { useEffect } from "react";
import { useDeckContext } from "@/contexts/DeckContext";
import { useIsMobile } from "@/hooks/useIsMobile";
import { playSound } from "@/lib/sounds";

interface DeckPileProps {
  isShuffling: boolean;
  isCollecting: boolean;
}

function makeBackStyle(w: number, h: number): CSSProperties {
  return {
    position: "absolute",
    top: 0,
    left: 0,
    width: w,
    height: h,
    background: "linear-gradient(135deg, #1a237e 0%, #283593 50%, #1a237e 100%)",
    borderRadius: 6,
    border: "1.5px solid rgba(255,255,255,0.18)",
    boxShadow: "0 3px 8px rgba(0,0,0,0.55)",
  };
}

function makeInnerStyle(w: number, h: number): CSSProperties {
  const inset = w < 56 ? 5 : 7;
  return {
    position: "absolute",
    top: inset, left: inset, right: inset, bottom: inset,
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: 4,
    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.04) 8px)`,
  };
}

const SHUFFLE_ANGLES = [-16, -8, 0, 8, 16];

export function DeckPile({ isShuffling, isCollecting }: DeckPileProps) {
  const { deckRef } = useDeckContext();
  const isMobile = useIsMobile();

  const W = isMobile ? 48 : 70;
  const H = isMobile ? 68 : 98;
  const STACK = isMobile ? 6 : 12;
  const OFFSET = isMobile ? 1.8 : 2.2;
  const containerH = isMobile ? 82 : 128;

  const backStyle = makeBackStyle(W, H);
  const innerStyle = makeInnerStyle(W, H);

  useEffect(() => {
    if (isShuffling) {
      playSound("/sounds/shuffle.mp3", 1);
    }
  }, [isShuffling]);

  function CardBack({ idx }: { idx: number }) {
    return (
      <div style={{ ...backStyle, top: idx * OFFSET, zIndex: STACK - idx }}>
        <div style={innerStyle} />
      </div>
    );
  }

  function DeckShadow() {
    return (
      <div
        style={{
          position: "absolute",
          bottom: -3,
          left: 1,
          width: W - 2,
          height: 8,
          background: "rgba(0,0,0,0.3)",
          borderRadius: "50%",
          filter: "blur(4px)",
        }}
      />
    );
  }

  return (
    <div
    className="-translate-y-10 lg:translate-y-0"
      style={{
        position: "absolute",
        left: isMobile ? "5%" : "4.5%",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: isMobile ? "0.5rem" : "0.6rem",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(212,187,130,0.4)",
          marginBottom: isMobile ? 5 : 8,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Shoe
      </div>

      {/* Card stack */}
      <div ref={deckRef} style={{ position: "relative", width: W, height: containerH }}>
        <AnimatePresence mode="wait">
          {isShuffling ? (
            <motion.div
              key="shuffle"
              style={{ position: "absolute", inset: 0 }}
            >
              <DeckShadow />
              {Array.from({ length: STACK }).map((_, i) => {
                const idx = STACK - 1 - i;
                const angle = SHUFFLE_ANGLES[i % SHUFFLE_ANGLES.length];

                return (
                <motion.div
                  key={i}
                  style={{
                    ...backStyle,
                    top: idx * OFFSET,
                    transformOrigin: "50% 95%",
                    zIndex: STACK - idx,
                  }}
                  initial={{ rotate: 0, x: 0, y: 0 }}
                  animate={{
                    rotate: [0, angle, 0, angle * 0.55, 0],
                    x: [0, angle * 1.15, 0, angle * 0.55, 0],
                    y: [
                      0,
                      -Math.abs(angle) * 0.5,
                      0,
                      -Math.abs(angle) * 0.25,
                      0,
                    ],
                  }}
                  transition={{
                    duration: 0.65,
                    ease: "easeInOut",
                    times: [0, 0.3, 0.55, 0.78, 1],
                    delay: i * 0.018,
                    repeat: 1,
                    repeatDelay: 0.05,
                  }}
                >
                  <div style={innerStyle} />
                </motion.div>
                );
              })}
            </motion.div>
          ) : isCollecting ? (
            <motion.div
              key="collecting"
              style={{ position: "absolute", inset: 0 }}
              animate={{ scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }}
              transition={{ duration: 0.5, repeat: 1 }}
            >
              {Array.from({ length: STACK }).map((_, i) => (
                <CardBack key={i} idx={STACK - 1 - i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="static"
              style={{ position: "absolute", inset: 0 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <DeckShadow />
              {Array.from({ length: STACK }).map((_, i) => (
                <CardBack key={i} idx={STACK - 1 - i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isMobile && (
        <div
          style={{
            marginTop: 8,
            fontSize: "0.55rem",
            color: "rgba(212,187,130,0.28)",
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.05em",
          }}
        >
          6 Decks
        </div>
      )}
    </div>
  );
}
