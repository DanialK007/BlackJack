import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBaccarat } from "@/hooks/useBaccarat";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MenuPanel } from "@/components/MenuPanel";
import { FadeIn } from "@/components/FadeIn";

function CardDisplay({ card }: { card: any }) {
  const suits: Record<string, string> = {
    Spades: "♠",
    Hearts: "♥",
    Diamonds: "♦",
    Clubs: "♣",
  };
  const isRed = card.suit === "Hearts" || card.suit === "Diamonds";
  return (
    <div
      style={{
        width: 60,
        height: 90,
        background: "white",
        border: `2px solid ${isRed ? "red" : "black"}`,
        borderRadius: 4,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 4,
        fontSize: 12,
        fontWeight: "bold",
        color: isRed ? "red" : "black",
        textAlign: "center",
      }}
    >
      <span>{card.rank}</span>
      <span style={{ fontSize: 20 }}>{suits[card.suit]}</span>
      <span>{card.rank}</span>
    </div>
  );
}

export function BaccaratTable() {
  const game = useBaccarat();
  const { state } = game;
  const { balance, gameState, playerHand, bankerHand, message, currentBet, betType } = state;
  const isMobile = useIsMobile();

  const [betAmount, setBetAmount] = useState(50);
  const [isDealing, setIsDealing] = useState(false);
  const [waitingForThirdCard, setWaitingForThirdCard] = useState(false);

  const isBroke = balance <= 0 && gameState === "gameOver";
  const showResult = gameState === "gameOver" && !!message;

  const handlePlaceBet = useCallback(
    (type: "player" | "banker" | "tie") => {
      if (betAmount <= 0 || betAmount > balance) return;
      game.placeBet(betAmount, type);
    },
    [betAmount, balance, game]
  );

  const handleDeal = useCallback(async () => {
    if (!betType || isDealing) return;
    setIsDealing(true);
    game.deal();

    // Simulate dealing animation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setWaitingForThirdCard(true);
    game.drawThirdCard();

    await new Promise((resolve) => setTimeout(resolve, 1500));

    game.resolve();
    setIsDealing(false);
    setWaitingForThirdCard(false);
  }, [betType, isDealing, game]);

  const handleNewRound = useCallback(() => {
    setBetAmount(50);
    game.newRound();
  }, [game]);

  const handleRestart = useCallback(() => {
    setBetAmount(50);
    game.restart();
  }, [game]);

  const canDeal = betType !== null && gameState === "betting" && !isDealing;
  const playerScore = state.playerTotal;
  const bankerScore = state.bankerTotal;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(148,48%,22%),hsl(150,42%,11%)_62%)]">
      {/* Header */}
      <FadeIn duration={0.35} delay={0.04} fade>
        <div className="grid grid-cols-3 z-10 px-4 py-4 sm:px-8">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "1rem" : "1.25rem", color: "hsl(43,74%,65%)", letterSpacing: "0.1em" }}>
            BACCARAT
          </div>
          <div className="flex items-center justify-center">
            <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(184,134,11,0.3)", padding: isMobile ? "5px 12px" : "8px 16px", borderRadius: 12 }}>
              <span style={{ color: "rgba(212,187,130,0.55)", fontSize: isMobile ? "0.55rem" : "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Balance
              </span>
              <span style={{ color: "hsl(43,74%,65%)", fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "1rem" : "1.25rem", fontWeight: 700, marginLeft: 8 }}>
                ${balance.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-end">
            <MenuPanel onNewGame={handleRestart} />
          </div>
        </div>
      </FadeIn>

      <div className="flex flex-1 flex-col gap-8 px-4 py-6">
        {/* Banker Zone */}
        <FadeIn duration={0.35} delay={0.1} fade>
          <div className="flex flex-col items-center gap-3">
            <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Banker
            </div>
            <div className="flex gap-4 items-end justify-center min-h-32">
              <AnimatePresence>
                {bankerHand.map((card, i) => (
                  <motion.div
                    key={`${i}-${card.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.3, duration: 0.4 }}
                  >
                    <CardDisplay card={card} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {bankerHand.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: "hsl(43,74%,65%)", fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}
              >
                {bankerScore}
              </motion.div>
            )}
          </div>
        </FadeIn>

        {/* Player Zone */}
        <FadeIn duration={0.35} delay={0.16} fade>
          <div className="flex flex-col items-center gap-3">
            <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              Player
            </div>
            <div className="flex gap-4 items-end justify-center min-h-32">
              <AnimatePresence>
                {playerHand.map((card, i) => (
                  <motion.div
                    key={`${i}-${card.id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: i * 0.3, duration: 0.4 }}
                  >
                    <CardDisplay card={card} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            {playerHand.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ color: "hsl(43,74%,65%)", fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}
              >
                {playerScore}
              </motion.div>
            )}
          </div>
        </FadeIn>

        {/* Betting Controls */}
        <FadeIn duration={0.35} delay={0.22} fade>
          <div style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(212,187,130,0.14)", borderRadius: 16, padding: isMobile ? "12px 16px" : "16px 24px", maxWidth: 500, width: "100%", margin: "auto" }}>
            {isBroke ? (
              <div className="flex flex-col items-center gap-3">
                <p style={{ color: "hsl(0,72%,65%)", fontSize: isMobile ? "0.8rem" : "0.875rem" }}>
                  You are out of chips!
                </p>
                <button
                  onClick={handleRestart}
                  style={{
                    background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                    color: "hsl(150,35%,10%)",
                    border: "1px solid hsl(43,74%,40%)",
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: isMobile ? "10px 24px" : "8px 24px",
                    fontSize: isMobile ? "0.9rem" : "0.875rem",
                  }}
                >
                  Start Fresh ($1,000)
                </button>
              </div>
            ) : showResult ? (
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    fontSize: isMobile ? "1.25rem" : "1.5rem",
                    fontWeight: 700,
                    color: message.includes("win") ? "hsl(140,60%,62%)" : "hsl(0,72%,65%)",
                    fontFamily: "'Playfair Display', serif",
                    textAlign: "center",
                  }}
                >
                  {message}
                </motion.div>
                <button
                  onClick={handleNewRound}
                  style={{
                    background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                    color: "hsl(150,35%,10%)",
                    border: "1px solid hsl(43,74%,40%)",
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: isMobile ? "10px 24px" : "8px 24px",
                    fontSize: isMobile ? "0.9rem" : "0.875rem",
                    width: "100%",
                  }}
                >
                  New Round
                </button>
              </div>
            ) : gameState === "betting" && !betType ? (
              <div className="space-y-4">
                <div>
                  <label style={{ color: "rgba(212,187,130,0.7)", fontSize: "0.8rem", display: "block", marginBottom: 6 }}>
                    Bet Amount: ${betAmount}
                  </label>
                  <input
                    type="range"
                    min="10"
                    max={Math.min(500, balance)}
                    step="10"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handlePlaceBet("player")}
                    style={{
                      background: "linear-gradient(135deg, hsl(140,60%,50%) 0%, hsl(140,60%,40%) 100%)",
                      color: "white",
                      border: "1px solid hsl(140,60%,35%)",
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: isMobile ? "0.75rem" : "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    Player
                  </button>
                  <button
                    onClick={() => handlePlaceBet("tie")}
                    style={{
                      background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                      color: "hsl(150,35%,10%)",
                      border: "1px solid hsl(43,74%,40%)",
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: isMobile ? "0.75rem" : "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    Tie
                  </button>
                  <button
                    onClick={() => handlePlaceBet("banker")}
                    style={{
                      background: "linear-gradient(135deg, hsl(0,72%,50%) 0%, hsl(0,72%,40%) 100%)",
                      color: "white",
                      border: "1px solid hsl(0,72%,35%)",
                      padding: "10px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: isMobile ? "0.75rem" : "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    Banker
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div style={{ textAlign: "center" }}>
                  <p style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.85rem", marginBottom: 4 }}>
                    Bet on:
                  </p>
                  <p style={{ color: "hsl(43,74%,65%)", fontSize: "1.1rem", fontWeight: 700 }}>
                    {betType?.toUpperCase()} - ${currentBet}
                  </p>
                </div>
                <button
                  onClick={handleDeal}
                  disabled={!canDeal || isDealing}
                  style={{
                    background: canDeal ? "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)" : "rgba(100,100,100,0.3)",
                    color: canDeal ? "hsl(150,35%,10%)" : "rgba(212,187,130,0.4)",
                    border: "1px solid hsl(43,74%,40%)",
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: canDeal ? "pointer" : "not-allowed",
                    padding: "10px 24px",
                    fontSize: isMobile ? "0.9rem" : "0.875rem",
                    width: "100%",
                  }}
                >
                  {isDealing ? "Dealing..." : "DEAL"}
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
