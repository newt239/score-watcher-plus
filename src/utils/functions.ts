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

export const zenkaku2Hankaku = (str: string) => {
  return str.replace(/[A-Za-z0-9]/g, function (s) {
    return String.fromCharCode(s.charCodeAt(0) + 0xfee0);
  });
};
