import { useLocale } from "~/hooks/useLocale";
import { arrayFromRange } from "~/utils";

interface DateInputProps {
  label: string;
  name: string;
  defaultDate?: [number, number, number];
}

export function DateInput(props: DateInputProps) {
  const { locale } = useLocale();
  const monthFormatter = new Intl.DateTimeFormat(locale, { month: "long" });
  const withPrefix = (s: string): string => props.name + "." + s;

  const days = [...Array(31).keys()];
  const months = [...Array(12).keys()].map((m) => ({
    monthName: monthFormatter.format(new Date(Date.UTC(2021, m))),
    monthIndex: m,
  }));
  const years = arrayFromRange(1900, 2021);

  // TODO: props.defaultDate is a string at runtime
  const defaultDate = props.defaultDate ?? [0, 0, 1900];
  console.log(defaultDate);

  return (
    <div className="form-group">
      <label>{props.label}</label>
      <div className="row">
        <div className="col-sm-3">
          <select name={withPrefix("day")} className="form-control">
            {days.map((d) => (
              <option value={d} selected={defaultDate[0] === d}>
                {d + 1}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-5 mt-2 mt-sm-0">
          <select name={withPrefix("month")} className="form-control">
            {months.map(({ monthName, monthIndex }) => (
              <option
                value={monthIndex}
                selected={defaultDate[1] === monthIndex}
              >
                {monthName}
              </option>
            ))}
          </select>
        </div>
        <div className="col-sm-4 mt-2 mt-sm-0">
          <select name={withPrefix("year")} className="form-control">
            {years.map((y) => (
              <option value={y} selected={defaultDate[2] === y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
