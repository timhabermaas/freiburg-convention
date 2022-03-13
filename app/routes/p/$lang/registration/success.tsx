import { ORGA_EMAIL } from "~/constants";
import { useTranslation } from "~/hooks/useTranslation";

export default function RegistrationSuccessful() {
  const t = useTranslation();

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