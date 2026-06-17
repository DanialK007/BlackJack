import { Card as CardType, calculateHandValue } from "@/hooks/useBlackjack";
import { PlayingCard } from "@/components/Card";

interface HandProps {
  cards: CardType[];
  label?: string;
  isDealer?: boolean;
  status?: "win" | "loss" | "push" | "blackjack" | "bust";
  bet?: number;
  isActive?: boolean;
  isReady?: boolean;
  isFinished?: boolean;
  small?: boolean;
  isCollecting?: boolean;
  collectBaseIndex?: number;
}

function HandTotal({ cards, isDealer }: { cards: CardType[]; isDealer?: boolean }) {
  const visibleCards = cards.filter((c) => !c.isHidden);
  if (visibleCards.length === 0) return null;
  const { total, soft } = calculateHandValue(visibleCards);
  const hasHidden = cards.some((c) => c.isHidden);
  const displayTotal = hasHidden && isDealer ? `${total}` : soft && total < 21 ? `${total - 10}/${total}` : `${total}`;
  const isBust = total > 21;
  const isBlackjack = total === 21 && cards.length === 2 && !hasHidden;

  return (
    <div
      className="rounded-md px-3 py-0.5 text-sm font-semibold text-center"
      style={{
        background: isBust
          ? "rgba(198,40,40,0.85)"
          : isBlackjack
          ? "rgba(43,125,43,0.9)"
          : "rgba(0,0,0,0.55)",
        color: "#fff",
        backdropFilter: "blur(4px)",
        border: isBust
          ? "1px solid rgba(198,40,40,0.5)"
          : isBlackjack
          ? "1px solid rgba(43,125,43,0.5)"
          : "1px solid rgba(255,255,255,0.15)",
        minWidth: 44,
      }}
      data-testid={isDealer ? "dealer-total" : "player-total"}
    >
      {isBlackjack ? "BJ" : isBust ? "BUST" : displayTotal}
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  win: { bg: "rgba(43,125,43,0.9)", text: "#fff", label: "Win" },
  loss: { bg: "rgba(198,40,40,0.85)", text: "#fff", label: "Lose" },
  push: { bg: "rgba(90,90,90,0.85)", text: "#fff", label: "Push" },
  blackjack: { bg: "rgba(184,134,11,0.95)", text: "#fff", label: "Blackjack!" },
  bust: { bg: "rgba(198,40,40,0.85)", text: "#fff", label: "Bust" },
};

export function Hand({
  cards,
  label,
  isDealer,
  status,
  bet,
  isActive,
  isReady,
  isFinished,
  small,
  isCollecting,
  collectBaseIndex = 0,
}: HandProps) {
  const statusStyle = status && status !== "bust" ? STATUS_STYLES[status] : null;

  return (
    <div
      className="flex flex-col items-center gap-2"
      data-testid={isDealer ? "dealer-hand" : "player-hand"}
    >
      {label && !isCollecting && (
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium tracking-widest uppercase"
            style={{ color: "rgba(212,187,130,0.7)" }}
          >
            {label}
          </span>
          {bet !== undefined && bet > 0 && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: "rgba(184,134,11,0.3)", color: "hsl(43,74%,70%)", border: "1px solid rgba(184,134,11,0.3)" }}
            >
              ${bet}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center" style={{ gap: small ? 4 : 8 }}>
        {cards.map((card, i) => (
          <PlayingCard
            key={card.id}
            card={card}
            index={i}
            small={small}
            isCollecting={isCollecting}
            collectIndex={collectBaseIndex + i}
          />
        ))}
      </div>

      {!isCollecting && (
      <div className="flex items-center gap-2">
        <HandTotal cards={cards} isDealer={isDealer} />
        {statusStyle && (
          <div
            className="rounded-md px-3 py-0.5 text-sm font-bold"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
            data-testid={`hand-status-${status}`}
          >
            {statusStyle.label}
          </div>
        )}
        {isActive && !status && (
          <div
            className="rounded-md px-2 py-0.5 text-xs font-semibold animate-pulse"
            style={{ background: "rgba(184,134,11,0.35)", color: "hsl(43,74%,75%)", border: "1px solid rgba(184,134,11,0.3)" }}
          >
            Your Turn
          </div>
        )}
        {((isReady || isFinished) && !status) && (
          <div
            className="rounded-md px-2 py-0.5 text-xs font-semibold"
            style={{ background: "rgba(43,125,43,0.35)", color: "hsl(140,60%,75%)", border: "1px solid rgba(43,125,43,0.3)" }}
          >
            Ready
          </div>
        )}
      </div>
      )}
    </div>
  );
}
