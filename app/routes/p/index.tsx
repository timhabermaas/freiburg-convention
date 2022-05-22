import { LoaderFunction, redirect } from "@remix-run/node";

export let loader: LoaderFunction = async () => {
  return redirect("/p/de/registration/new");
};

export default function Index() {
  return null;
}
