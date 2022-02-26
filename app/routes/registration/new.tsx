import {
  ActionFunction,
  json,
  LoaderFunction,
  redirect,
  useLoaderData,
} from "remix";
import { getPersons, Person } from "~/state";

const badRequest = () => json({}, { status: 400 });

export const action: ActionFunction = async ({ context, request }) => {
  const formData = await request.formData();
  if (formData.get("delete")) {
    const personId = formData.get("personId");
    if (typeof personId !== "string") {
      return badRequest();
    }

    await context.app.deletePerson(personId);
  } else {
    const name = formData.get("name");

    if (typeof name !== "string") {
      return badRequest();
    }

    await context.app.registerPerson(name);
  }

  return redirect("/registration/new");
};

export const loader: LoaderFunction = async () => {
  return getPersons();
};

export default function NewProject() {
  const persons = useLoaderData();

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Register</h1>
      <form method="post">
        <div>
          <label>
            Name: <input type="text" name="name" />
          </label>
        </div>
        <div>
          <button type="submit">Register</button>
        </div>
      </form>
      <ul>
        {persons.map((person: Person) => (
          <li key={person.id}>
            {person.name}
            <form method="post">
              <input type="hidden" name="personId" value={person.id} />
              <input type="submit" name="delete" value="Delete" />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
