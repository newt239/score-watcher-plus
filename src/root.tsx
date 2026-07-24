import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import { NuqsAdapter } from "nuqs/adapters/react-router/v8";
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import { theme } from "@/utils/theme";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import "./globals.css";

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja" {...mantineHtmlProps}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#28a745" />
        <link rel="manifest" href="/manifest.json" />
        <ColorSchemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        <NuqsAdapter>
          <MantineProvider theme={theme}>
            <ModalsProvider>{children}</ModalsProvider>
            <Notifications />
          </MantineProvider>
        </NuqsAdapter>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
};

const App = () => {
  return <Outlet />;
};

export default App;
