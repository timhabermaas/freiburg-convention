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
import { Link, Outlet } from "remix";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
    },
  ];
}

const theme = createTheme();

export default function Admin() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static" sx={{ mb: 2 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Freiburg 2022
          </Typography>
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
              to={"/admin/events"}
            >
              Events
            </Button>
          </Box>

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
        </Toolbar>
      </AppBar>
      <Container component="main">
        <Outlet />
      </Container>
    </ThemeProvider>
  );
}
