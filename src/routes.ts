import { index, layout, prefix, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  // 全画面レイアウト（旧 (board) グループ）。共通ヘッダーを持たない
  route("games/:game_id/board", "routes/board/board/route.tsx"),
  route("viewer/:game_id", "routes/board/viewer/route.tsx"),

  // 通常レイアウト（旧 (default) グループ）
  layout("routes/default/layout.tsx", [
    index("routes/default/route.tsx"),
    route("sign-in", "routes/default/sign-in/route.tsx"),
    route("rules", "routes/default/rules/route.tsx"),
    ...prefix("docs", [
      index("routes/default/docs/route.tsx"),
      route("for_commercial_use", "routes/default/docs/for_commercial_use/route.tsx"),
      route("privacy_policy", "routes/default/docs/privacy_policy/route.tsx"),
      route("terms_of_service", "routes/default/docs/terms_of_service/route.tsx"),
    ]),

    // 認証必須（旧 (authed) グループ）。layoutのmiddlewareでガードする
    layout("routes/default/authed/layout.tsx", [
      ...prefix("games", [
        index("routes/default/authed/games/route.tsx"),
        route(":game_id/config", "routes/default/authed/games/config/layout.tsx", [
          index("routes/default/authed/games/config/route.tsx"),
          route("rule", "routes/default/authed/games/config/rule/route.tsx"),
          route("player", "routes/default/authed/games/config/player/route.tsx"),
          route("other", "routes/default/authed/games/config/other/route.tsx"),
        ]),
      ]),
      route("players", "routes/default/authed/players/route.tsx"),
      route("quizes", "routes/default/authed/quizes/route.tsx"),
      ...prefix("user", [
        index("routes/default/authed/user/route.tsx"),
        route("plan", "routes/default/authed/user/plan/route.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
