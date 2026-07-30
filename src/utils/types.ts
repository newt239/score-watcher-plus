export type RuleNames =
  | "normal"
  | "nomx"
  | "nomx-ad"
  | "ny"
  | "nomr"
  | "nbyn"
  | "nupdown"
  | "divide"
  | "swedish10"
  | "backstream"
  | "attacksurvival"
  | "squarex"
  | "z"
  | "freezex"
  | "endless-chance"
  | "variables"
  | "aql"
  | "attack25";

export type GameDBPlayerProps = {
  id: string;
  name: string;
  initial_correct: number;
  initial_wrong: number;
  base_correct_point: number;
  base_wrong_point: number;
};

export type GameDBQuizProps = {
  set_name: string;
  offset: number;
};

export type GameOptionProps = {
  [key in Exclude<RuleNames, "nomx-ad" | "endless-chance" | "aql" | "attack25">]: undefined;
} & {
  "nomx-ad": {
    streak_over3: boolean;
  };
  "endless-chance": {
    use_r: boolean;
  };
  aql: {
    left_team: string;
    right_team: string;
  };
  attack25: {
    attack_chance: boolean;
  };
};

export type AllGameProps = {
  [T in RuleNames]: {
    id: string;
    name: string;
    players: GameDBPlayerProps[];
    rule: T;
    correct_me: number;
    wrong_me: number;
    correct_other?: number;
    wrong_other?: number;
    win_point?: number;
    lose_point?: number;
    win_through?: number;
    limit?: number;
    quiz?: GameDBQuizProps;
    discord_webhook_url: string;
    options: GameOptionProps[T];
    editable: boolean;
    last_open: string;
  };
};

export type GamePropsUnion = AllGameProps[RuleNames];

export type PlayerDBProps = {
  id: string;
  name: string;
  text: string;
  belong: string;
  tags: string[];
};

export type States = "win" | "lose" | "playing";

export type QuizDBProps = {
  id: string;
  n: number;
  q: string;
  a: string;
  set_name: string;
};
