import { LoaderFunction, redirect } from "remix";

export let loader: LoaderFunction = async ({ request }) => {
  return redirect("/p");
};

export default function Index() {
  return null;
}
