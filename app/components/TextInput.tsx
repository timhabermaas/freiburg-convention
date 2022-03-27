import { ValidateErrorMessage } from "./ValidateErrorMessage";

export interface TextInputProps {
  label: string;
  name: string;
  defaultValue?: string;
  autoComplete?: string;
  hidden?: boolean;
  errorMessages?: string[];
  isPassword?: boolean;
}

export function TextInput(props: TextInputProps) {
  const errorMessages = props.errorMessages ?? [];

  return (
    <div className={`form-group ${props.hidden ? "d-none" : ""}`}>
      <label htmlFor={props.name}>{props.label}</label>
      <input
        type={props.isPassword ? "password" : "text"}
        name={props.name}
        className={`form-control${
          errorMessages.length > 0 ? " is-invalid" : ""
        }`}
        autoComplete={props.autoComplete}
        defaultValue={props.defaultValue}
      />
      {errorMessages.length > 0 ? (
        <ValidateErrorMessage text={errorMessages[0]} />
      ) : null}
    </div>
  );
}
