import { useState, useReducer, useCallback } from "react";

export type BetType = "red" | "black" | "odd" | "even" | "number" | "range";

export interface RouletteNumber {
  number: number;
  color: "red" | "black" | "green";
}

export interface RouletteBet {
  type: BetType;
  value: number | string; // "red", "black", "odd", "even", or number
  amount: number;
}

export type RouletteGameState = "betting" | "spinning" | "gameOver";

export interface RouletteContext {
  balance: number;
  currentBet: number;
  gameState: RouletteGameState;
  bets: RouletteBet[];
  resultNumber: number | null;
  message: string;
  winAmount: number;
}

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const BLACK_NUMBERS = [2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35];

function getNumberColor(num: number): "red" | "black" | "green" {
  if (num === 0) return "green";
  return RED_NUMBERS.includes(num) ? "red" : "black";
}

type Action =
  | { type: "PLACE_BET"; betType: BetType; value: number | string; amount: number }
  | { type: "CLEAR_BETS" }
  | { type: "SPIN" }
  | { type: "SET_RESULT"; resultNumber: number }
  | { type: "RESOLVE" }
  | { type: "NEW_ROUND" }
  | { type: "RESTART" };

function rouletteReducer(state: RouletteContext, action: Action): RouletteContext {
  switch (action.type) {
    case "PLACE_BET": {
      if (state.balance < action.amount || action.amount <= 0) {
        return state;
      }
      const newBet: RouletteBet = {
        type: action.betType,
        value: action.value,
        amount: action.amount,
      };
      return {
        ...state,
        bets: [...state.bets, newBet],
        currentBet: state.currentBet + action.amount,
      };
    }

    case "CLEAR_BETS": {
      return {
        ...state,
        bets: [],
        currentBet: 0,
      };
    }

    case "SPIN": {
      if (state.currentBet === 0) return state;
      return {
        ...state,
        gameState: "spinning",
        resultNumber: null,
        message: "Spinning...",
      };
    }

    case "SET_RESULT": {
      return {
        ...state,
        resultNumber: action.resultNumber,
      };
    }

    case "RESOLVE": {
      if (state.resultNumber === null || state.bets.length === 0) {
        return state;
      }

      let totalWin = 0;
      const resultNum = state.resultNumber;
      const isRed = RED_NUMBERS.includes(resultNum);
      const isBlack = BLACK_NUMBERS.includes(resultNum);
      const isOdd = resultNum % 2 === 1;
      const isEven = resultNum % 2 === 0 && resultNum !== 0;

      for (const bet of state.bets) {
        let won = false;
        let payout = 0;

        switch (bet.type) {
          case "red":
            won = isRed;
            payout = won ? bet.amount * 2 : 0;
            break;
          case "black":
            won = isBlack;
            payout = won ? bet.amount * 2 : 0;
            break;
          case "odd":
            won = isOdd;
            payout = won ? bet.amount * 2 : 0;
            break;
          case "even":
            won = isEven;
            payout = won ? bet.amount * 2 : 0;
            break;
          case "number":
            won = parseInt(String(bet.value)) === resultNum;
            payout = won ? bet.amount * 36 : 0;
            break;
        }

        totalWin += payout;
      }

      const newBalance = state.balance - state.currentBet + totalWin;
      const isWin = totalWin > state.currentBet;

      return {
        ...state,
        gameState: "gameOver",
        balance: newBalance,
        winAmount: totalWin,
        message: isWin ? `You Win! +$${totalWin}` : `You Lose! -$${state.currentBet}`,
      };
    }

    case "NEW_ROUND": {
      return {
        ...state,
        gameState: "betting",
        bets: [],
        currentBet: 0,
        resultNumber: null,
        message: "",
        winAmount: 0,
      };
    }

    case "RESTART": {
      return {
        balance: 1000,
        currentBet: 0,
        gameState: "betting",
        bets: [],
        resultNumber: null,
        message: "",
        winAmount: 0,
      };
    }

    default:
      return state;
  }
}

export function useRoulette() {
  const [state, dispatch] = useReducer(rouletteReducer, {
    balance: 1000,
    currentBet: 0,
    gameState: "betting",
    bets: [],
    resultNumber: null,
    message: "",
    winAmount: 0,
  });

  const placeBet = useCallback(
    (betType: BetType, value: number | string, amount: number) => {
      dispatch({ type: "PLACE_BET", betType, value, amount });
    },
    []
  );

  const spin = useCallback(() => {
    dispatch({ type: "SPIN" });
  }, []);

  const setResult = useCallback((resultNumber: number) => {
    dispatch({ type: "SET_RESULT", resultNumber });
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

  const clearBets = useCallback(() => {
    dispatch({ type: "CLEAR_BETS" });
  }, []);

  return {
    state,
    placeBet,
    spin,
    setResult,
    resolve,
    newRound,
    restart,
    clearBets,
  };
}
