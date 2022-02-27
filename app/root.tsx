import {
  Links,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useParams,
} from "remix";
import type { MetaFunction } from "remix";
import { LocaleContext, SupportedLanguages } from "./contexts/LocaleContext";

export const meta: MetaFunction = () => {
  return { title: "New Remix App" };
};

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://stackpath.bootstrapcdn.com/bootstrap/4.1.2/css/bootstrap.min.css",
    },
  ];
}

export let loader: LoaderFunction = async ({ request }) => {
  if (new URL(request.url).pathname === "/") {
    return redirect("/de");
  } else {
    return null;
  }
};

export default function App() {
  let { lang } = useParams();
  let locale: SupportedLanguages =
    lang === "de" ? "de" : lang === "en" ? "en" : "de";

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="container">
          <LocaleContext.Provider value={locale}>
            <Outlet />
          </LocaleContext.Provider>
        </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
