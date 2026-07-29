import { ColorSchemeScript, mantineHtmlProps, MantineProvider, Title } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import TypekitLoader from "@/components/TypekitLoader";
import UpdateModal from "@/components/UpdateModal";
import { theme } from "@/utils/theme";

import type { Route } from "./+types/root";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import "./globals.css";

export const meta: Route.MetaFunction = () => [
  { title: "Score Watcher" },
  {
    name: "description",
    content: "競技クイズ用の得点表示ソフトです。プレイヤーの得点状況を可視化します。",
  },
  { property: "og:title", content: "Score Watcher" },
  {
    property: "og:description",
    content: "競技クイズ用の得点表示ソフトです。プレイヤーの得点状況を可視化します。",
  },
  { property: "og:site_name", content: "Score Watcher" },
  { property: "og:type", content: "website" },
  { property: "og:locale", content: "ja_JP" },
  { name: "twitter:site", content: "@newt239" },
  { name: "twitter:creator", content: "@newt239" },
];

export const links: Route.LinksFunction = () => [{ rel: "manifest", href: "/manifest.json" }];

const gtmId = import.meta.env.VITE_GTM_ID;
const gaId = import.meta.env.VITE_GA_ID;
const isAnalyticsEnabled = import.meta.env.PROD && Boolean(gtmId ?? gaId);

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#28a745" />
        <Meta />
        <Links />
        {isAnalyticsEnabled && gtmId && (
          <script
            // @next/third-parties の GoogleTagManager 相当
            dangerouslySetInnerHTML={{
              __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`,
            }}
          />
        )}
        {isAnalyticsEnabled && gaId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} />
            <script
              // @next/third-parties の GoogleAnalytics 相当
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
        <ColorSchemeScript />
      </head>
      <body>
        {isAnalyticsEnabled && gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            />
          </noscript>
        )}
        <NuqsAdapter>
          <MantineProvider theme={theme}>
            <ModalsProvider>
              {children}
              <UpdateModal />
            </ModalsProvider>
            <Notifications />
          </MantineProvider>
        </NuqsAdapter>
        <TypekitLoader />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  return <Outlet />;
};

export const ErrorBoundary = ({ error }: Route.ErrorBoundaryProps) => {
  if (isRouteErrorResponse(error)) {
    return (
      <Title order={1} ta="center" mt="xl">
        {error.status === 404 ? "ページが見つかりません" : "エラーが発生しました"}
      </Title>
    );
  }

  console.error(error);

  return (
    <Title order={1} ta="center" mt="xl">
      エラーが発生しました
    </Title>
  );
};

export default App;
