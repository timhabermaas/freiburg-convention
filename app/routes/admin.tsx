import {
  AppBar,
  Box,
  Button,
  Container,
  createTheme,
  CssBaseline,
  ThemeProvider,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link, Outlet, useLoaderData } from "@remix-run/react";
import { LoaderFunction } from "@remix-run/node";
import { CONFIG } from "~/config.server";
import { getUser } from "~/session";
import { useEventConfig } from "~/hooks/useEventConfig";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
    },
  ];
}

interface LoaderData {
  user: "admin" | undefined;
  printAccessKey: string | undefined;
  statsAccessKey: string | undefined;
}

export const loader: LoaderFunction = async ({ request }) => {
  const data: LoaderData = {
    user: await getUser(request),
    printAccessKey: CONFIG.printAccessKey,
    statsAccessKey: CONFIG.statsAccessKey,
  };

  return data;
};

const theme = createTheme();

export default function Admin() {
  const data = useLoaderData<LoaderData>();

  const eventConfig = useEventConfig();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {eventConfig.name.de}
          </Typography>
          {data.user === "admin" && (
            <Box sx={{ flexGrow: 1, display: { md: "flex" } }}>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                component={Link}
                to={"/admin/registrations"}
              >
                Anmeldungen
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                component={Link}
                to={"/admin/participants"}
              >
                Teilnehmer*innen
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                component={Link}
                to={`/admin/print?accessKey=${data.printAccessKey}`}
              >
                Print
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                component={Link}
                to={"/admin/events"}
              >
                Events
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                component={Link}
                to={`/admin/stats?accessKey=${data.statsAccessKey}`}
              >
                Stats
              </Button>
              <Button
                sx={{ my: 2, color: "white", display: "block" }}
                component={Link}
                to={"/admin/email"}
              >
                Emails
              </Button>
            </Box>
          )}

          {data.user !== undefined && (
            <Box sx={{ flexGrow: 0 }}>
              <form
                className="form-inline my-2 my-lg-0"
                action="/admin/logout"
                method="post"
              >
                <Button color="inherit" type="submit">
                  Logout
                </Button>
              </form>
            </Box>
          )}
          {data.user === undefined && (
            <Box sx={{ flexGrow: 0 }}>
              <Button
                color="inherit"
                type="submit"
                component={Link}
                to={"/admin/login"}
              >
                Login
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>
      <Container component="main">
        <Outlet />
      </Container>
    </ThemeProvider>
  );
}
