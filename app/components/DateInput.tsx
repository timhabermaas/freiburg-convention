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
    monthIndex: m,
  }));
  const years = arrayFromRange(1900, new Date().getFullYear());

  const defaultDate = props.defaultDate ?? {
    day: "1",
    month: "0",
    year: "1990",
  };

  return (
    <div className="form-group">
      <label>{props.label}</label>
      <div className="row">
        <div className="col-sm-3">
          <select
            name={withPrefix("day")}
            className="form-control"
            defaultValue={getValue(defaultDate, "day")}
          >
            {days.map((d) => (
              <option value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="col-sm-5 mt-2 mt-sm-0">
          <select
            name={withPrefix("month")}
            className="form-control"
            defaultValue={getValue(defaultDate, "month")}
          >
            {months.map(({ monthName, monthIndex }) => (
              <option value={monthIndex}>{monthName}</option>
            ))}
          </select>
        </div>
        <div className="col-sm-4 mt-2 mt-sm-0">
          <select
            name={withPrefix("year")}
            className="form-control"
            defaultValue={getValue(defaultDate, "year")}
          >
            {years.map((y) => (
              <option value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
