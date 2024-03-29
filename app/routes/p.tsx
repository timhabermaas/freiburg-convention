import { Link, Outlet, useLocation, useParams } from "@remix-run/react";
import { LocaleContext } from "~/hooks/useLocale";
import { Languages, SupportedLocales } from "~/i18n";
import {
  Container,
  CssBaseline,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  useMediaQuery,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useEffect, useMemo, useState } from "react";
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

  const [mode, setMode] = useState<"light" | "dark">("light");

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode]);

  const theme = useMemo(() => {
    return createTheme({
      palette: { mode },
      components: {
        // Fixes the unreadable text boxes on Safari when using autofill.
        MuiTextField: {
          styleOverrides: {
            root: {
              input: {
                "&:-webkit-autofill": {
                  WebkitBoxShadow: "0 0 0 100px #E0D98C inset",
                  WebkitTextFillColor: "default",
                  backgroundColor: "#fafafa",
                  backgroundClip: "content-box",
                },
              },
            },
          },
        },
      },
    });
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
                aria-label="language switcher"
                size="small"
                color="primary"
              >
                {Languages.map(({ title, locale }) => (
                  <ToggleButton
                    component={Link}
                    to={`/p/${locale}${locationWithoutLanguage}`}
                    key={locale}
                    value={locale}
                    aria-label={title}
                  >
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
