import { useEffect, useState } from "react";

interface RadioButtonGroupProps {
  name: string;
  label: string;
  options: { label: string; value: string }[];
  defaultValue?: string;
  onClick?: (selected: string | undefined) => void;
}

export function RadioButtonGroup(props: RadioButtonGroupProps) {
  const [selected, setSelected] = useState<undefined | string>(undefined);

  useEffect(() => {
    setSelected(props.defaultValue);
  }, [props.defaultValue]);

  return (
    <div className="form-group">
      <div className="btn-group btn-group-toggle">
        {props.options.map((option) => (
          <label
            key={option.value}
            className={`btn btn-outline-primary ${
              selected === option.value ? "active" : ""
            }`}
          >
            <input
              type="radio"
              name={props.name}
              value={option.value}
              checked={selected === option.value}
              readOnly
              onClick={() => {
                let newSelected;
                if (selected === option.value) {
                  newSelected = undefined;
                } else {
                  newSelected = option.value;
                }
                setSelected(newSelected);

                props.onClick && props.onClick(newSelected);
              }}
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}
