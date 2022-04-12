import { Link, Typography } from "@mui/material";
import { ORGA_EMAIL } from "~/constants";
import { useTranslation } from "~/hooks/useTranslation";
import * as i18n from "~/i18n";

export default function RegistrationSuccessful() {
  const t = useTranslation();

  return (
    <div>
      <Typography gutterBottom variant="h3" component="h1">
        {t(i18n.successTitle)}
      </Typography>
      <Typography variant="body1" component="p">
        {t(i18n.successMessage)}{" "}
        <Link href={`mailto:${ORGA_EMAIL}`}>{ORGA_EMAIL}</Link>.
      </Typography>
    </div>
  );
}
