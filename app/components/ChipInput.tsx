import { Chip } from "@mui/material";

interface ChipInputProps<T> {
  currentValue: T;
  value: T;
  label: string;
  onClick: (value: T) => void;
}

export function ChipInput<T>(props: ChipInputProps<T>) {
  const selected = props.value === props.currentValue;

  return (
    <Chip
      label={props.label}
      variant={selected ? "filled" : "outlined"}
      color={selected ? "primary" : undefined}
      onClick={() => {
        props.onClick(props.value);
      }}
    />
  );
}
