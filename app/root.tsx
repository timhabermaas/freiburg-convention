import {
  Links,
  LiveReload,
  LoaderFunction,
  Meta,
  Outlet,
  redirect,
  Scripts,
  ScrollRestoration,
  useLocation,
  useNavigate,
  useParams,
} from "remix";
import type { MetaFunction } from "remix";
import { LocaleContext, SupportedLanguages } from "./contexts/LocaleContext";
import styles from "bootstrap/dist/css/bootstrap.css";
import { LanguageButton } from "./components/LanguageButton";

export const meta: MetaFunction = () => {
  return { title: "Freiburger Convention 2022" };
};

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export let loader: LoaderFunction = async ({ request }) => {
  if (new URL(request.url).pathname === "/") {
    return redirect("/de");
  } else {
    return null;
  }
};

export default function App() {
  const { lang } = useParams();
  const locale: SupportedLanguages =
    lang === "de" ? "de" : lang === "en" ? "en" : "de";
  const location = useLocation();
  const locationWithoutLanguage = location.pathname.replace(/^\/[^/]+/, "");

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <LocaleContext.Provider value={locale}>
          <div className="container">
            <div className="mb-4"></div>
            <div className="row justify-content-end">
              <div className="col-2 text-right">
                <div className="btn-group btn-group-toggle">
                  <LanguageButton
                    title="DE"
                    href={`/de${locationWithoutLanguage}`}
                    active={locale === "de"}
                  />
                  <LanguageButton
                    title="EN"
                    href={`/en${locationWithoutLanguage}`}
                    active={locale === "en"}
                  />
                </div>
              </div>
            </div>
            <Outlet />
          </div>
        </LocaleContext.Provider>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
