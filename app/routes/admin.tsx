import { Outlet } from "remix";
import styles from "bootstrap/dist/css/bootstrap.css";

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export default function Admin() {
  return (
    <div className="container">
      <div className="mb-4"></div>
      <Outlet />
    </div>
  );
}
