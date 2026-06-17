import { useBlackjack } from "@/hooks/useBlackjack";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ActionButtonsProps {
  game: ReturnType<typeof useBlackjack>;
}

interface ActionBtnProps {
  label: string;
  onClick: () => void;
  variant?: "primary" | "danger" | "gold" | "purple";
  testId: string;
  mobile?: boolean;
}

function ActionBtn({ label, onClick, variant = "primary", testId, mobile }: ActionBtnProps) {
  const styles: Record<string, { bg: string; color: string; border: string }> = {
    primary: {
      bg: "linear-gradient(135deg, hsl(150,50%,32%) 0%, hsl(150,50%,24%) 100%)",
      color: "#d4efdf",
      border: "1px solid hsl(150,45%,28%)",
    },
    danger: {
      bg: "linear-gradient(135deg, hsl(0,65%,48%) 0%, hsl(0,65%,38%) 100%)",
      color: "#fff",
      border: "1px solid hsl(0,65%,38%)",
    },
    gold: {
      bg: "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)",
      color: "hsl(150,35%,10%)",
      border: "1px solid hsl(43,74%,40%)",
    },
    purple: {
      bg: "linear-gradient(135deg, hsl(270,50%,38%) 0%, hsl(270,50%,28%) 100%)",
      color: "#e9d5ff",
      border: "1px solid hsl(270,45%,32%)",
    },
  };
  const s = styles[variant];

  return (
    <button
      style={{
        background: s.bg,
        color: s.color,
        border: s.border,
        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        fontFamily: "'Inter', sans-serif",
        letterSpacing: "0.04em",
        fontWeight: 600,
        borderRadius: 8,
        cursor: "pointer",
        fontSize: mobile ? "0.95rem" : "0.875rem",
        padding: mobile ? "12px 24px" : "10px 20px",
        minWidth: mobile ? 80 : 72,
        transition: "opacity 0.15s, transform 0.1s",
        flex: mobile ? "1 1 auto" : "0 0 auto",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.88"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
      onClick={onClick}
      data-testid={testId}
    >
      {label}
    </button>
  );
}

export function ActionButtons({ game }: ActionButtonsProps) {
  const { state, dispatch } = game;
  const { gameState, playerHands, currentHandIndex, balance, message } = state;
  const isMobile = useIsMobile();

  const currentHand = playerHands[currentHandIndex];
  const isInsurancePrompt = gameState === "playing" && message === "Insurance?";

  if (gameState === "gameOver") {
    return (
      <div className="flex flex-col items-center gap-3">
        <ActionBtn
          label="New Round"
          onClick={() => dispatch({ type: "NEW_ROUND" })}
          variant="gold"
          testId="button-new-round"
          mobile={isMobile}
        />
      </div>
    );
  }

  if (gameState === "dealerDrawing" || gameState === "dealerResolving") {
    return (
      <div style={{ color: "rgba(212,187,130,0.45)", fontSize: isMobile ? "0.75rem" : "0.8rem", letterSpacing: "0.06em" }}>
        Waiting for dealer...
      </div>
    );
  }

  if (isInsurancePrompt) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p style={{ color: "hsl(43,74%,70%)", fontSize: isMobile ? "0.8rem" : "0.875rem", textAlign: "center" }}>
          Dealer shows Ace — take insurance?
        </p>
        <div className="flex gap-2 flex-wrap justify-center">
          <ActionBtn
            label={`Insurance ($${Math.floor(currentHand?.bet / 2 || 0)})`}
            onClick={() => dispatch({ type: "INSURANCE" })}
            variant="gold"
            testId="button-insurance"
            mobile={isMobile}
          />
          <ActionBtn
            label="No Thanks"
            onClick={() => dispatch({ type: "DECLINE_INSURANCE" })}
            variant="danger"
            testId="button-decline-insurance"
            mobile={isMobile}
          />
        </div>
      </div>
    );
  }

  if (gameState === "playing" && currentHand && !currentHand.isFinished) {
    const canDouble = currentHand.cards.length === 2 && balance >= currentHand.bet;
    const canSplit =
      currentHand.cards.length === 2 &&
      currentHand.cards[0].rank === currentHand.cards[1].rank &&
      balance >= currentHand.bet &&
      playerHands.length === 1;

    return (
      <div
        style={{
          display: "flex",
          gap: isMobile ? 8 : 12,
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <ActionBtn label="Hit"   onClick={() => dispatch({ type: "HIT" })}   variant="primary" testId="button-hit"    mobile={isMobile} />
        <ActionBtn label="Stand" onClick={() => dispatch({ type: "STAND" })} variant="danger"  testId="button-stand"  mobile={isMobile} />
        {canDouble && (
          <ActionBtn label="Double" onClick={() => dispatch({ type: "DOUBLE_DOWN" })} variant="gold"   testId="button-double" mobile={isMobile} />
        )}
        {canSplit && (
          <ActionBtn label="Split"  onClick={() => dispatch({ type: "SPLIT" })}        variant="purple" testId="button-split"  mobile={isMobile} />
        )}
      </div>
    );
  }

  return null;
}
