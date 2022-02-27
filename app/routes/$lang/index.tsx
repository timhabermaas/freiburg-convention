import { Link } from "remix";

export default function Index() {
  return (
    <div style={{ fontFamily: "system-ui, sans-serif", lineHeight: "1.4" }}>
      <h1>Welcome to Remix</h1>
      <ul>
        <li>
          <Link to="registration/new">Registrieren</Link>
        </li>
        <li>
          <Link to="/admin/events">Events</Link>
        </li>
      </ul>
    </div>
  );
}
