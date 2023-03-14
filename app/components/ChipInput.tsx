import { Chip } from "@mui/material";

interface ChipInputProps<T> {
  currentValue: T;
  value: T;
  label: string;
  onClick: (value: T) => void;
}

export function ChipInput<T>(props: ChipInputProps<T>) {
  return (
    <Chip
      label={props.label}
      variant={props.value === props.currentValue ? "filled" : "outlined"}
      color="primary"
      onClick={() => {
        props.onClick(props.value);
      }}
    />
  );
}
