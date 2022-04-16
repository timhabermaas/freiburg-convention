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
import { LoaderFunction, redirect, useLoaderData } from "remix";
import * as z from "zod";
import { CONFIG } from "~/config.server";
import { ACCOMMODATIONS } from "~/domain/accommodation";
import { App } from "~/domain/app";
import { AccommodationSchema } from "~/domain/events";
import { Accommodation, Limits, T_SHIRT_SIZES } from "~/domain/types";
import * as i18n from "~/i18n";

export function links() {
  return [
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
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
  accommodationTable: z.array(
    z.tuple([AccommodationSchema, z.number(), z.number(), z.number()])
  ),
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
    accommodationTable: ACCOMMODATIONS.map((a) => [
      a,
      app.getParticipantsForAccommodation(a, true, false),
      app.getParticipantsForAccommodation(a, false, true),
      app.getParticipantsForAccommodation(a, true, true),
    ]),
    limits: app.getLimits(),
    tshirts: { ...app.getShirtSizeCount(), total: totalShirts },
    supporterSoliRatio: app.getSupporterSoliRatio(),
  };

  return data;
};

const theme = createTheme();

export default function StatsPage() {
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container component="main">
        <Stack spacing={4}>
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
                    <TableCell align="right">Do–So</TableCell>
                    <TableCell align="right">Fr–So</TableCell>
                    <TableCell align="right">Summe</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.accommodationTable.map(
                    ([accommodation, thuSun, friSun, total]) => (
                      <TableRow key={accommodation}>
                        <TableCell variant="head">
                          {i18n.accommodationFieldType(accommodation).de}
                        </TableCell>
                        <TableCell align="right">{thuSun}</TableCell>
                        <TableCell align="right">{friSun}</TableCell>
                        <TableCell align="right">
                          <strong>{total}</strong>
                          <small>
                            /{getLimitFor(accommodation, data.limits) ?? "∞"}
                          </small>
                        </TableCell>
                      </TableRow>
                    )
                  )}
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                    <TableCell align="right">
                      <strong>
                        {data.accommodationTable
                          .map((row) => row[3])
                          .reduce((sum, x) => sum + x, 0)}
                      </strong>
                      <small>/{data.limits.total}</small>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
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
                      <TableCell align="right">{data.tshirts[size]}</TableCell>
                    ))}
                    <TableCell align="right">{data.tshirts.total}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
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
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
