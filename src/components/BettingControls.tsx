import { useBlackjack } from "@/hooks/useBlackjack";
import { useIsMobile } from "@/hooks/useIsMobile";
import { playSound } from "@/lib/sounds";

interface ChipProps {
  amount: number;
  color: string;
  borderColor: string;
  textColor: string;
  onPlace: (amount: number) => void;
  disabled: boolean;
  size: number;
}

function Chip({
  amount,
  color,
  borderColor,
  textColor,
  onPlace,
  disabled,
  size,
}: ChipProps) {
  function handleClick() {
    playSound("/sounds/coin.mp3", 0.25);
    onPlace(amount);
  }

  return (
    <button
      className="chip"
      data-testid={`chip-${amount}`}
      onClick={handleClick}
      disabled={disabled}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        outlineColor: "rgba(0,0,0,0.4)",
        borderColor: borderColor,
        color: textColor,
        fontSize: size < 48 ? "0.6rem" : "0.7rem",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        flexShrink: 0,
      }}
    >
      ${amount}
    </button>
  );
}

const CHIPS = [
  {
    amount: 5,
    color: "#e53935",
    borderColor: "rgba(255,255,255,0.4)",
    textColor: "#fff",
  },
  {
    amount: 10,
    color: "#1565c0",
    borderColor: "rgba(255,255,255,0.4)",
    textColor: "#fff",
  },
  {
    amount: 25,
    color: "#2e7d32",
    borderColor: "rgba(255,255,255,0.4)",
    textColor: "#fff",
  },
  {
    amount: 50,
    color: "#4a148c",
    borderColor: "rgba(255,255,255,0.35)",
    textColor: "#fff",
  },
  {
    amount: 100,
    color: "#e65100",
    borderColor: "rgba(255,255,255,0.4)",
    textColor: "#fff",
  },
];

interface BettingControlsProps {
  game: ReturnType<typeof useBlackjack>;
}

export function BettingControls({ game }: BettingControlsProps) {
  const { state, dispatch } = game;
  const isMobile = useIsMobile();
  const isBetting = state.gameState === "betting";
  const canDeal = isBetting && state.currentBet > 0;
  const chipSize = isMobile ? 44 : 52;

  return (
    <div
      className="flex flex-col items-center p-1"
      style={{ gap: isMobile ? 10 : 16 }}
    >
      {/* Chip row */}
      <div
        className="flex items-center justify-center pb-1"
        style={{ gap: isMobile ? 6 : 8 }}
      >
        {CHIPS.map((chip) => (
          <Chip
            key={chip.amount}
            {...chip}
            size={chipSize}
            onPlace={(amount) => dispatch({ type: "PLACE_BET", amount })}
            disabled={!isBetting || state.balance < chip.amount}
          />
        ))}
      </div>

      {/* Bet display + actions */}
      <div
        className="flex items-center justify-center"
        style={{ gap: isMobile ? 8 : 12 }}
      >
        <div
          className="flex items-center gap-2 rounded-lg"
          style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(184,134,11,0.3)",
            padding: isMobile ? "6px 12px" : "8px 16px",
          }}
        >
          <span
            className="uppercase tracking-widest"
            style={{
              color: "rgba(212,187,130,0.6)",
              fontSize: isMobile ? "0.6rem" : "0.75rem",
            }}
          >
            Bet
          </span>
          <span
            style={{
              color:
                state.currentBet > 0
                  ? "hsl(43,74%,65%)"
                  : "rgba(212,187,130,0.3)",
              fontFamily: "'Playfair Display', serif",
              fontSize: isMobile ? "1rem" : "1.125rem",
              fontWeight: 700,
            }}
            data-testid="current-bet"
          >
            ${state.currentBet}
          </span>
        </div>

        {state.currentBet > 0 && isBetting && (
          <button
            style={{
              background: "rgba(198,40,40,0.25)",
              color: "rgba(239,154,154,0.9)",
              border: "1px solid rgba(198,40,40,0.3)",
              borderRadius: 8,
              padding: isMobile ? "6px 10px" : "6px 12px",
              fontSize: isMobile ? "0.7rem" : "0.75rem",
              cursor: "pointer",
            }}
            onClick={() => dispatch({ type: "CLEAR_BET" })}
            data-testid="button-clear-bet"
          >
            Clear
          </button>
        )}

        <button
          style={{
            background: canDeal
              ? "linear-gradient(135deg, hsl(43,74%,52%) 0%, hsl(43,74%,42%) 100%)"
              : "rgba(100,100,100,0.3)",
            color: canDeal ? "hsl(150,35%,10%)" : "rgba(150,150,150,0.5)",
            border: canDeal
              ? "1px solid hsl(43,74%,40%)"
              : "1px solid rgba(100,100,100,0.2)",
            cursor: canDeal ? "pointer" : "not-allowed",
            boxShadow: canDeal ? "0 2px 8px rgba(184,134,11,0.3)" : "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            borderRadius: 8,
            fontSize: isMobile ? "0.85rem" : "0.875rem",
            padding: isMobile ? "8px 20px" : "8px 24px",
            letterSpacing: "0.02em",
          }}
          onClick={() => {
            canDeal && dispatch({ type: "DEAL" });
          }}
          disabled={!canDeal}
          data-testid="button-deal"
        >
          Deal
        </button>
      </div>
    </div>
  );
}
