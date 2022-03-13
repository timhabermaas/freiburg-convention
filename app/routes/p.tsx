import { Outlet, useLocation, useParams } from "remix";
import { LanguageButton } from "~/components/LanguageButton";
import { LocaleContext } from "~/hooks/useLocale";
import { Languages, SupportedLocales } from "~/i18n";

export default function Public() {
  const { lang } = useParams();
  const location = useLocation();

  const currentLocale: SupportedLocales =
    lang === "de" ? "de" : lang === "en-US" ? "en-US" : "de";
  const locationWithoutLanguage = location.pathname.replace(/^\/p\/[^/]+/, "");

  return (
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
                  href={`/p/${locale}${locationWithoutLanguage}`}
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
  );
}
