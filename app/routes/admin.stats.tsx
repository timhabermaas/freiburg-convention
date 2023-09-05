import {
  Box,
  Container,
  createTheme,
  CssBaseline,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ThemeProvider,
  Typography,
} from "@mui/material";
import { LoaderFunction, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import * as z from "zod";
import { Chart } from "~/components/Chart";
import { ParticipantMap } from "~/components/ParticipantMap";
import { CONFIG } from "~/config.server";
import { ACCOMMODATIONS } from "~/domain/accommodation";
import { App } from "~/domain/app.server";
import { Accommodation, Limits, T_SHIRT_SIZES } from "~/domain/types";
import { useEventConfig } from "~/hooks/useEventConfig";
import * as i18n from "~/i18n";
import { formatWeekday, isoDateString } from "~/utils";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
    },
    {
      rel: "stylesheet",
      href: "https://unpkg.com/leaflet@1.7.1/dist/leaflet.css",
    },
  ];
}

function getLimitFor(
  accommodation: Accommodation,
  limits: Limits
): number | undefined {
  switch (accommodation) {
    case "gym":
      return limits.gym;
    case "tent":
      return limits.tent;
    default:
      return undefined;
  }
}

const LoaderDataSchema = z.object({
  accommodationDayCount: z.record(z.number()),
  participantCount: z.number(),
  limits: z.object({
    total: z.optional(z.number()),
    tent: z.optional(z.number()),
    gym: z.optional(z.number()),
  }),
  tshirts: z.object({
    S: z.number(),
    M: z.number(),
    L: z.number(),
    XL: z.number(),
    total: z.number(),
  }),
  supporterSoliRatio: z.object({
    support: z.number(),
    soli: z.number(),
  }),
  income: z.object({
    earnedInCents: z.number(),
    missingInCents: z.number(),
  }),
  fuzzyAddresses: z.array(
    z.object({
      postalCode: z.string().nullable(),
      country: z.string().nullable(),
    })
  ),
  histogram: z.array(z.tuple([isoDateString, z.number()])),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ context, request }) => {
  const url = new URL(request.url);

  if (
    CONFIG.statsAccessKey &&
    url.searchParams.get("accessKey") !== CONFIG.statsAccessKey
  ) {
    return redirect("/admin");
  }

  const app = context.app as App;

  const shirts = app.getShirtSizeCount();
  const totalShirts = shirts.S + shirts.M + shirts.L + shirts.XL;

  const data: LoaderData = {
    participantCount: app.getAllActualParticipants().length,
    accommodationDayCount: app.getAccommodationDayMap(),
    limits: app.getLimits(),
    tshirts: { ...app.getShirtSizeCount(), total: totalShirts },
    supporterSoliRatio: app.getSupporterSoliRatio(),
    income: {
      earnedInCents: app.getTotalPaidAmount(),
      missingInCents: app.getMissingAmount(),
    },
    fuzzyAddresses: app.getFuzzyAddresses(),
    histogram: app
      .getRegistrationHistogram()
      .map(([day, count]) => [day.toUtcDate(), count]),
  };

  return data;
};

const theme = createTheme();

export default function StatsPage() {
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());
  const eventConfig = useEventConfig();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container component="main">
        <Stack spacing={4} sx={{ mb: 4 }}>
          <Typography variant="h1">Stats</Typography>
          <Box>
            <Typography gutterBottom variant="h2">
              Teilnehmer
            </Typography>
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    {eventConfig.conventionDays.map((day) => (
                      <TableCell align="right" key={day.toJSON()}>
                        {formatWeekday(day, "de")}
                      </TableCell>
                    ))}
                    <TableCell align="right">Summe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ACCOMMODATIONS.map((accommodation) => (
                    <TableRow key={accommodation}>
                      <TableCell variant="head">
                        {i18n.accommodationFieldType(accommodation).de}
                      </TableCell>
                      {eventConfig.conventionDays.map((day) => (
                        <TableCell align="right" key={day.toJSON()}>
                          {data.accommodationDayCount[
                            accommodation + "-" + day.toJSON()
                          ] ?? 0}
                        </TableCell>
                      ))}
                      <TableCell align="right">
                        <strong>
                          {data.accommodationDayCount[accommodation] ?? 0}
                        </strong>
                        <small>
                          /{getLimitFor(accommodation, data.limits) ?? "∞"}
                        </small>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell></TableCell>
                    {eventConfig.conventionDays.map((day) => (
                      <TableCell align="right" key={day.toJSON()}>
                        <strong>
                          {data.accommodationDayCount[day.toJSON()] ?? 0}
                        </strong>
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <strong>{data.participantCount}</strong>
                      <small>/{data.limits.total}</small>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          {eventConfig.tShirt && (
            <Box>
              <Typography gutterBottom variant="h2">
                T-Shirts
              </Typography>
              <TableContainer component={Paper} elevation={2}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {T_SHIRT_SIZES.map((size) => (
                        <TableCell key={size} variant="head" align="right">
                          {size}
                        </TableCell>
                      ))}
                      <TableCell variant="head" align="right">
                        Summe
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {T_SHIRT_SIZES.map((size) => (
                        <TableCell align="right" key={size}>
                          {data.tshirts[size]}
                        </TableCell>
                      ))}
                      <TableCell align="right">{data.tshirts.total}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
          <Box>
            <Typography gutterBottom variant="h2">
              Supporter-/Soli-Verhältnis
            </Typography>
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell variant="head" align="right">
                      Supporter
                    </TableCell>
                    <TableCell variant="head" align="right">
                      Soli
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="right">
                      {data.supporterSoliRatio.support}
                    </TableCell>
                    <TableCell align="right">
                      {data.supporterSoliRatio.soli}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box>
            <Typography gutterBottom variant="h2">
              💰
            </Typography>
            <TableContainer component={Paper} elevation={2}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell variant="head" align="right">
                      Einnahmen
                    </TableCell>
                    <TableCell variant="head" align="right">
                      Noch zu bezahlen
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell align="right">
                      {i18n.formatCurrency(
                        data.income.earnedInCents,
                        "EUR",
                        "de"
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {i18n.formatCurrency(
                        data.income.missingInCents,
                        "EUR",
                        "de"
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box>
            <Typography gutterBottom variant="h2">
              Angemeldete Teilnehmer/Tag
            </Typography>
            <Paper sx={{ height: 240 }} elevation={2}>
              <Chart histogram={data.histogram} />
            </Paper>
          </Box>
          <Box>
            <Typography gutterBottom variant="h2">
              Karte
            </Typography>
            <ParticipantMap addresses={data.fuzzyAddresses} />
          </Box>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
