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
  useParams,
} from "remix";
import type { MetaFunction } from "remix";
import styles from "bootstrap/dist/css/bootstrap.css";
import { LanguageButton } from "~/components/LanguageButton";
import { Languages, LocaleContext, SupportedLocales } from "~/hooks/useLocale";

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
  const currentLocale: SupportedLocales =
    lang === "de" ? "de" : lang === "en-US" ? "en-US" : "de";
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
        <LocaleContext.Provider value={currentLocale}>
          <div className="container">
            <div className="mb-4"></div>
            <div className="row justify-content-end">
              <div className="col-2 text-right">
                <div className="btn-group btn-group-toggle">
                  {Languages.map(({ title, locale }) => (
                    <LanguageButton
                      key={locale}
                      title={title}
                      href={`/${locale}${locationWithoutLanguage}`}
                      active={locale === currentLocale}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-4"></div>
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
