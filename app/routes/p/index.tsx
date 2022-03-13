import { LoaderFunction, Outlet, redirect } from "remix";

export let loader: LoaderFunction = async ({ request }) => {
  return redirect("/p/de/registration/new");
};

export default function Index() {
  return null;
}
