import { Chip } from "@mui/material";
import FaceIcon from "@mui/icons-material/Face";
import ChildFriendlyIcon from "@mui/icons-material/ChildFriendly";

interface ChipInputProps<T> {
  currentValue: T;
  value: T;
  label: string;
  onClick: (value: T) => void;
}

export function ChipInput<T>(props: ChipInputProps<T>) {
  return (
    <Chip
      // icon={<ChildFriendlyIcon />}
      label={props.label}
      variant={props.value === props.currentValue ? "filled" : "outlined"}
      color="primary"
      onClick={() => {
        props.onClick(props.value);
      }}
    />
  );
}
