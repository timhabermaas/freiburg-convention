import { useRef, useState } from "react";
import {
  ActionFunction,
  LoaderFunction,
  useFetcher,
  useLoaderData,
} from "remix";
import { whenAuthorized } from "~/session";
import * as z from "zod";
import * as i18n from "~/i18n";
import { App } from "~/domain/app";
import {
  assertNever,
  isoDateString,
  PaidStatusSchema,
  parseFormData,
  ticketPrice,
} from "~/utils";
import { useLocale } from "~/hooks/useLocale";
import Fuse from "fuse.js";
import { Event, EventEnvelope, EventEnvelopeSchema } from "~/domain/events";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  ClickAwayListener,
  Collapse,
  FormControl,
  FormControlLabel,
  FormGroup,
  Grid,
  Grow,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  MenuList,
  OutlinedInput,
  Paper,
  Popper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import DeleteIcon from "@mui/icons-material/Delete";
import {
  Timeline,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
} from "@mui/lab";

const LoaderDataSchema = z.object({
  registrations: z.array(
    z.object({
      registrationId: z.string(),
      email: z.string(),
      comment: z.string(),
      paymentReason: z.string(),
      registeredAt: isoDateString,
      paidStatus: PaidStatusSchema,
      participantCount: z.number(),
      ticketSum: z.number(),
      isCancelled: z.boolean(),
      participants: z.array(
        z.object({
          fullName: z.string(),
          participantId: z.string(),
        })
      ),
      events: z.array(EventEnvelopeSchema),
    })
  ),
});

type LoaderData = z.TypeOf<typeof LoaderDataSchema>;

export const loader: LoaderFunction = async ({ request, context }) => {
  return whenAuthorized<LoaderData>(request, () => {
    const app = context.app as App;

    return {
      registrations: app.getAllRegistrations().map((r) => {
        const participants = app.getParticipantsForRegistration(
          r.registrationId
        );
        return {
          ...r,
          paidStatus: app.getPaidStatus(r.registrationId),
          participantCount: participants.length,
          participants: participants,
          events: app.getEventsForRegistration(r.registrationId),
          ticketSum: participants
            .map((p) => ticketPrice(p.ticket))
            .reduce((sum, p) => sum + p, 0),
        };
      }),
    };
  });
};

const ActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cancelRegistration"),
    registrationId: z.string(),
  }),
  z.object({
    type: z.literal("payRegistration"),
    amount: z.number(),
  }),
]);

export const action: ActionFunction = async ({ context, request }) => {
  const app = context.app as App;
  const formData = parseFormData(await request.formData());
  const data = ActionSchema.parse(formData);

  switch (data.type) {
    case "cancelRegistration":
      app.cancelRegistration(data.registrationId);
      break;
    case "payRegistration":
      throw new Error("not implemented");
    default:
      assertNever(data);
  }

  return { success: true };
};

