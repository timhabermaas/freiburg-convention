import { Link } from "remix";

export interface NavigationProps {
  items: { href: string; title: string; active: boolean }[];
}

export function Navigation(props: NavigationProps) {
  return (
    <ul className="nav nav-pills">
      {props.items.map((item) => (
        <li className="nav-item">
          <Link
            className={`nav-link${item.active ? " active" : ""}`}
            to={item.href}
          >
            {item.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
