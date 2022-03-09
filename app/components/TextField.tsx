export interface TextFieldProps {
  label: string;
  name: string;
}

export function TextField(props: TextFieldProps) {
  return (
    <div className="form-group">
      <label htmlFor={props.name}>{props.label}</label>
      <textarea name={props.name} className="form-control" />
    </div>
  );
}
