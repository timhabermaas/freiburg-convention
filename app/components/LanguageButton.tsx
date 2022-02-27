import { Link } from "remix";

interface LanguageButtonProps {
  title: string;
  href: string;
  active?: boolean;
}

export function LanguageButton(props: LanguageButtonProps) {
  return (
    <Link
      className={`btn btn-outline-primary btn-sm ${
        props.active ? "active" : ""
      }`}
      to={props.href}
    >
      <small>{props.title}</small>
    </Link>
  );
}