export default function Registrations() {
  const [searchText, setSearchText] = useState<string>("");
  const [hideCancelled, setHideCancelled] = useState<boolean>(true);
  const data = LoaderDataSchema.parse(useLoaderData<unknown>());
  const fetcher = useFetcher();

  const fuse = new Fuse(data.registrations, {
    includeScore: true,
    useExtendedSearch: true,
    keys: ["paymentReason", "participants.fullName", "email", "comment"],
  });

  let registrations =
    searchText.trim().length > 0
      ? fuse.search(searchText).map((x) => x.item)
      : data.registrations;

  if (hideCancelled) {
    registrations = registrations.filter((r) => !r.isCancelled);
  }

  const handleCancel = (registrationId: string) => {
    fetcher.submit(
      { type: "cancelRegistration", registrationId },
      { method: "post" }
    );
  };

  return (
    <Stack spacing={2} sx={{ mb: 4 }}>
      <Typography variant="h2">Anmeldungen</Typography>
      <FormGroup>
        <Stack spacing={1}>
          <FormControl variant="outlined">
            <InputLabel>Suche</InputLabel>
            <OutlinedInput
              onChange={(e) => {
                setSearchText(e.currentTarget.value);
              }}
              endAdornment={
                <InputAdornment position="end">
                  <SearchIcon />
                </InputAdornment>
              }
              label="Suche"
            />
          </FormControl>
          <Alert severity="info">
            Fuzzy-Matcher auf: <strong>Referenz</strong>,{" "}
            <strong>E-Mail</strong>, <strong>Name</strong> und{" "}
            <strong>Kommentar</strong>. Mit{" "}
            <Typography sx={{ fontFamily: "Monospace" }} component="span">
              =JIF-123
            </Typography>{" "}
            findet man exakt "JIF-123", mit{" "}
            <Typography sx={{ fontFamily: "Monospace" }} component="span">
              '123
            </Typography>{" "}
            alles was "123" enthält. Siehe auch:{" "}
            <a
              target="_blank"
              href="https://fusejs.io/examples.html#extended-search"
            >
              Dokumentation
            </a>
            .
          </Alert>
        </Stack>
      </FormGroup>
      <FormGroup>
        <FormControlLabel
          control={<Switch checked={hideCancelled} />}
          label="Abgemeldete verstecken"
          onChange={(_e, checked) => setHideCancelled(checked)}
        />
      </FormGroup>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 1000 }} size="small" aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>E-Mail</TableCell>
              <TableCell align="right">#</TableCell>
              <TableCell>Mitteilung</TableCell>
              <TableCell align="right">Referenz</TableCell>
              <TableCell align="right">Summe Tickets</TableCell>
              <TableCell align="right">Bezahlt?</TableCell>
              <TableCell align="right">Aktionen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {registrations.map((row) => (
              <RegistrationRow
                registration={row}
                key={row.registrationId}
                onCancel={handleCancel}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

interface RegistrationRowProps {
  registration: LoaderData["registrations"][number];
  onCancel: (registrationId: string) => void;
}

function RegistrationRow(props: RegistrationRowProps) {
  const { dateTimeFormatter, locale } = useLocale();
  const [open, setOpen] = useState(false);
  const row = props.registration;

  return (
    <>
      <TableRow
        key={row.registrationId}
        style={{ opacity: props.registration.isCancelled ? 0.4 : 1 }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.email}</TableCell>
        <TableCell align="right">{row.participantCount}</TableCell>
        <TableCell>{row.comment}</TableCell>
        <TableCell align="right">{row.paymentReason}</TableCell>
        <TableCell align="right">
          {i18n.formatCurrency(row.ticketSum, "EUR", locale)}
        </TableCell>
        <TableCell>{row.paidStatus === "paid" ? "✓" : "✘"}</TableCell>
        <TableCell>
          {!row.isCancelled && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <ButtonSwitch
                titles={[
                  `Passend (${i18n.formatCurrency(
                    row.ticketSum,
                    "EUR",
                    locale
                  )})`,
                  "Nicht passend",
                ]}
              />
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() =>
                  props.onCancel(props.registration.registrationId)
                }
              >
                Abmelden
              </Button>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow style={{ opacity: props.registration.isCancelled ? 0.4 : 1 }}>
        <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Grid container sx={{ margin: 1 }}>
              <Grid md={6} xs={12}>
                <Typography variant="h6">Teilnehmer*innen</Typography>
                <SubParticipantTable
                  participants={props.registration.participants}
                />
              </Grid>
              <Grid md={6} xs={12}>
                <RegistrationTimeline
                  events={props.registration.events}
                ></RegistrationTimeline>
              </Grid>
            </Grid>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

interface ButtonSwitchProps {
  titles: string[];
}

function ButtonSwitch(props: ButtonSwitchProps) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleToggle = () => {
    setOpen((o) => !o);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleMenuItemClick = (
    _event: React.MouseEvent<HTMLLIElement, MouseEvent>,
    index: number
  ) => {
    setSelectedIndex(index);
    setOpen(false);
  };

  return (
    <>
      <ButtonGroup size="small" sx={{ mr: 1 }} ref={anchorRef}>
        <Button variant="contained" startIcon={<PaidIcon />}>
          {props.titles[selectedIndex]}
        </Button>
        <Button variant="contained" onClick={handleToggle}>
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                placement === "bottom" ? "center top" : "center bottom",
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu" autoFocusItem>
                  {props.titles.map((option, index) => (
                    <MenuItem
                      key={option}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
  );
}

interface RegistrationTimelineProps {
  events: EventEnvelope<Event>[];
}

function RegistrationTimeline(props: RegistrationTimelineProps) {
  const { dateTimeFormatter } = useLocale();

  const eventToName = (e: Event): string => {
    switch (e.type) {
      case "RegisterEvent":
        return "Angemeldet";
      case "CancelRegistrationEvent":
        return "Abgemeldet";
      default:
        return assertNever(e);
    }
  };

  return (
    <Timeline position="left">
      {props.events.map((event) => (
        <TimelineItem key={event.id}>
          <TimelineOppositeContent color="text.secondary">
            {dateTimeFormatter.format(event.timeStamp)}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>{eventToName(event.payload)}</TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
}

interface SubParticipantTableProps {
  participants: { fullName: string; participantId: string }[];
}

function SubParticipantTable(props: SubParticipantTableProps) {
  return (
    <Table size="small">
      <TableHead>
        <TableCell>Name</TableCell>
      </TableHead>
      <TableBody>
        {props.participants.map((p) => (
          <TableRow key={p.participantId}>
            <TableCell>{p.fullName}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
