import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoulette } from "@/hooks/useRoulette";
import { useIsMobile } from "@/hooks/useIsMobile";
import { MenuPanel } from "@/components/MenuPanel";
import { FadeIn } from "@/components/FadeIn";
import { RotateCw } from "lucide-react";

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

export function RouletteTable() {
  const game = useRoulette();
  const { state } = game;
  const { balance, gameState, resultNumber, message, currentBet } = state;
  const isMobile = useIsMobile();

  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedBetTab, setSelectedBetTab] = useState<"simple" | "numbers">("simple");
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState(10);

  const isBroke = balance <= 0 && gameState === "gameOver";

  const handlePlaceBet = useCallback(
    (type: string, value: number | string) => {
      if (betAmount <= 0 || betAmount > balance) return;
      game.placeBet(type as any, value, betAmount);
    },
    [betAmount, balance, game]
  );

  const handleSpin = useCallback(() => {
    if (gameState !== "betting" || currentBet === 0 || isSpinning) return;

    setIsSpinning(true);
    game.spin();

    // Spin animation
    const randomRotation = Math.random() * 360 + 360 * 5;
    setWheelRotation(randomRotation);

    // After spin animation completes
    setTimeout(() => {
      const resultNumber = Math.floor(Math.random() * 37); // 0-36
      game.setResult(resultNumber);

      setTimeout(() => {
        game.resolve();
        setIsSpinning(false);
      }, 500);
    }, 4000);
  }, [gameState, currentBet, isSpinning, game]);

  const handleNewRound = useCallback(() => {
    setSelectedNumber(null);
    setBetAmount(10);
    setWheelRotation(0);
    game.newRound();
  }, [game]);

  const handleRestart = useCallback(() => {
    setSelectedNumber(null);
    setBetAmount(10);
    setWheelRotation(0);
    game.restart();
  }, [game]);

  const showResult = gameState === "gameOver" && !!message;
  const canPlaceBets = gameState === "betting" && !isSpinning;

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top,hsl(148,48%,22%),hsl(150,42%,11%)_62%)]">
      {/* Header */}
      <FadeIn duration={0.35} delay={0.04} fade>
        <div className="grid grid-cols-3 z-10 px-4 py-4 sm:px-8">
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "1rem" : "1.25rem", color: "hsl(43,74%,65%)", letterSpacing: "0.1em" }}>
            ROULETTE
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

      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-6">
        {/* Roulette Wheel */}
        <FadeIn duration={0.35} delay={0.1} fade>
          <motion.div
            style={{
              width: isMobile ? 200 : 280,
              height: isMobile ? 200 : 280,
              borderRadius: "50%",
              background: "conic-gradient(from 0deg, red 0deg 9.73deg, black 9.73deg 19.46deg, red 19.46deg 29.19deg, black 29.19deg 38.92deg, red 38.92deg 48.65deg, black 48.65deg 58.38deg, red 58.38deg 68.11deg, black 68.11deg 77.84deg, red 77.84deg 87.57deg, black 87.57deg 97.3deg, red 97.3deg 107.03deg, black 107.03deg 116.76deg, red 116.76deg 126.49deg, black 126.49deg 136.22deg, red 136.22deg 145.95deg, black 145.95deg 155.68deg, red 155.68deg 165.41deg, black 165.41deg 175.14deg, red 175.14deg 184.87deg, black 184.87deg 194.6deg, red 194.6deg 204.33deg, black 204.33deg 214.06deg, red 214.06deg 223.79deg, black 223.79deg 233.52deg, red 233.52deg 243.25deg, black 243.25deg 252.98deg, red 252.98deg 262.71deg, black 262.71deg 272.44deg, red 272.44deg 282.17deg, black 282.17deg 291.9deg, red 291.9deg 301.63deg, black 301.63deg 311.36deg, red 311.36deg 321.09deg, black 321.09deg 330.82deg, red 330.82deg 340.55deg, black 340.55deg 350.28deg, red 350.28deg 360deg)",
              border: "3px solid hsl(43,74%,65%)",
              boxShadow: "0 0 30px rgba(184,134,11,0.4), inset 0 0 20px rgba(0,0,0,0.5)",
              rotate: wheelRotation,
              transition: isSpinning ? "rotate 4s cubic-bezier(0.25, 0.46, 0.45, 0.94)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Center ball marker */}
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "hsl(43,74%,65%)", boxShadow: "0 0 10px rgba(184,134,11,0.6)" }} />
          </motion.div>
        </FadeIn>

        {/* Result Number Display */}
        {resultNumber !== null && (
          <FadeIn duration={0.3} fade>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "rgba(212,187,130,0.55)", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
                Result
              </div>
              <div style={{ fontSize: isMobile ? "2.5rem" : "3.5rem", fontWeight: 700, color: RED_NUMBERS.includes(resultNumber) ? "hsl(0,72%,65%)" : resultNumber === 0 ? "hsl(43,74%,65%)" : "hsl(0,0%,90%)", fontFamily: "'Playfair Display', serif" }}>
                {resultNumber}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Betting Controls */}
        <FadeIn duration={0.35} delay={0.16} fade>
          <div style={{ background: "rgba(0,0,0,0.42)", border: "1px solid rgba(212,187,130,0.14)", borderRadius: 16, padding: isMobile ? "12px 16px" : "16px 24px", maxWidth: 500, width: "100%" }}>
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
            ) : gameState === "betting" ? (
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
                    disabled={isSpinning}
                    style={{ width: "100%", cursor: isSpinning ? "not-allowed" : "pointer" }}
                  />
                </div>

                {/* Simple bets */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePlaceBet("red", "red")}
                    disabled={!canPlaceBets}
                    style={{
                      background: "linear-gradient(135deg, hsl(0,72%,50%) 0%, hsl(0,72%,40%) 100%)",
                      color: "white",
                      border: "1px solid hsl(0,72%,35%)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: canPlaceBets ? "pointer" : "not-allowed",
                      opacity: canPlaceBets ? 1 : 0.5,
                      fontSize: isMobile ? "0.8rem" : "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Bet Red
                  </button>
                  <button
                    onClick={() => handlePlaceBet("black", "black")}
                    disabled={!canPlaceBets}
                    style={{
                      background: "linear-gradient(135deg, hsl(0,0%,30%) 0%, hsl(0,0%,15%) 100%)",
                      color: "white",
                      border: "1px solid hsl(0,0%,25%)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: canPlaceBets ? "pointer" : "not-allowed",
                      opacity: canPlaceBets ? 1 : 0.5,
                      fontSize: isMobile ? "0.8rem" : "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Bet Black
                  </button>
                  <button
                    onClick={() => handlePlaceBet("odd", "odd")}
                    disabled={!canPlaceBets}
                    style={{
                      background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                      color: "hsl(150,35%,10%)",
                      border: "1px solid hsl(43,74%,40%)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: canPlaceBets ? "pointer" : "not-allowed",
                      opacity: canPlaceBets ? 1 : 0.5,
                      fontSize: isMobile ? "0.8rem" : "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Odd
                  </button>
                  <button
                    onClick={() => handlePlaceBet("even", "even")}
                    disabled={!canPlaceBets}
                    style={{
                      background: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
                      color: "hsl(150,35%,10%)",
                      border: "1px solid hsl(43,74%,40%)",
                      padding: "8px 12px",
                      borderRadius: 8,
                      cursor: canPlaceBets ? "pointer" : "not-allowed",
                      opacity: canPlaceBets ? 1 : 0.5,
                      fontSize: isMobile ? "0.8rem" : "0.875rem",
                      fontWeight: 600,
                    }}
                  >
                    Even
                  </button>
                </div>

                {/* Current bets display */}
                {state.bets.length > 0 && (
                  <div style={{ background: "rgba(0,0,0,0.3)", padding: 12, borderRadius: 8, marginTop: 12 }}>
                    <div style={{ color: "rgba(212,187,130,0.6)", fontSize: "0.75rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Active Bets
                    </div>
                    <div className="space-y-2">
                      {state.bets.map((bet, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "hsl(43,74%,65%)" }}>
                          <span>{String(bet.value).toUpperCase()}</span>
                          <span>${bet.amount}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ borderTop: "1px solid rgba(212,187,130,0.2)", marginTop: 8, paddingTop: 8, display: "flex", justifyContent: "space-between", fontWeight: 600, color: "hsl(43,74%,65%)" }}>
                      <span>Total Bet:</span>
                      <span>${currentBet}</span>
                    </div>
                  </div>
                )}

                {/* Spin button */}
                <button
                  onClick={handleSpin}
                  disabled={currentBet === 0 || isSpinning}
                  style={{
                    background: currentBet > 0 ? "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)" : "rgba(100,100,100,0.3)",
                    color: currentBet > 0 ? "hsl(150,35%,10%)" : "rgba(212,187,130,0.4)",
                    border: "1px solid hsl(43,74%,40%)",
                    fontWeight: 600,
                    borderRadius: 8,
                    cursor: currentBet > 0 && !isSpinning ? "pointer" : "not-allowed",
                    padding: "10px 24px",
                    fontSize: isMobile ? "0.9rem" : "0.875rem",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <RotateCw size={16} />
                  {isSpinning ? "Spinning..." : "SPIN"}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p style={{ color: "hsl(43,74%,65%)", fontSize: isMobile ? "0.9rem" : "1rem" }}>
                  {message}
                </p>
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
                  }}
                >
                  New Round
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
