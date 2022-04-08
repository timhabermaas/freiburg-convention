import { FormControl, FormLabel, Grid, Select } from "@mui/material";
import { useLocale } from "~/hooks/useLocale";
import { arrayFromRange, getValue, NestedParams } from "~/utils";

interface DateInputProps {
  label: string;
  name: string;
  defaultDate?: NestedParams;
}

export function DateInput(props: DateInputProps) {
  const { locale } = useLocale();
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long" });
  const withPrefix = (s: string): string => props.name + "." + s;

  const days = [...Array(31).keys()].map((d) => d + 1);
  const months = [...Array(12).keys()].map((m) => ({
    monthName: monthFormatter.format(new Date(Date.UTC(2021, m))),
    monthValue: m + 1,
  }));
  const years = arrayFromRange(1900, new Date().getFullYear());

  const defaultDate = props.defaultDate ?? {
    day: "1",
    month: "1",
    year: "1990",
  };

  return (
    <FormControl fullWidth>
      <FormLabel>{props.label}</FormLabel>
      <Grid container spacing={1}>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth>
            <Select
              native
              defaultValue={getValue(defaultDate, "day")}
              name={withPrefix("day")}
            >
              {days.map((d) => (
                <option value={d} key={d}>
                  {d}
                </option>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={5}>
          <FormControl fullWidth>
            <Select
              defaultValue={getValue(defaultDate, "month")}
              name={withPrefix("month")}
              native
            >
              {months.map(({ monthName, monthValue }) => (
                <option key={monthValue} value={monthValue}>
                  {monthName}
                </option>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <Select
              native
              defaultValue={getValue(defaultDate, "year")}
              name={withPrefix("year")}
            >
              {years.map((y) => (
                <option value={y} key={y}>
                  {y}
                </option>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </FormControl>
  );
}
