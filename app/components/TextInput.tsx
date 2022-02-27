export interface TextInputProps {
  label: string;
  name: string;
  autoComplete?: string;
}

export function TextInput(props: TextInputProps) {
  return (
    <div className="form-group">
      <label htmlFor={props.name}>{props.label}</label>
      <input
        type="text"
        name={props.name}
        className="form-control"
        autoComplete={props.autoComplete}
      />
    </div>
  );
}
