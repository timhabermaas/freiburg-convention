interface ValidateErrorMessageProps {
  text: string;
}

export function ValidateErrorMessage(props: ValidateErrorMessageProps) {
  return <div className="invalid-feedback">{props.text}</div>;
}
