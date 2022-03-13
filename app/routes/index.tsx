import { LoaderFunction, redirect } from "remix";

export let loader: LoaderFunction = async ({ request }) => {
  if (new URL(request.url).pathname === "/") {
    return redirect("/p");
  } else {
    return null;
  }
};

export default function Index() {
  return null;
}
