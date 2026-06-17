import { GameTable } from "@/components/GameTable";
import { RouletteTable } from "@/components/RouletteTable";
import { BaccaratTable } from "@/components/BaccaratTable";
import { PokerTable } from "@/components/PokerTable";

export default function Game() {
  const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : "");
  const gameType = params.get("type") || "blackjack";

  const renderGame = () => {
    switch (gameType) {
      case "roulette":
        return <RouletteTable />;
      case "baccarat":
        return <BaccaratTable />;
      case "poker":
        return <PokerTable />;
      case "blackjack":
      default:
        return <GameTable />;
    }
  };

  return renderGame();
}
