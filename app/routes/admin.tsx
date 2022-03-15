import { Container } from "@mui/material";
import { Outlet } from "remix";

export function links() {
  return [
    {
      href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      rel: "stylesheet",
    },
  ];
}

export default function Admin() {
  return (
    <Container>
      <Outlet />
    </Container>
  );
}
