import { useState, useReducer, useCallback } from "react";

export type Suit = "Spades" | "Hearts" | "Diamonds" | "Clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface PlayerHand {
  id: string;
  holeCards: Card[];
}

export type PokerGameState = "preFlop" | "flop" | "turn" | "river" | "showdown" | "gameOver";

export interface PokerContext {
  deck: Card[];
  community: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  balance: number;
  currentBet: number;
  potSize: number;
  gameState: PokerGameState;
  message: string;
  roundNumber: number;
}

const SUITS: Suit[] = ["Spades", "Hearts", "Diamonds", "Clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${suit}-${rank}`, suit, rank });
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

function getCardValue(rank: Rank): number {
  switch (rank) {
    case "A":
      return 14;
    case "K":
      return 13;
    case "Q":
      return 12;
    case "J":
      return 11;
    case "10":
      return 10;
    case "9":
      return 9;
    case "8":
      return 8;
    case "7":
      return 7;
    case "6":
      return 6;
    case "5":
      return 5;
    case "4":
      return 4;
    case "3":
      return 3;
    case "2":
      return 2;
  }
}

function evaluateHand(cards: Card[]): { rank: number; description: string } {
  // Simplified poker hand evaluation
  const ranks = cards.map((c) => getCardValue(c.rank)).sort((a, b) => b - a);
  const suits = cards.map((c) => c.suit);
  
  const isFlush = suits.length === new Set(suits).size ? false : suits.some((suit, i) => suits.filter((s) => s === suit).length >= 5);
  const isStraight = ranks.every((r, i, arr) => i === 0 || r === arr[i - 1] - 1) && ranks.length >= 5;

  // Count pairs, three of a kind, etc.
  const rankCounts = new Map<number, number>();
  for (const rank of ranks) {
    rankCounts.set(rank, (rankCounts.get(rank) || 0) + 1);
  }
  const counts = Array.from(rankCounts.values()).sort((a, b) => b - a);

  if (counts[0] === 4) return { rank: 7, description: "Four of a Kind" };
  if (counts[0] === 3 && counts[1] === 2) return { rank: 6, description: "Full House" };
  if (isFlush) return { rank: 5, description: "Flush" };
  if (isStraight) return { rank: 4, description: "Straight" };
  if (counts[0] === 3) return { rank: 3, description: "Three of a Kind" };
  if (counts[0] === 2 && counts[1] === 2) return { rank: 2, description: "Two Pair" };
  if (counts[0] === 2) return { rank: 1, description: "Pair" };

  return { rank: 0, description: "High Card" };
}

type Action =
  | { type: "PLACE_BET"; amount: number }
  | { type: "CALL" }
  | { type: "RAISE"; amount: number }
  | { type: "FOLD" }
  | { type: "CHECK" }
  | { type: "DEAL" }
  | { type: "NEXT_STREET" }
  | { type: "SHOWDOWN" }
  | { type: "NEW_ROUND" }
  | { type: "RESTART" };

function pokerReducer(state: PokerContext, action: Action): PokerContext {
  switch (action.type) {
    case "PLACE_BET": {
      if (state.balance < action.amount || action.amount <= 0) {
        return state;
      }
      return {
        ...state,
        currentBet: action.amount,
        balance: state.balance - action.amount,
        potSize: state.potSize + action.amount,
      };
    }

    case "CALL": {
      // Simplified: just match current bet
      return {
        ...state,
        potSize: state.potSize + state.currentBet,
        balance: state.balance - state.currentBet,
      };
    }

    case "RAISE": {
      const newBet = state.currentBet + action.amount;
      if (state.balance < newBet) return state;
      return {
        ...state,
        currentBet: newBet,
        balance: state.balance - action.amount,
        potSize: state.potSize + action.amount,
      };
    }

    case "CHECK": {
      return state; // Just move to next street
    }

    case "FOLD": {
      return {
        ...state,
        message: "You folded. Dealer wins.",
        gameState: "gameOver",
      };
    }

    case "DEAL": {
      if (state.currentBet === 0) return state;
      let newDeck = [...state.deck];
      
      // Deal hole cards
      const playerCard1 = newDeck.pop()!;
      const playerCard2 = newDeck.pop()!;
      const dealerCard1 = newDeck.pop()!;
      const dealerCard2 = newDeck.pop()!;

      return {
        ...state,
        deck: newDeck,
        playerHand: [playerCard1, playerCard2],
        dealerHand: [dealerCard1, dealerCard2],
        gameState: "preFlop",
        message: "PreFlop - Check, Call, Raise, or Fold",
      };
    }

    case "NEXT_STREET": {
      let newDeck = [...state.deck];
      let community = [...state.community];

      if (state.gameState === "preFlop") {
        // Deal the flop (3 cards)
        community = [newDeck.pop()!, newDeck.pop()!, newDeck.pop()!];
        return {
          ...state,
          deck: newDeck,
          community,
          gameState: "flop",
          message: "Flop - Check, Call, Raise, or Fold",
          currentBet: 0,
        };
      } else if (state.gameState === "flop") {
        // Deal the turn
        community.push(newDeck.pop()!);
        return {
          ...state,
          deck: newDeck,
          community,
          gameState: "turn",
          message: "Turn - Check, Call, Raise, or Fold",
          currentBet: 0,
        };
      } else if (state.gameState === "turn") {
        // Deal the river
        community.push(newDeck.pop()!);
        return {
          ...state,
          deck: newDeck,
          community,
          gameState: "river",
          message: "River - Check, Call, Raise, or Fold",
          currentBet: 0,
        };
      } else if (state.gameState === "river") {
        return {
          ...state,
          gameState: "showdown",
          message: "Showdown",
        };
      }

      return state;
    }

    case "SHOWDOWN": {
      const allPlayerCards = [...state.playerHand, ...state.community];
      const allDealerCards = [...state.dealerHand, ...state.community];

      const playerEval = evaluateHand(allPlayerCards);
      const dealerEval = evaluateHand(allDealerCards);

      let newBalance = state.balance;
      let message = "";

      if (playerEval.rank > dealerEval.rank) {
        newBalance += state.potSize;
        message = `You win! ${playerEval.description}`;
      } else if (dealerEval.rank > playerEval.rank) {
        message = `Dealer wins with ${dealerEval.description}`;
      } else {
        newBalance += state.potSize / 2;
        message = "Push - Split pot";
      }

      return {
        ...state,
        balance: newBalance,
        gameState: "gameOver",
        message,
      };
    }

    case "NEW_ROUND": {
      return {
        ...state,
        playerHand: [],
        dealerHand: [],
        community: [],
        currentBet: 0,
        potSize: 0,
        message: "",
        gameState: "preFlop",
        roundNumber: state.roundNumber + 1,
        deck: state.deck.length < 10 ? createDeck() : state.deck,
      };
    }

    case "RESTART": {
      return {
        deck: createDeck(),
        community: [],
        playerHand: [],
        dealerHand: [],
        balance: 1000,
        currentBet: 0,
        potSize: 0,
        gameState: "preFlop",
        message: "",
        roundNumber: 1,
      };
    }

    default:
      return state;
  }
}

export function usePoker() {
  const [state, dispatch] = useReducer(pokerReducer, {
    deck: createDeck(),
    community: [],
    playerHand: [],
    dealerHand: [],
    balance: 1000,
    currentBet: 0,
    potSize: 0,
    gameState: "preFlop",
    message: "",
    roundNumber: 1,
  });

  const placeBet = useCallback((amount: number) => {
    dispatch({ type: "PLACE_BET", amount });
  }, []);

  const call = useCallback(() => {
    dispatch({ type: "CALL" });
  }, []);

  const raise = useCallback((amount: number) => {
    dispatch({ type: "RAISE", amount });
  }, []);

  const check = useCallback(() => {
    dispatch({ type: "CHECK" });
  }, []);

  const fold = useCallback(() => {
    dispatch({ type: "FOLD" });
  }, []);

  const deal = useCallback(() => {
    dispatch({ type: "DEAL" });
  }, []);

  const nextStreet = useCallback(() => {
    dispatch({ type: "NEXT_STREET" });
  }, []);

  const showdown = useCallback(() => {
    dispatch({ type: "SHOWDOWN" });
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
    call,
    raise,
    check,
    fold,
    deal,
    nextStreet,
    showdown,
    newRound,
    restart,
  };
}
