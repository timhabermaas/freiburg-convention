import type { ActionFunction } from "@remix-run/node";
import { logout } from "~/session";

export const action: ActionFunction = async ({ request }) => {
  return await logout(request);
};

export default function Logout() {
  return null;
}
