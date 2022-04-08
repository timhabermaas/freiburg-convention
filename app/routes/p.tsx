import { Outlet, useLocation, useNavigate, useParams } from "remix";
import { LocaleContext } from "~/hooks/useLocale";
import { Languages, SupportedLocales } from "~/i18n";
import {
  Container,
  CssBaseline,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useMemo, useState } from "react";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
    },
  ];
}

export default function Public() {
  const { lang } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"light" | "dark">("light");

  const theme = useMemo(() => {
    return createTheme({ palette: { mode } });
  }, [mode]);

  const currentLocale: SupportedLocales =
    lang === "de" ? "de" : lang === "en-US" ? "en-US" : "de";
  const locationWithoutLanguage = location.pathname.replace(/^\/p\/[^/]+/, "");

  return (
    <ThemeProvider theme={theme}>
      <LocaleContext.Provider value={currentLocale}>
        <CssBaseline />

        <Container component="main" maxWidth="md" sx={{ mb: 4, mt: 2 }}>
          <Grid container justifyContent="space-between" sx={{ mb: 3 }}>
            <Grid item>
              <ToggleButtonGroup
                value={currentLocale}
                exclusive
                onChange={(_e, locale) => {
                  locale && navigate(`/p/${locale}${locationWithoutLanguage}`);
                }}
                aria-label="language switcher"
                size="small"
                color="primary"
              >
                {Languages.map(({ title, locale }) => (
                  <ToggleButton key={locale} value={locale} aria-label={title}>
                    {title}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Grid>
            <Grid item>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={(_e, newMode) => {
                  newMode && setMode(newMode);
                }}
                size="small"
                color="primary"
              >
                <ToggleButton value="light">
                  <Brightness7Icon />
                </ToggleButton>
                <ToggleButton value="dark">
                  <Brightness4Icon />
                </ToggleButton>
              </ToggleButtonGroup>
            </Grid>
          </Grid>
          <Outlet />
        </Container>
      </LocaleContext.Provider>
    </ThemeProvider>
  );
}
