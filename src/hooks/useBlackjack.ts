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

export type GameState = "betting" | "playing" | "dealerTurn" | "gameOver";

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
  | { type: "HIT" }
  | { type: "STAND" }
  | { type: "DOUBLE_DOWN" }
  | { type: "SPLIT" }
  | { type: "INSURANCE" }
  | { type: "DECLINE_INSURANCE" }
  | { type: "RESTART" }
  | { type: "NEW_ROUND" }
  | { type: "DEALER_PLAY" };

function gameReducer(state: GameContext, action: Action): GameContext {
  switch (action.type) {
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
        deck: createDeck(6)
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

      const playerCard1 = newDeck.pop()!;
      const dealerCard1 = newDeck.pop()!;
      const playerCard2 = newDeck.pop()!;
      const dealerCard2 = { ...newDeck.pop()!, isHidden: true };

      const playerHand: Hand = {
        id: "hand-1",
        cards: [playerCard1, playerCard2],
        bet: state.currentBet,
        isFinished: false,
      };

      const pVal = calculateHandValue(playerHand.cards).total;
      
      // Check for dealer Ace
      if (dealerCard1.rank === "A" && state.balance >= state.currentBet / 2) {
        return {
          ...state,
          deck: newDeck,
          playerHands: [playerHand],
          dealerHand: [dealerCard1, dealerCard2],
          gameState: "playing", // Prompt for insurance
          message: "Insurance?",
        };
      }

      if (pVal === 21) {
        // Player blackjack
        playerHand.isFinished = true;
        playerHand.status = "blackjack";
        return {
          ...state,
          deck: newDeck,
          playerHands: [playerHand],
          dealerHand: [dealerCard1, { ...dealerCard2, isHidden: false }],
          gameState: "gameOver",
          balance: state.balance + state.currentBet * 2.5,
          currentBet: 0,
          message: "Blackjack! You win!",
        };
      }

      return {
        ...state,
        deck: newDeck,
        playerHands: [playerHand],
        dealerHand: [dealerCard1, dealerCard2],
        gameState: "playing",
        message: "",
      };
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
        return {
          ...state,
          playerHands: hands,
          gameState: "dealerTurn",
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
        return {
          ...state,
          balance: newBalance,
          deck: newDeck,
          playerHands: hands,
          gameState: pVal > 21 ? "gameOver" : "dealerTurn",
          dealerHand: pVal > 21 ? state.dealerHand.map(c => ({...c, isHidden: false})) : state.dealerHand,
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

    case "DEALER_PLAY": {
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
    };
  });

  useEffect(() => {
    localStorage.setItem("blackjack_balance", state.balance.toString());
  }, [state.balance]);

  useEffect(() => {
    if (state.gameState === "dealerTurn") {
      const timer = setTimeout(() => {
        dispatch({ type: "DEALER_PLAY" });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.gameState]);

  return {
    state,
    dispatch,
  };
}
