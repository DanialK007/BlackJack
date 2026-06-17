import { useState, useReducer, useCallback } from "react";

export type Suit = "Spades" | "Hearts" | "Diamonds" | "Clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
}

export type BaccaratGameState = "betting" | "dealing" | "gameOver";

export interface BaccaratContext {
  deck: Card[];
  playerHand: Card[];
  bankerHand: Card[];
  balance: number;
  currentBet: number;
  betType: "player" | "banker" | "tie" | null;
  gameState: BaccaratGameState;
  message: string;
  playerTotal: number;
  bankerTotal: number;
}

const SUITS: Suit[] = ["Spades", "Hearts", "Diamonds", "Clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function createDeck(numDecks = 6): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = parseInt(rank);
        if (["J", "Q", "K"].includes(rank)) value = 0;
        if (rank === "A") value = 1;
        deck.push({
          id: `${i}-${suit}-${rank}`,
          suit,
          rank,
          value,
        });
      }
    }
  }
  return shuffle(deck);
}

function shuffle(deck: Card[]): Card[] {
  const newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
}

function calculateHandValue(cards: Card[]): number {
  let sum = 0;
  for (const card of cards) {
    sum += card.value;
  }
  return sum % 10;
}

type Action =
  | { type: "PLACE_BET"; amount: number; betType: "player" | "banker" | "tie" }
  | { type: "DEAL" }
  | { type: "DRAW_THIRD_CARD" }
  | { type: "RESOLVE" }
  | { type: "NEW_ROUND" }
  | { type: "RESTART" };

function baccaratReducer(state: BaccaratContext, action: Action): BaccaratContext {
  switch (action.type) {
    case "PLACE_BET": {
      if (state.balance < action.amount || action.amount <= 0) {
        return state;
      }
      return {
        ...state,
        currentBet: action.amount,
        betType: action.betType,
      };
    }

    case "DEAL": {
      if (state.currentBet === 0 || !state.betType) return state;

      let newDeck = [...state.deck];
      // Draw 4 cards (2 for player, 2 for banker)
      const playerCard1 = newDeck.pop()!;
      const bankerCard1 = newDeck.pop()!;
      const playerCard2 = newDeck.pop()!;
      const bankerCard2 = newDeck.pop()!;

      return {
        ...state,
        deck: newDeck,
        playerHand: [playerCard1, playerCard2],
        bankerHand: [bankerCard1, bankerCard2],
        gameState: "dealing",
        playerTotal: calculateHandValue([playerCard1, playerCard2]),
        bankerTotal: calculateHandValue([bankerCard1, bankerCard2]),
      };
    }

    case "DRAW_THIRD_CARD": {
      let newDeck = [...state.deck];
      let playerHand = [...state.playerHand];
      let bankerHand = [...state.bankerHand];
      let playerTotal = state.playerTotal;
      let bankerTotal = state.bankerTotal;

      // Player draws on 0-5, stands on 6-9
      if (playerTotal <= 5) {
        const playerCard = newDeck.pop()!;
        playerHand.push(playerCard);
        playerTotal = calculateHandValue(playerHand);
      }

      // Banker draws based on player's third card and banker's total
      const shouldBankerDraw = playerHand.length === 3
        ? (
            bankerTotal <= 2 ||
            (bankerTotal === 3 && playerHand[2].value !== 8) ||
            (bankerTotal === 4 && [2, 3, 4, 5, 6, 7].includes(playerHand[2].value)) ||
            (bankerTotal === 5 && [4, 5, 6, 7].includes(playerHand[2].value)) ||
            (bankerTotal === 6 && [6, 7].includes(playerHand[2].value))
          )
        : bankerTotal <= 5;

      if (shouldBankerDraw) {
        const bankerCard = newDeck.pop()!;
        bankerHand.push(bankerCard);
        bankerTotal = calculateHandValue(bankerHand);
      }

      return {
        ...state,
        deck: newDeck,
        playerHand,
        bankerHand,
        playerTotal,
        bankerTotal,
        gameState: "gameOver",
      };
    }

    case "RESOLVE": {
      let newBalance = state.balance - state.currentBet;
      let message = "";

      if (state.playerTotal > state.bankerTotal) {
        if (state.betType === "player") {
          newBalance += state.currentBet * 2;
          message = "Player wins!";
        } else {
          message = "Player wins - You lose";
        }
      } else if (state.bankerTotal > state.playerTotal) {
        if (state.betType === "banker") {
          newBalance += Math.floor(state.currentBet * 1.95); // 5% commission
          message = "Banker wins!";
        } else {
          message = "Banker wins - You lose";
        }
      } else {
        if (state.betType === "tie") {
          newBalance += state.currentBet * 9;
          message = "Tie! You win!";
        } else {
          newBalance += state.currentBet; // Push - return bet
          message = "Push - Tie";
        }
      }

      return {
        ...state,
        balance: newBalance,
        message,
        gameState: "gameOver",
      };
    }

    case "NEW_ROUND": {
      return {
        ...state,
        playerHand: [],
        bankerHand: [],
        currentBet: 0,
        betType: null,
        message: "",
        gameState: "betting",
        playerTotal: 0,
        bankerTotal: 0,
        deck: state.deck.length < 20 ? createDeck(6) : state.deck,
      };
    }

    case "RESTART": {
      return {
        deck: createDeck(6),
        playerHand: [],
        bankerHand: [],
        balance: 1000,
        currentBet: 0,
        betType: null,
        gameState: "betting",
        message: "",
        playerTotal: 0,
        bankerTotal: 0,
      };
    }

    default:
      return state;
  }
}

export function useBaccarat() {
  const [state, dispatch] = useReducer(baccaratReducer, {
    deck: createDeck(6),
    playerHand: [],
    bankerHand: [],
    balance: 1000,
    currentBet: 0,
    betType: null,
    gameState: "betting",
    message: "",
    playerTotal: 0,
    bankerTotal: 0,
  });

  const placeBet = useCallback((amount: number, betType: "player" | "banker" | "tie") => {
    dispatch({ type: "PLACE_BET", amount, betType });
  }, []);

  const deal = useCallback(() => {
    dispatch({ type: "DEAL" });
  }, []);

  const drawThirdCard = useCallback(() => {
    dispatch({ type: "DRAW_THIRD_CARD" });
  }, []);

  const resolve = useCallback(() => {
    dispatch({ type: "RESOLVE" });
  }, []);

  const newRound = useCallback(() => {
    dispatch({ type: "NEW_ROUND" });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: "RESTART" });
  }, []);

  return {
    state,
    placeBet,
    deal,
    drawThirdCard,
    resolve,
    newRound,
    restart,
  };
}
