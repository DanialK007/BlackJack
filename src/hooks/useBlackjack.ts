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

export type GameState = "betting" | "dealing" | "playing" | "dealerDrawing" | "dealerResolving" | "gameOver";
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
  // For progressive dealing animation
  dealingPhase: DealingPhase;
  // Ready badges
  playerReady: boolean;
  dealerReady: boolean;
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
  | { type: "HIT" }
  | { type: "STAND" }
  | { type: "DOUBLE_DOWN" }
  | { type: "SPLIT" }
  | { type: "INSURANCE" }
  | { type: "DECLINE_INSURANCE" }
  | { type: "RESTART" }
  | { type: "NEW_ROUND" }
  | { type: "DEALER_RESOLVE" }
  | { type: "DEALER_DRAW_NEXT" }
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
        playerReady: false,
        dealerReady: false,
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
        playerReady: false,
        dealerReady: false,
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

      // Deal player card 1 — the rest is progressive via DEAL_NEXT_CARD
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
        playerReady: false,
        dealerReady: false,
        message: "",
      };
    }

    case "DEAL_NEXT_CARD": {
      let newDeck = [...state.deck];
      const { dealingPhase, playerHands, dealerHand } = state;

      // p1 → deal player card 2 + dealer card 1
      if (dealingPhase === "p1") {
        const playerCard2 = newDeck.pop()!;
        const dealerCard1 = newDeck.pop()!;
        const newPlayerHands = playerHands.map(h => ({
          ...h,
          cards: [...h.cards, playerCard2],
        }));
        return {
          ...state,
          deck: newDeck,
          playerHands: newPlayerHands,
          dealerHand: [dealerCard1],
          gameState: "dealing",
          dealingPhase: "p2",
        };
      }

      // p2 → deal dealer's hidden card
      if (dealingPhase === "p2") {
        const dealerCard2 = { ...newDeck.pop()!, isHidden: true };
        const newDealerHand = [...dealerHand, dealerCard2];
        const pVal = calculateHandValue(playerHands[0]?.cards ?? []).total;
        const dealerCard1 = dealerHand[0];

        // Check for dealer Ace (insurance)
        if (dealerCard1?.rank === "A" && state.balance >= state.currentBet / 2) {
          return {
            ...state,
            deck: newDeck,
            dealerHand: newDealerHand,
            gameState: "playing",
            dealingPhase: "done",
            message: "Insurance?",
          };
        }

        // Check for player blackjack (instant)
        if (pVal === 21) {
          const newPlayerHands = playerHands.map(h => ({
            ...h,
            isFinished: true,
            status: "blackjack" as const,
          }));
          return {
            ...state,
            deck: newDeck,
            playerHands: newPlayerHands,
            dealerHand: newDealerHand.map(c => ({ ...c, isHidden: false })),
            gameState: "gameOver",
            balance: state.balance + state.currentBet * 2.5,
            currentBet: 0,
            message: "Blackjack! You win!",
            dealingPhase: "done",
          };
        }

        return {
          ...state,
          deck: newDeck,
          dealerHand: newDealerHand,
          gameState: "playing",
          dealingPhase: "done",
          message: "",
        };
      }

      return state;
    }

    case "HIT": {
      const newDeck = [...state.deck];
      const card = newDeck.pop()!;
      const hands = [...state.playerHands];
      const currentHand = hands[state.currentHandIndex];
      
      currentHand.cards = [...currentHand.cards, card];
      const pVal = calculateHandValue(currentHand.cards).total;
      
      if (pVal > 21) {
        currentHand.isFinished = true;
        currentHand.status = "bust";
        
        if (state.currentHandIndex === hands.length - 1) {
          // All hands finished
          return {
            ...state,
            deck: newDeck,
            playerHands: hands,
            gameState: "gameOver",
            dealerHand: state.dealerHand.map(c => ({...c, isHidden: false})),
            currentBet: 0,
            message: "Bust!",
          };
        } else {
          return {
            ...state,
            deck: newDeck,
            playerHands: hands,
            currentHandIndex: state.currentHandIndex + 1,
          };
        }
      }

      return {
        ...state,
        deck: newDeck,
        playerHands: hands,
      };
    }

    case "STAND": {
      const hands = [...state.playerHands];
      hands[state.currentHandIndex].isFinished = true;

      if (state.currentHandIndex === hands.length - 1) {
        // Player is done — mark ready, reveal dealer's hole card, start drawing
        const revealedDealerHand = state.dealerHand.map(c => ({ ...c, isHidden: false }));
        return {
          ...state,
          playerHands: hands,
          playerReady: true,
          dealerHand: revealedDealerHand,
          gameState: "dealerDrawing",
        };
      } else {
        return {
          ...state,
          playerHands: hands,
          currentHandIndex: state.currentHandIndex + 1,
        };
      }
    }

    case "DOUBLE_DOWN": {
      const hands = [...state.playerHands];
      const currentHand = hands[state.currentHandIndex];
      
      if (state.balance < currentHand.bet) return state;

      const newDeck = [...state.deck];
      const card = newDeck.pop()!;
      
      currentHand.cards = [...currentHand.cards, card];
      currentHand.isFinished = true;
      
      const newBalance = state.balance - currentHand.bet;
      currentHand.bet *= 2;
      
      const pVal = calculateHandValue(currentHand.cards).total;
      if (pVal > 21) {
        currentHand.status = "bust";
      }

if (state.currentHandIndex === hands.length - 1) {
        const revealedDealerHand = state.dealerHand.map(c => ({...c, isHidden: false}));
        return {
          ...state,
          balance: newBalance,
          deck: newDeck,
          playerHands: hands,
          playerReady: true,
          gameState: pVal > 21 ? "gameOver" : "dealerDrawing",
          dealerHand: revealedDealerHand,
          currentBet: pVal > 21 ? 0 : state.currentBet,
          message: pVal > 21 ? "Bust!" : "",
        };
      } else {
        return {
          ...state,
          balance: newBalance,
          deck: newDeck,
          playerHands: hands,
          currentHandIndex: state.currentHandIndex + 1,
        };
      }
    }

    case "SPLIT": {
      const hands = [...state.playerHands];
      const currentHand = hands[state.currentHandIndex];
      
      if (currentHand.cards.length !== 2 || currentHand.cards[0].rank !== currentHand.cards[1].rank || state.balance < currentHand.bet) return state;

      const newDeck = [...state.deck];
      const card1 = newDeck.pop()!;
      const card2 = newDeck.pop()!;

      const newHand1: Hand = {
        id: `hand-${Math.random()}`,
        cards: [currentHand.cards[0], card1],
        bet: currentHand.bet,
        isFinished: false,
      };

      const newHand2: Hand = {
        id: `hand-${Math.random()}`,
        cards: [currentHand.cards[1], card2],
        bet: currentHand.bet,
        isFinished: false,
      };

      hands.splice(state.currentHandIndex, 1, newHand1, newHand2);

      return {
        ...state,
        balance: state.balance - currentHand.bet,
        deck: newDeck,
        playerHands: hands,
      };
    }

    case "INSURANCE": {
      const insBet = state.currentBet / 2;
      if (state.balance < insBet) return state;

      let dealerVal = calculateHandValue([{...state.dealerHand[0], isHidden: false}, {...state.dealerHand[1], isHidden: false}]).total;
      
      if (dealerVal === 21) {
        // Dealer has blackjack, player wins insurance, loses bet (unless player has blackjack, but we checked that on deal)
        return {
          ...state,
          balance: state.balance - insBet + (insBet * 3), // returned ins bet + 2:1 payout
          insuranceBet: insBet,
          gameState: "gameOver",
          dealerHand: state.dealerHand.map(c => ({...c, isHidden: false})),
          currentBet: 0,
          message: "Dealer Blackjack! Insurance pays.",
        };
      }

      return {
        ...state,
        balance: state.balance - insBet,
        insuranceBet: insBet,
        message: "",
      };
    }

    case "DECLINE_INSURANCE": {
       let dealerVal = calculateHandValue([{...state.dealerHand[0], isHidden: false}, {...state.dealerHand[1], isHidden: false}]).total;
      
       if (dealerVal === 21) {
        return {
          ...state,
          gameState: "gameOver",
          dealerHand: state.dealerHand.map(c => ({...c, isHidden: false})),
          currentBet: 0,
          message: "Dealer Blackjack!",
        };
       }
       return {
         ...state,
         message: "",
       };
    }

    case "DEALER_RESOLVE": {
      let dealerHand = state.dealerHand.map(c => ({...c, isHidden: false}));
      let newDeck = [...state.deck];
      
      // Only play if player hasn't busted all hands
      const allBust = state.playerHands.every(h => calculateHandValue(h.cards).total > 21);
      
      if (!allBust) {
        let dVal = calculateHandValue(dealerHand).total;
        let dSoft = calculateHandValue(dealerHand).soft;
        
        while (dVal < 17 || (dVal === 17 && dSoft)) {
          dealerHand.push(newDeck.pop()!);
          const calc = calculateHandValue(dealerHand);
          dVal = calc.total;
          dSoft = calc.soft;
        }
      }

      const finalDealerVal = calculateHandValue(dealerHand).total;
      let newBalance = state.balance;
      const finalHands = [...state.playerHands];

      for (const hand of finalHands) {
        const pVal = calculateHandValue(hand.cards).total;
        if (pVal > 21) {
          hand.status = "bust";
        } else if (finalDealerVal > 21 || pVal > finalDealerVal) {
          hand.status = "win";
          newBalance += hand.bet * 2;
        } else if (pVal === finalDealerVal) {
          hand.status = "push";
          newBalance += hand.bet;
        } else {
          hand.status = "loss";
        }
      }

      let msg = "Round Over";
      if (finalHands.length === 1) {
        if (finalHands[0].status === "win") msg = "You Win!";
        else if (finalHands[0].status === "loss") msg = "You Lose";
        else if (finalHands[0].status === "push") msg = "Push";
        else if (finalHands[0].status === "bust") msg = "Bust!";
      }

      return {
        ...state,
        deck: newDeck,
        dealerHand,
        playerHands: finalHands,
        balance: newBalance,
        gameState: "gameOver",
        currentBet: 0,
        message: msg,
      };
    }

    case "DEALER_DRAW_NEXT": {
      const allBust = state.playerHands.every(h => calculateHandValue(h.cards).total > 21);
      if (allBust) {
        return { ...state, dealerReady: true, gameState: "dealerResolving" };
      }

      let dealerHand = [...state.dealerHand];
      let newDeck = [...state.deck];
      dealerHand.push(newDeck.pop()!);

      const dVal = calculateHandValue(dealerHand).total;
      const dSoft = calculateHandValue(dealerHand).soft;

      // Check if dealer needs to draw more
      if (dVal < 17 || (dVal === 17 && dSoft)) {
        return {
          ...state,
          deck: newDeck,
          dealerHand,
          gameState: "dealerDrawing",
        };
      }

      // Dealer is done drawing — mark ready and resolve
      return {
        ...state,
        deck: newDeck,
        dealerHand,
        dealerReady: true,
        gameState: "dealerResolving",
      };
    }

    default:
      return state;
  }
}

