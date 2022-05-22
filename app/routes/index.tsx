import { LoaderFunction, redirect } from "@remix-run/node";

export let loader: LoaderFunction = async ({ request }) => {
  return redirect("/p");
};

export default function Index() {
  return null;
}
