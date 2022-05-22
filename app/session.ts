import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { json } from "@remix-run/node";
import { CONFIG } from "./config.server";

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      secrets: [CONFIG.sessionSecret],
      sameSite: "strict",
    },
  });

export async function whenAuthorized<T>(
  request: Request,
  onAuthorized: () => T
): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.get("isLoggedIn") === true) {
    return json(await onAuthorized());
  } else {
    return redirect("/admin/login");
  }
}

export async function getUser(request: Request): Promise<"admin" | undefined> {
  const session = await getSession(request.headers.get("Cookie"));

  if (session.get("isLoggedIn") === true) {
    return "admin";
  } else {
    return undefined;
  }
}

export async function logout(request: Request): Promise<Response> {
  const session = await getSession(request.headers.get("Cookie"));

  session.unset("isLoggedIn");

  return redirect("/admin/login", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}