export function useBlackjack() {
  const [state, dispatch] = useReducer(gameReducer, null, (): GameContext => {
    const savedBalance = localStorage.getItem("blackjack_balance");
    const initialBalance = savedBalance ? parseInt(savedBalance) : 1000;
    return {
      deck: createDeck(6),
      dealerHand: [],
      playerHands: [],
      currentHandIndex: 0,
      balance: initialBalance,
      currentBet: 0,
      gameState: "betting",
      insuranceBet: 0,
      message: "",
      dealingPhase: "done",
      playerReady: false,
      dealerReady: false,
    };
  });

  // Shuffle on mount (when entering game route)
  useEffect(() => {
    dispatch({ type: "SHUFFLE" });
  }, []);

  useEffect(() => {
    localStorage.setItem("blackjack_balance", state.balance.toString());
  }, [state.balance]);

  // Drive progressive dealing
  useEffect(() => {
    if (state.gameState === "dealing" && state.dealingPhase !== "done") {
      const delay = 380;
      const timer = setTimeout(() => {
        dispatch({ type: "DEAL_NEXT_CARD" });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.dealingPhase]);

  // Drive dealer drawing one card at a time
  useEffect(() => {
    if (state.gameState === "dealerDrawing") {
      const delay = 400 + Math.random() * 500;
      const timer = setTimeout(() => {
        dispatch({ type: "DEALER_DRAW_NEXT" });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.dealerHand.length]);

  // Resolve after dealer finishes
  useEffect(() => {
    if (state.gameState === "dealerResolving") {
      const timer = setTimeout(() => {
        dispatch({ type: "DEALER_RESOLVE" });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [state.gameState]);

  // Auto-trigger dealer drawing when dealing is done (without affecting player ready)
  useEffect(() => {
    if (state.gameState === "playing" && state.dealingPhase === "done" && !state.dealerReady) {
      const delay = 2500; // Give player time to decide on Hit/Stand
      const timer = setTimeout(() => {
        // Reveal dealer's hole card and start drawing (independent of player)
        dispatch({ type: "DEALER_DRAW_NEXT" });
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.dealingPhase, state.dealerReady]);

  // Resolve game when both player and dealer are ready
  useEffect(() => {
    if (state.gameState === "dealerDrawing" && state.playerReady && state.dealerReady) {
      const timer = setTimeout(() => {
        dispatch({ type: "DEALER_RESOLVE" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, state.playerReady, state.dealerReady]);

  return {
    state,
    dispatch,
  };
}
