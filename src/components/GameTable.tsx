import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBlackjack } from "@/hooks/useBlackjack";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Hand } from "@/components/Hand";
import { BettingControls } from "@/components/BettingControls";
import { ActionButtons } from "@/components/ActionButtons";
import { BetStack } from "@/components/BetStack";
import { MenuPanel } from "@/components/MenuPanel";
import { DeckPile } from "@/components/DeckPile";
import { DeckProvider } from "@/contexts/DeckContext";
import { FadeIn } from "@/components/FadeIn";

type TablePhase = "idle" | "collecting" | "shuffling";

const RESULT_STYLES: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  "Blackjack! You win!": {
    color: "hsl(43,85%,65%)",
    bg: "rgba(184,134,11,0.18)",
    border: "rgba(184,134,11,0.4)",
  },
  "You Win!": {
    color: "hsl(140,60%,62%)",
    bg: "rgba(43,125,43,0.18)",
    border: "rgba(43,125,43,0.4)",
  },
  "Bust!": {
    color: "hsl(0,72%,65%)",
    bg: "rgba(198,40,40,0.18)",
    border: "rgba(198,40,40,0.4)",
  },
  "You Lose": {
    color: "hsl(0,72%,65%)",
    bg: "rgba(198,40,40,0.18)",
    border: "rgba(198,40,40,0.4)",
  },
  Push: {
    color: "hsl(43,20%,72%)",
    bg: "rgba(100,100,100,0.18)",
    border: "rgba(150,150,150,0.3)",
  },
  "Dealer Blackjack!": {
    color: "hsl(0,72%,65%)",
    bg: "rgba(198,40,40,0.18)",
    border: "rgba(198,40,40,0.4)",
  },
  "Dealer Blackjack! Insurance pays.": {
    color: "hsl(43,85%,65%)",
    bg: "rgba(184,134,11,0.18)",
    border: "rgba(184,134,11,0.4)",
  },
  "Round Over": {
    color: "hsl(43,20%,72%)",
    bg: "rgba(100,100,100,0.18)",
    border: "rgba(150,150,150,0.3)",
  },
};

function getResultStyle(msg: string) {
  return (
    RESULT_STYLES[msg] || {
      color: "hsl(43,74%,65%)",
      bg: "rgba(184,134,11,0.15)",
      border: "rgba(184,134,11,0.3)",
    }
  );
}

