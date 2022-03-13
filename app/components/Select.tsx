interface SelectProps {
  name: string;
  label: string;
  defaultValue?: string;
  options: { label: string; value: string }[];
}

export function Select(props: SelectProps) {
  return (
    <div className="form-group">
      <label>{props.label}</label>
      <select
        name={props.name}
        className="form-control"
        defaultValue={props.defaultValue}
      >
        {props.options.map((option) => (
          <option value={option.value} key={option.label}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
