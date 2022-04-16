import { useTheme } from "@mui/material";
import {
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ChartProps {
  histogram: [Date, number][];
}

export function Chart(props: ChartProps) {
  const data = props.histogram.map(([day, count]) => ({ day, count }));
  const theme = useTheme();

  return (
    <ResponsiveContainer>
      <LineChart
        data={data}
        margin={{
          top: 16,
          right: 16,
          bottom: 0,
          left: 24,
        }}
      >
        <Line
          type="monotone"
          dataKey="count"
          stroke="#8884d8"
          isAnimationActive={false}
        />
        <Tooltip
          labelFormatter={(v) => new Intl.DateTimeFormat("de").format(v)}
        />
        <XAxis
          dataKey="day"
          tickFormatter={(v) => new Intl.DateTimeFormat("de").format(v)}
          stroke={theme.palette.text.secondary}
          style={theme.typography.body2}
        />
        <YAxis
          stroke={theme.palette.text.secondary}
          style={theme.typography.body2}
        >
          <Label
            angle={270}
            position="left"
            style={{
              textAnchor: "middle",
              fill: theme.palette.text.primary,
              ...theme.typography.body1,
            }}
          >
            Teilnehmer
          </Label>
        </YAxis>
      </LineChart>
    </ResponsiveContainer>
  );
}
