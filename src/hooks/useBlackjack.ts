import { useState, useReducer, useEffect } from "react";

export type Suit = "Spades" | "Hearts" | "Diamonds" | "Clubs";
export type Rank = "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K" | "A";

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  value: number;
  isHidden: boolean;
}

export interface Hand {
  id: string;
  cards: Card[];
  bet: number;
  isFinished: boolean;
  status?: "win" | "loss" | "push" | "blackjack" | "bust";
}

export type GameState = "betting" | "dealing" | "playerTurn" | "dealerTurn" | "gameOver";
export type DealingPhase = "p1" | "p2" | "d1" | "d2" | "done";

export interface GameContext {
  deck: Card[];
  dealerHand: Card[];
  playerHands: Hand[];
  currentHandIndex: number;
  balance: number;
  currentBet: number;
  gameState: GameState;
  insuranceBet: number;
  message: string;
  dealingPhase: DealingPhase;
  // Turn-based logic
  currentTurn: "player" | "dealer";
  playerSkipCount: number;
  dealerSkipCount: number;
  playerReady: boolean;
  dealerReady: boolean;
  // Bust detection
  isBusted: boolean;
}

const SUITS: Suit[] = ["Spades", "Hearts", "Diamonds", "Clubs"];
const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];

function createDeck(numDecks = 6): Card[] {
  const deck: Card[] = [];
  for (let i = 0; i < numDecks; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        let value = parseInt(rank);
        if (["J", "Q", "K"].includes(rank)) value = 10;
        if (rank === "A") value = 11;
        deck.push({
          id: `${i}-${suit}-${rank}`,
          suit,
          rank,
          value,
          isHidden: false,
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

export function calculateHandValue(cards: Card[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;
  
  for (const card of cards) {
    if (card.isHidden) continue;
    total += card.value;
    if (card.rank === "A") aces += 1;
  }
  
  let soft = false;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  
  if (aces > 0 && total <= 21) {
    soft = true;
  }
  
  return { total, soft };
}

type Action = 
  | { type: "PLACE_BET"; amount: number }
  | { type: "CLEAR_BET" }
  | { type: "DEAL" }
  | { type: "DEAL_NEXT_CARD" }
  | { type: "DRAW" }
  | { type: "SKIP" }
  | { type: "STAND" }
  | { type: "INSURANCE" }
  | { type: "DECLINE_INSURANCE" }
  | { type: "RESTART" }
  | { type: "NEW_ROUND" }
  | { type: "AUTO_DEALER_DRAW" }
  | { type: "AUTO_DEALER_SKIP" }
  | { type: "RESOLVE_GAME" }
  | { type: "SHUFFLE" };

function gameReducer(state: GameContext, action: Action): GameContext {
  switch (action.type) {
    case "SHUFFLE":
      return {
        ...state,
        deck: shuffle(createDeck(6)),
        dealingPhase: "done",
      };

    case "RESTART":
      return {
        ...state,
        balance: 1000,
        currentBet: 0,
        gameState: "betting",
        message: "",
        playerHands: [],
        dealerHand: [],
        insuranceBet: 0,
        currentHandIndex: 0,
        deck: createDeck(6),
        dealingPhase: "done",
        currentTurn: "player",
        playerSkipCount: 0,
        dealerSkipCount: 0,
        playerReady: false,
        dealerReady: false,
        isBusted: false,
      };

    case "NEW_ROUND":
      return {
        ...state,
        currentBet: 0,
        gameState: "betting",
        message: "",
        playerHands: [],
        dealerHand: [],
        insuranceBet: 0,
        currentHandIndex: 0,
        deck: state.deck.length < 78 ? createDeck(6) : state.deck,
        dealingPhase: "done",
        currentTurn: "player",
        playerSkipCount: 0,
        dealerSkipCount: 0,
        playerReady: false,
        dealerReady: false,
        isBusted: false,
      };

    case "PLACE_BET":
      if (state.balance >= action.amount) {
        return {
          ...state,
          balance: state.balance - action.amount,
          currentBet: state.currentBet + action.amount,
        };
      }
      return state;

    case "CLEAR_BET":
      return {
        ...state,
        balance: state.balance + state.currentBet,
        currentBet: 0,
      };

    case "DEAL": {
      if (state.currentBet === 0) return state;
      
      let newDeck = [...state.deck];
      if (newDeck.length < 312 * 0.25) {
        newDeck = createDeck(6);
      }
      newDeck = shuffle(newDeck);

      const playerCard1 = newDeck.pop()!;

      return {
        ...state,
        deck: newDeck,
        playerHands: [{
          id: "hand-1",
          cards: [playerCard1],
          bet: state.currentBet,
          isFinished: false,
        }],
        dealerHand: [],
        gameState: "dealing",
        dealingPhase: "p1",
        currentTurn: "player",
        playerSkipCount: 0,
        dealerSkipCount: 0,
        playerReady: false,
        dealerReady: false,
        isBusted: false,
        message: "",
      };
    }

    case "DEAL_NEXT_CARD": {
      let newDeck = [...state.deck];
      const nextPhase = state.dealingPhase === "p1" ? "p2" : state.dealingPhase === "p2" ? "d1" : state.dealingPhase === "d1" ? "d2" : "done";
      
      if (state.dealingPhase === "p1") {
        const dealerCard1 = newDeck.pop()!;
        return { ...state, deck: newDeck, dealerHand: [dealerCard1], dealingPhase: nextPhase };
      }
      
      if (state.dealingPhase === "p2") {
        const playerCard2 = newDeck.pop()!;
        const hands = [...state.playerHands];
        if (hands[0]) {
          hands[0] = { ...hands[0], cards: [...hands[0].cards, playerCard2] };
        }
        
        const { total: pTotal } = calculateHandValue(hands[0]?.cards || []);
        if (pTotal === 21) {
          hands[0]!.status = "blackjack";
          hands[0]!.isFinished = true;
          return {
            ...state,
            deck: newDeck,
            playerHands: hands,
            dealingPhase: nextPhase,
            gameState: "gameOver",
            playerReady: true,
            dealerReady: true,
            message: "Blackjack! You win!",
          };
        }
        
        return { ...state, deck: newDeck, playerHands: hands, dealingPhase: nextPhase };
      }
      
      if (state.dealingPhase === "d1") {
        const dealerCard2 = newDeck.pop()!;
        const hiddenCard = { ...dealerCard2, isHidden: true };
        return { ...state, deck: newDeck, dealerHand: [...state.dealerHand, hiddenCard], dealingPhase: nextPhase };
      }
      
      if (state.dealingPhase === "d2") {
        // Dealing done, randomly select who goes first
        const firstTurn = Math.random() < 0.5 ? "player" : "dealer";
        return {
          ...state,
          gameState: "playerTurn",
          dealingPhase: "done",
          currentTurn: firstTurn,
          message: firstTurn === "player" ? "Your turn" : "Dealer's turn",
        };
      }
      
      return state;
    }

    case "DRAW": {
      if (state.currentTurn !== "player" || state.playerReady) return state;
      
      let newDeck = [...state.deck];
      const card = newDeck.pop()!;
      const hands = [...state.playerHands];
      hands[0]!.cards = [...hands[0]!.cards, card];
      
      const { total } = calculateHandValue(hands[0]!.cards);
      
      if (total > 21) {
        hands[0]!.status = "bust";
        hands[0]!.isFinished = true;
        return {
          ...state,
          deck: newDeck,
          playerHands: hands,
          gameState: "gameOver",
          isBusted: true,
          message: "Bust! Game over.",
        };
      }
      
      return {
        ...state,
        deck: newDeck,
        playerHands: hands,
        currentTurn: "dealer",
        gameState: "dealerTurn",
      };
    }

    case "SKIP": {
      if (state.currentTurn === "player" && !state.playerReady) {
        const newSkipCount = state.playerSkipCount + 1;
        if (newSkipCount >= 2) {
          return {
            ...state,
            playerSkipCount: newSkipCount,
            playerReady: true,
            currentTurn: "dealer",
            gameState: "dealerTurn",
            message: "You are ready. Dealer's turn.",
          };
        }
        return {
          ...state,
          playerSkipCount: newSkipCount,
          currentTurn: "dealer",
          gameState: "dealerTurn",
          message: "Player skipped.",
        };
      }
      
      if (state.currentTurn === "dealer" && !state.dealerReady) {
        const newSkipCount = state.dealerSkipCount + 1;
        if (newSkipCount >= 2) {
          return {
            ...state,
            dealerSkipCount: newSkipCount,
            dealerReady: true,
            currentTurn: "player",
            gameState: "playerTurn",
            message: "Dealer is ready. Your turn.",
          };
        }
        return {
          ...state,
          dealerSkipCount: newSkipCount,
          currentTurn: "player",
          gameState: "playerTurn",
          message: "Dealer skipped.",
        };
      }
      
      return state;
    }

    case "STAND": {
      if (state.currentTurn === "player") {
        return {
          ...state,
          playerSkipCount: 2,
          playerReady: true,
          currentTurn: "dealer",
          gameState: "dealerTurn",
          message: "You stand. Dealer's turn.",
        };
      }
      return state;
    }

    case "AUTO_DEALER_DRAW": {
      if (state.currentTurn !== "dealer" || state.dealerReady) return state;
      
      let newDeck = [...state.deck];
      const card = newDeck.pop()!;
      const dealerCards = [...state.dealerHand, card];
      
      const { total } = calculateHandValue(dealerCards);
      
      if (total > 21) {
        return {
          ...state,
          deck: newDeck,
          dealerHand: dealerCards,
          gameState: "gameOver",
          isBusted: true,
          message: "Dealer bust! You win!",
        };
      }
      
      if (total >= 17) {
        return {
          ...state,
          deck: newDeck,
          dealerHand: dealerCards,
          dealerReady: true,
          currentTurn: "player",
          gameState: "playerTurn",
          message: "Dealer stands. Your turn.",
        };
      }
      
      return {
        ...state,
        deck: newDeck,
        dealerHand: dealerCards,
        currentTurn: "player",
        gameState: "playerTurn",
      };
    }

    case "AUTO_DEALER_SKIP": {
      if (state.currentTurn !== "dealer" || state.dealerReady) return state;
      
      const newSkipCount = state.dealerSkipCount + 1;
      if (newSkipCount >= 2) {
        return {
          ...state,
          dealerSkipCount: newSkipCount,
          dealerReady: true,
          currentTurn: "player",
          gameState: "playerTurn",
          message: "Dealer stands. Your turn.",
        };
      }
      
      return {
        ...state,
        dealerSkipCount: newSkipCount,
        currentTurn: "player",
        gameState: "playerTurn",
        message: "Dealer passed.",
      };
    }

    case "INSURANCE":
      return {
        ...state,
        balance: state.balance - (state.currentBet / 2),
        insuranceBet: state.currentBet / 2,
      };

    case "DECLINE_INSURANCE":
      return { ...state, insuranceBet: 0 };

    case "RESOLVE_GAME": {
      const playerValue = calculateHandValue(state.playerHands[0]?.cards || []).total;
      const dealerValue = calculateHandValue(state.dealerHand).total;
      
      const playerCards = state.playerHands[0]?.cards || [];
      const playerStatus = state.playerHands[0]?.status || "loss";
      
      if (playerStatus === "blackjack") {
        return {
          ...state,
          playerHands: state.playerHands.map((h, i) => 
            i === 0 ? { ...h, status: "blackjack" } : h
          ),
          gameState: "gameOver",
          message: "You win with blackjack!",
        };
      }
      
      if (playerStatus === "bust") {
        return {
          ...state,
          playerHands: state.playerHands.map((h, i) => 
            i === 0 ? { ...h, status: "bust" } : h
          ),
          gameState: "gameOver",
          message: "Bust! You lose.",
        };
      }
      
      if (dealerValue > 21) {
        return {
          ...state,
          playerHands: state.playerHands.map((h, i) => 
            i === 0 ? { ...h, status: "win" } : h
          ),
          gameState: "gameOver",
          message: "Dealer bust! You win!",
        };
      }
      
      const hands = [...state.playerHands];
      if (playerValue > dealerValue) {
        hands[0]!.status = "win";
        return {
          ...state,
          playerHands: hands,
          gameState: "gameOver",
          balance: state.balance + (state.currentBet * 2),
          message: "You win!",
        };
      } else if (playerValue < dealerValue) {
        hands[0]!.status = "loss";
        return {
          ...state,
          playerHands: hands,
          gameState: "gameOver",
          message: "Dealer wins.",
        };
      } else {
        hands[0]!.status = "push";
        return {
          ...state,
          playerHands: hands,
          gameState: "gameOver",
          balance: state.balance + state.currentBet,
          message: "Push!",
        };
      }
    }

    default:
      return state;
  }
}

const initialGameState: GameContext = {
  deck: createDeck(6),
  dealerHand: [],
  playerHands: [],
  currentHandIndex: 0,
  balance: 1000,
  currentBet: 0,
  gameState: "betting",
  insuranceBet: 0,
  message: "",
  dealingPhase: "done",
  currentTurn: "player",
  playerSkipCount: 0,
  dealerSkipCount: 0,
  playerReady: false,
  dealerReady: false,
  isBusted: false,
};

export function useBlackjack() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);

  // Auto-deal next card during dealing phase
  useEffect(() => {
    if (state.gameState === "dealing" && state.dealingPhase !== "done") {
      const timer = setTimeout(() => {
        dispatch({ type: "DEAL_NEXT_CARD" });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.dealingPhase]);

  // Auto-dealer actions during dealer turn
  useEffect(() => {
    if (state.gameState === "dealerTurn" && !state.dealerReady) {
      const delay = 1000 + Math.random() * 2000; // 1-3 seconds
      const timer = setTimeout(() => {
        const dealerValue = calculateHandValue(state.dealerHand).total;
        // Simple dealer AI: draw if under 17, skip if 17 or more
        if (dealerValue < 17) {
          dispatch({ type: "AUTO_DEALER_DRAW" });
        } else {
          dispatch({ type: "AUTO_DEALER_SKIP" });
        }
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.dealerReady, state.dealerHand]);

  // Resolve game when both are ready
  useEffect(() => {
    if (state.playerReady && state.dealerReady && state.gameState !== "gameOver") {
      const timer = setTimeout(() => {
        dispatch({ type: "RESOLVE_GAME" });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.playerReady, state.dealerReady, state.gameState]);

  return {
    state,
    dispatch,
  };
}
