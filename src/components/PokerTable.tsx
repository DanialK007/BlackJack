import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePoker } from "@/hooks/usePoker";
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

export function PokerTable() {
  const game = usePoker();
  const { state } = game;
  const { balance, gameState, playerHand, dealerHand, community, message, currentBet, potSize } = state;
  const isMobile = useIsMobile();

  const [betAmount, setBetAmount] = useState(25);
  const [showDealerHand, setShowDealerHand] = useState(false);

  const isBroke = balance <= 0 && gameState === "gameOver";
  const showResult = gameState === "gameOver" && !!message;

  const handlePlaceBet = useCallback(() => {
    if (betAmount <= 0 || betAmount > balance) return;
    game.placeBet(betAmount);
  }, [betAmount, balance, game]);

  const handleDeal = useCallback(() => {
    if (currentBet === 0) return;
    setShowDealerHand(false);
    game.deal();
  }, [currentBet, game]);

  const handleNextStreet = useCallback(() => {
    game.nextStreet();
  }, [game]);

  const handleShowdown = useCallback(() => {
    setShowDealerHand(true);
    game.showdown();
  }, [game]);

  const handleNewRound = useCallback(() => {
    setBetAmount(25);
    setShowDealerHand(false);
    game.newRound();
  }, [game]);

  const handleRestart = useCallback(() => {
    setBetAmount(25);
    setShowDealerHand(false);
    game.restart();
  }, [game]);

  const canBet = gameState === "preFlop" && playerHand.length === 0 && currentBet === 0;
  const canDeal = currentBet > 0 && playerHand.length === 0;
  const canPlayStreet = gameState !== "preFlop" && gameState !== "gameOver" && playerHand.length > 0;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(148,48%,22%),hsl(150,42%,11%)_62%)]">
      {/* Header */}
      <FadeIn duration={0.35} delay={0.04} fade>
        <div className="grid grid-cols-3 z-10 px-4 py-4 sm:px-8">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "1rem" : "1.25rem", color: "hsl(43,74%,65%)", letterSpacing: "0.1em" }}>
            TEXAS HOLD&apos;EM
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

      <div className="flex flex-1 flex-col gap-6 px-4 py-6 overflow-auto">
        {/* Pot Display */}
        {potSize > 0 && (
          <FadeIn duration={0.3} fade>
            <div style={{ textAlign: "center", background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8 }}>
              <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                Pot
              </div>
              <div style={{ color: "hsl(43,74%,65%)", fontSize: isMobile ? "1.5rem" : "2rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>
                ${potSize}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Community Cards */}
        {community.length > 0 && (
          <FadeIn duration={0.3} fade>
            <div className="flex flex-col items-center gap-2">
              <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Community
              </div>
              <div className="flex gap-2 items-center justify-center flex-wrap">
                <AnimatePresence>
                  {community.map((card, i) => (
                    <motion.div
                      key={`${i}-${card.id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <CardDisplay card={card} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Dealer Hand */}
        {dealerHand.length > 0 && (
          <FadeIn duration={0.3} fade>
            <div className="flex flex-col items-center gap-2">
              <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Dealer
              </div>
              <div className="flex gap-2 items-center justify-center">
                <AnimatePresence>
                  {dealerHand.map((card, i) => (
                    <motion.div
                      key={`${i}-${card.id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <CardDisplay card={showDealerHand ? card : { id: "hidden", suit: "Spades", rank: "K" }} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Player Hand */}
        {playerHand.length > 0 && (
          <FadeIn duration={0.3} fade>
            <div className="flex flex-col items-center gap-2">
              <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Your Hand
              </div>
              <div className="flex gap-2 items-center justify-center">
                <AnimatePresence>
                  {playerHand.map((card, i) => (
                    <motion.div
                      key={`${i}-${card.id}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.2 }}
                    >
                      <CardDisplay card={card} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Message Display */}
        {message && (
          <FadeIn duration={0.3} fade>
            <div style={{ textAlign: "center", color: "hsl(43,74%,65%)", fontSize: isMobile ? "0.9rem" : "1rem" }}>
              {message}
            </div>
          </FadeIn>
        )}

        {/* Controls */}
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
            ) : canBet ? (
              <div className="space-y-4">
                <div>
                  <label style={{ color: "rgba(212,187,130,0.7)", fontSize: "0.8rem", display: "block", marginBottom: 6 }}>
                    Ante: ${betAmount}
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
                <button
                  onClick={handlePlaceBet}
                  style={{
                    background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                    color: "hsl(150,35%,10%)",
                    border: "1px solid hsl(43,74%,40%)",
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: "pointer",
                    padding: "10px 24px",
                    fontSize: isMobile ? "0.9rem" : "0.875rem",
                    width: "100%",
                  }}
                >
                  Ante ${betAmount}
                </button>
              </div>
            ) : canDeal ? (
              <button
                onClick={handleDeal}
                style={{
                  background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                  color: "hsl(150,35%,10%)",
                  border: "1px solid hsl(43,74%,40%)",
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "10px 24px",
                  fontSize: isMobile ? "0.9rem" : "0.875rem",
                  width: "100%",
                }}
              >
                DEAL
              </button>
            ) : gameState === "river" ? (
              <button
                onClick={handleShowdown}
                style={{
                  background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                  color: "hsl(150,35%,10%)",
                  border: "1px solid hsl(43,74%,40%)",
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "10px 24px",
                  fontSize: isMobile ? "0.9rem" : "0.875rem",
                  width: "100%",
                }}
              >
                SHOWDOWN
              </button>
            ) : canPlayStreet ? (
              <button
                onClick={handleNextStreet}
                style={{
                  background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                  color: "hsl(150,35%,10%)",
                  border: "1px solid hsl(43,74%,40%)",
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: "pointer",
                  padding: "10px 24px",
                  fontSize: isMobile ? "0.9rem" : "0.875rem",
                  width: "100%",
                }}
              >
                NEXT STREET
              </button>
            ) : null}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
