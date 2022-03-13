import { ValidateErrorMessage } from "./ValidateErrorMessage";

interface RadioGroupProps {
  name: string;
  label: string;
  options: { label: string; value: string }[];
  errorMessages?: string[];
  defaultValue?: string;
}

export function RadioGroup(props: RadioGroupProps) {
  const errorMessages = props.errorMessages ?? [];

  return (
    <div className={"form-group"}>
      <label>{props.label}</label>
      {props.options.map((option) => (
        <div
          key={option.value}
          className={`form-check ${
            errorMessages.length > 0 ? "is-invalid" : ""
          }`}
        >
          <label className="form-check-label">
            <input
              className="form-check-input"
              type="radio"
              name={props.name}
              value={option.value}
              defaultChecked={option.value === props.defaultValue}
            />
            {option.label}
          </label>
        </div>
      ))}
      {errorMessages.length > 0 ? (
        <ValidateErrorMessage text={errorMessages[0]} />
      ) : null}
    </div>
  );
}
