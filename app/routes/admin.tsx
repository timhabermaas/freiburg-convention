import { Link, Outlet } from "remix";
import styles from "bootstrap/dist/css/bootstrap.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export default function Admin() {
  return (
    <div>
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <a className="navbar-brand" href="#">
          Admin
        </a>

        <div className="collapse navbar-collapse">
          <ul className="navbar-nav mr-auto">
            <li className="nav-item active">
              <Link className="nav-link" to="/admin/registrations">
                Anmeldungen
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/admin/participants">
                Teilnehmer*innen
              </Link>
            </li>
          </ul>
          <form
            className="form-inline my-2 my-lg-0"
            action="/admin/logout"
            method="post"
          >
            <button
              className="btn btn-outline-success my-2 my-sm-0"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      </nav>
      <div className="container">
        <div className="mb-4"></div>
        <Outlet />
      </div>
    </div>
  );
}
