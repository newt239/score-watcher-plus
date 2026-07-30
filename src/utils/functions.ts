import type { GamePropsUnion, States } from "@/utils/types";

export const numberSign = (type: "correct" | "wrong" | "pt", score?: number) => {
  const showSignString = localStorage.getItem("scorew-show-sign-string");
  const wrongNumber = localStorage.getItem("scorew-wrong-number");
  if (typeof score === "undefined") {
    switch (type) {
      case "correct":
        return "○";
      case "wrong":
        return "✕";
      case "pt":
        return "pt";
    }
  } else if (showSignString === "true" || showSignString === null) {
    switch (type) {
      case "correct":
        return `${score}○`;
      case "wrong":
        if (wrongNumber === "true") {
          if (score === 0) {
            return "・";
          } else if (0 < score && score < 5) {
            return "✕".repeat(score);
          } else {
            return `${score}✕`;
          }
        } else {
          return `${score}✕`;
        }
      case "pt":
        return `${score}pt`;
    }
  } else {
    if (type === "wrong" && wrongNumber === "true") {
      if (score === 0) {
        return "・";
      } else if (0 < score && score < 5) {
        return "✕".repeat(score);
      } else {
        return `${score}✕`;
      }
    } else {
      return score.toString();
    }
  }
};

export const str2num = (str: unknown): number => {
  if (typeof str === "number") {
    return str;
  }
  if (typeof str === "string") {
    const x = parseInt(str);
    return Number.isNaN(x) ? 0 : x;
  }
  return 0;
};

export const zenkaku2Hankaku = (str: string) => {
  return str.replace(/[A-Za-z0-9]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
  });
};

export const detectPlayerState = (
  game: GamePropsUnion,
  state: States,
  order: number,
  qn: number
): States => {
  if (state === "win") return "win";
  if (game.limit && game.win_through) {
    if (game.limit <= qn) {
      if (order < game.win_through) {
        return "win";
      } else {
        return "lose";
      }
    }
  }
  return state;
};

export const isDesktop = () => {
  return window.innerWidth > 1024;
};