function GameTableInner() {
  const game = useBlackjack();
  const { state } = game;
  const {
    balance,
    gameState,
    dealerHand,
    playerHands,
    currentHandIndex,
    message,
    currentBet,
  } = state;
  const isMobile = useIsMobile();

  const [tablePhase, setTablePhase] = useState<TablePhase>("idle");
  const [showCards, setShowCards] = useState(true);
  const [musicMuted, setMusicMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    if (musicMuted) {
      audioRef.current.pause();
    } else {
      audioRef.current.volume = 0.3; // Set volume to 30%
      audioRef.current.play().catch((error) => {
        console.log("[v0] Music autoplay blocked by browser:", error.message);
      });
    }
  }, [musicMuted]);

  // Enable music on first user interaction
  useEffect(() => {
    const playMusic = () => {
      if (audioRef.current && !musicMuted) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(() => {
          // Silent catch
        });
      }
    };

    document.addEventListener("click", playMusic);
    document.addEventListener("keydown", playMusic);

    return () => {
      document.removeEventListener("click", playMusic);
      document.removeEventListener("keydown", playMusic);
    };
  }, [musicMuted]);

  const isBroke = balance <= 0 && gameState === "gameOver";
  const showResult =
    gameState === "gameOver" && !!message && tablePhase === "idle";
  const isDealerDrawing = gameState === "dealerDrawing" || gameState === "dealerResolving";
  const { playerReady, dealerReady } = state;
  const isAnimating = tablePhase !== "idle";
  const isCollecting = tablePhase === "collecting";
  const tableCardCount =
    dealerHand.length +
    playerHands.reduce((sum, hand) => sum + hand.cards.length, 0);

  const activeBet =
    gameState !== "betting"
      ? playerHands.reduce((sum, h) => sum + h.bet, 0)
      : currentBet;

  const triggerCollectThen = useCallback(
    (action: () => void) => {
      const collectDuration = Math.max(650, tableCardCount * 85 + 560);
      setTablePhase("collecting");
      setTimeout(() => {
        setShowCards(false);
        setTablePhase("shuffling");
        setTimeout(() => {
          action();
          setTablePhase("idle");
          setShowCards(true);
        }, 800);
      }, collectDuration);
    },
    [tableCardCount],
  );

  const handleNewRound = useCallback(() => {
    triggerCollectThen(() => game.dispatch({ type: "NEW_ROUND" }));
  }, [triggerCollectThen, game]);

  const handleRestart = useCallback(() => {
    triggerCollectThen(() => game.dispatch({ type: "RESTART" }));
  }, [triggerCollectThen, game]);

  return (
    <div
      className="felt-table w-full h-screen flex flex-col relative overflow-hidden"
      data-testid="game-table"
    >
      {/* Table oval ring — hidden on mobile to save vertical space */}
      {!isMobile && (
        <FadeIn duration={0.35} delay={0.04} fade>
        <div
          className="absolute pointer-events-none"
          style={{
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "75%",
            height: "82%",
            borderRadius: "50%",
            border: "2px solid rgba(212,187,130,0.18)",
          }}
        />
        </FadeIn>
      )}

      {/* Deck shoe */}
      <FadeIn duration={0.35} delay={0.08} fade>
        <DeckPile
          isShuffling={tablePhase === "shuffling"}
          isCollecting={tablePhase === "collecting"}
        />
      </FadeIn>

      {/* ── Header ─────────────────────────────── */}
      <FadeIn
        duration={0.35}
        delay={0.14}
        fade
        popup
        className="grid grid-cols-3 z-10"
        style={{ padding: isMobile ? "10px 12px 6px" : "16px 24px 8px" }}
      >
        <div className="flex items-center">
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "1rem" : "1.25rem",
              color: "hsl(43,74%,65%)",
              letterSpacing: "0.1em",
            }}
          >
            BLACKJACK
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div
            className="flex items-center gap-2 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(184,134,11,0.3)",
              padding: isMobile ? "5px 12px" : "8px 16px",
            }}
            data-testid="balance-display"
          >
            <span
              className="uppercase tracking-widest"
              style={{
                color: "rgba(212,187,130,0.55)",
                fontSize: isMobile ? "0.55rem" : "0.75rem",
              }}
            >
              Balance
            </span>
            <span
              style={{
                color: "hsl(43,74%,65%)",
                fontFamily: "'Playfair Display', serif",
                fontSize: isMobile ? "1rem" : "1.25rem",
                fontWeight: 700,
              }}
            >
              ${balance.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setMusicMuted(!musicMuted)}
            className="rounded-lg px-3 py-2 flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: `1px solid ${musicMuted ? "rgba(198,40,40,0.3)" : "rgba(212,187,130,0.25)"}`,
              color: musicMuted ? "hsl(0,72%,65%)" : "hsl(43,74%,65%)",
              cursor: "pointer",
            }}
            title={musicMuted ? "Unmute music" : "Mute music"}
          >
            <span style={{ fontSize: 16, lineHeight: 1 }}>
              {musicMuted ? "🔇" : "🎵"}
            </span>
          </button>
          <MenuPanel onNewGame={handleRestart} />
        </div>
      </FadeIn>

      {/* ── Dealer Zone ────────────────────────── */}
      <FadeIn
        duration={0.35}
        delay={0.2}
        fade
        popup
        className="flex flex-col items-center justify-center z-10 mb-auto mt-10"
        style={{ gap: isMobile ? 6 : 12, paddingTop: isMobile ? 4 : 8 }}
      >
        <AnimatePresence>
          {showCards && dealerHand.length > 0 && (
            <motion.div
              key="dealer-hand"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: isMobile ? 6 : 12,
              }}
            >
              <Hand
                cards={dealerHand}
                label="Dealer"
                isDealer
                isReady={dealerReady}
                small={isMobile}
                isCollecting={isCollecting}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {dealerHand.length === 0 && gameState === "betting" && !isAnimating && (
          <div
            style={{
              marginTop: isMobile ? 80 : 200,
              fontSize: isMobile ? "0.65rem" : "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(212,187,130,0.3)",
            }}
          >
            Place your bet to begin
          </div>
        )}

        {isDealerDrawing && (
          <div
            style={{
              marginTop: isMobile ? 4 : 8,
              fontSize: isMobile ? "0.65rem" : "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              color: "rgba(212,187,130,0.55)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "hsl(43,74%,65%)",
                display: "inline-block",
                animation: "pulse 1s ease-in-out infinite",
              }}
            />
            Dealer is drawing...
          </div>
        )}
      </FadeIn>

      {/* ── Bet stack (desktop only — mobile shows bet in controls) ── */}
        <FadeIn duration={0.35} delay={0.26} fade popup>
        <div
          className="absolute left-1/2 z-10"
          style={{ top: "45%", transform: "translate(-50%, -50%)" }}
        >
          {!isAnimating && <BetStack amount={activeBet} />}
        </div>
        </FadeIn>

      {/* ── Result overlay ─────────────────────── */}
      {showResult && (
        <div className="fixed z-29 inset-0 bg-black/50 lg:bg-transparent flex items-center justify-center">
          <AnimatePresence>
            {showResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.82, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.82, y: 8 }}
                transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col items-center mb-20 lg:mb-0 lg:translate-x-80"
                style={{
                  top: isMobile ? "42%" : "44%",
                  transform: "translate(-50%, -50%)",
                  gap: isMobile ? 10 : 16,
                  width: "max-content",
                }}
              >
                <div
                  className="rounded-2xl font-bold text-center bg-black/40"
                  style={{
                    ...getResultStyle(message),
                    // backdropFilter: "blur(10px)",
                    border: `1px solid ${getResultStyle(message).border}`,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
                    fontFamily: "'Playfair Display', serif",
                    letterSpacing: "0.04em",
                    fontSize: isMobile ? "1.35rem" : "1.5rem",
                    padding: isMobile ? "12px 28px" : "16px 40px",
                  }}
                  data-testid="result-message"
                >
                  {message}
                </div>

                {!isBroke && (
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.22 }}
                    style={{
                      background:
                        "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,40%) 100%)",
                      color: "hsl(150,35%,10%)",
                      border: "1px solid hsl(43,74%,40%)",
                      boxShadow: "0 4px 16px rgba(184,134,11,0.35)",
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      borderRadius: 12,
                      cursor: "pointer",
                      fontSize: isMobile ? "0.9rem" : "0.875rem",
                      padding: isMobile ? "12px 32px" : "10px 32px",
                    }}
                    onClick={handleNewRound}
                    data-testid="button-new-game-overlay"
                  >
                    New Round
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Shuffle label ──────────────────────── */}
      <AnimatePresence>
        {tablePhase === "shuffling" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 z-30"
            style={{
              top: "50%",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                color: "rgba(212,187,130,0.55)",
                fontSize: "0.8rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              Shuffling...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Background Music ──────────────────── */}
      <audio
        ref={audioRef}
        loop
        style={{ display: "none" }}
        onLoadedMetadata={() => {
          console.log("[v0] Music loaded successfully");
        }}
        onError={(e) => {
          console.log("[v0] Audio error:", e);
        }}
      >
        <source src="https://assets.mixkit.co/active_storage/sfx/2441/2441-preview.mp3" type="audio/mpeg" />
      </audio>

      {/* ── Player Zone ────────────────────────── */}
      <FadeIn
        duration={0.35}
        delay={0.32}
        fade
        popup
        className={`flex flex-col items-center ${isBroke ? "z-30" : "z-10"}`}
        style={{ gap: isMobile ? 8 : 12, paddingBottom: isMobile ? 36 : 12 }}
      >
        <AnimatePresence>
          {showCards && playerHands.length > 0 && (
            <motion.div
              key="player-hands"
              style={{
                display: "flex",
                gap: isMobile ? 12 : 24,
                justifyContent: "center",
                flexWrap: "wrap",
                paddingBottom: isMobile ? 12 : 24,
              }}
            >
              {playerHands.map((hand, i) => {
                const previousPlayerCards = playerHands
                  .slice(0, i)
                  .reduce(
                    (sum, previousHand) => sum + previousHand.cards.length,
                    0,
                  );

                return (
                  <Hand
                    key={hand.id}
                    cards={hand.cards}
                    label={playerHands.length > 1 ? `Hand ${i + 1}` : "You"}
                    bet={hand.bet}
                    status={hand.status}
                    isActive={
                      i === currentHandIndex &&
                      !hand.isFinished &&
                      gameState === "playing"
                    }
                    isReady={playerReady}
                    isFinished={hand.isFinished}
                    small={isMobile}
                    isCollecting={isCollecting}
                    collectBaseIndex={dealerHand.length + previousPlayerCards}
                  />
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {playerHands.length === 0 &&
          gameState === "betting" &&
          !isAnimating && <div style={{ height: isMobile ? 8 : 16 }} />}

        {/* Controls panel */}
        <div className="min-h-28 flex items-end justify-center pb-5">
          <FadeIn duration={0.35} delay={0.38} fade popup>
          <div
            className="z-10 rounded-2xl"
            style={{
              background: "rgba(0,0,0,0.42)",
              border: "1px solid rgba(212,187,130,0.14)",
              backdropFilter: "blur(6px)",
              padding: isMobile ? "10px 12px" : "16px 24px",
              // width: isMobile ? "calc(100% - 24px)" : "auto",
              maxWidth: isMobile ? 420 : "none",
              pointerEvents: isAnimating ? "none" : "auto",
              opacity: isAnimating ? 0.4 : 1,
              transition: "opacity 0.2s",
            }}
          >
            {isBroke ? (
              <div className="flex flex-col items-center gap-3">
                <p
                  style={{
                    color: "hsl(0,72%,65%)",
                    fontSize: isMobile ? "0.8rem" : "0.875rem",
                  }}
                >
                  You are out of chips!
                </p>
                <button
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                    color: "hsl(150,35%,10%)",
                    border: "1px solid hsl(43,74%,40%)",
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: isMobile ? "10px 24px" : "8px 24px",
                    fontSize: isMobile ? "0.9rem" : "0.875rem",
                  }}
                  onClick={handleRestart}
                  data-testid="button-restart"
                >
                  Start Fresh ($1,000)
                </button>
              </div>
            ) : gameState === "betting" || gameState === "gameOver" ? (
              <BettingControls game={game} />
            ) : (
              <ActionButtons game={game} />
            )}
          </div>
          </FadeIn>
        </div>
      </FadeIn>
    </div>
  );
}

export function GameTable() {
  return (
    <DeckProvider>
      <GameTableInner />
    </DeckProvider>
  );
}
