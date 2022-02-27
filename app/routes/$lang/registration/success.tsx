import { ORGA_EMAIL } from "~/constants";
import { useTranslation } from "~/hooks/useTranslation";

export default function RegistrationSuccessful() {
  const t = useTranslation();
  /*
  row $ do
    colMd 12 $ do
      H.h1 "Danke für deine Anmeldung!" ! A.class_ "text-center"
      H.p ! A.class_ "text-center" $ do
        "Du solltest in Kürze eine E-Mail von uns erhalten. Falls nicht, melde dich bitte unter "
        mailLink "orga@jonglieren-in-freiburg.de" "orga@jonglieren-in-freiburg.de"
        "."
        */

  return (
    <div className="row">
      <div className="col-md-12">
        <h1 className="text-center">{t("successTitle")}</h1>
        <p className="text-center">
          {t("successMessage")}{" "}
          <a href={`mailto:${ORGA_EMAIL}`}>{ORGA_EMAIL}</a>.
        </p>
      </div>
    </div>
  );
}
