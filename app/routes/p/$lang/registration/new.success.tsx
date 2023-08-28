import { Button, Link, Typography } from "@mui/material";
import { useEventConfig } from "~/hooks/useEventConfig";
import { useTranslation } from "~/hooks/useTranslation";
import * as i18n from "~/i18n";

export default function RegistrationSuccessful() {
  const t = useTranslation();
  const eventConfig = useEventConfig();

  return (
    <div>
      <Typography gutterBottom variant="h3" component="h1">
        {t(i18n.successTitle)}
      </Typography>
      <Typography gutterBottom variant="body1" component="p">
        {t(i18n.successMessage)}{" "}
        <Link href={`mailto:${eventConfig.senderMailAddress}`}>
          {eventConfig.senderMailAddress}
        </Link>
        .
      </Typography>

      <Button
        component={Link}
        href={eventConfig.eventHomepage}
        target="_parent"
        variant="contained"
      >
        {t(i18n.backToOverview)}
      </Button>
    </div>
  );
}
