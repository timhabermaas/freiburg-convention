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
  IntSchema,
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
  Modal,
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
  TextField,
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
    registrationId: z.string(),
    amountInCents: IntSchema,
  }),
  z.object({
    type: z.literal("undoPayment"),
    paymentId: z.string(),
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
      app.payRegistration(data.registrationId, data.amountInCents);
      break;
    case "undoPayment":
      app.undoPayment(data.paymentId);
      break;
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

  const handlePay = (registrationId: string, amountInCents: number) => {
    fetcher.submit(
      {
        type: "payRegistration",
        registrationId,
        amountInCents: amountInCents.toString(),
      },
      { method: "post" }
    );
  };

  const handleUndoPay = (paymentId: string) => {
    fetcher.submit(
      {
        type: "undoPayment",
        paymentId,
      },
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
                onPay={handlePay}
                onUndoPay={handleUndoPay}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

interface PayAmountModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (cents: number) => void;
  shouldPayInCents: number;
  name: string;
  paymentReason: string;
}

function PayAmountModal(props: PayAmountModalProps) {
  const { locale } = useLocale();
  const [textValue, setTextValue] = useState("");

  const amount = isNaN(parseInt(textValue)) ? 0 : parseInt(textValue);

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  return (
    <Modal
      open={props.open}
      onClose={() => props.onClose()}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={modalStyle}>
        <Typography
          id="modal-modal-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          Abweichend bezahlt
        </Typography>
        <TextField
          label="Betrag"
          variant="outlined"
          type="number"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          InputProps={{
            endAdornment: <InputAdornment position="end">Cents</InputAdornment>,
          }}
        />
        <Typography id="modal-modal-description" sx={{ mt: 2 }} gutterBottom>
          <em>
            {props.name} ({props.paymentReason})
          </em>{" "}
          hat <strong>{i18n.formatCurrency(amount, "EUR", locale)} </strong>{" "}
          statt{" "}
          <strong>
            {i18n.formatCurrency(props.shouldPayInCents, "EUR", locale)}
          </strong>{" "}
          bezahlt.
        </Typography>
        <Grid container>
          <Grid item md={12}>
            {amount !== 0 && (
              <Button
                variant="contained"
                onClick={() => props.onSubmit(amount)}
              >
                Speichern
              </Button>
            )}
          </Grid>
        </Grid>
      </Box>
    </Modal>
  );
}

interface RegistrationRowProps {
  registration: LoaderData["registrations"][number];
  onCancel: (registrationId: string) => void;
  onPay: (registrationId: string, amountInCents: number) => void;
  onUndoPay: (paymentId: string) => void;
}

function RegistrationRow(props: RegistrationRowProps) {
  const { dateTimeFormatter, locale } = useLocale();
  const [rowExtended, setRowExtended] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const row = props.registration;

  return (
    <>
      <PayAmountModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        shouldPayInCents={props.registration.ticketSum}
        onSubmit={(cents) => {
          props.onPay(props.registration.registrationId, cents);
          setModalOpen(false);
        }}
        name={props.registration.participants[0].fullName}
        paymentReason={props.registration.paymentReason}
      />
      <TableRow
        key={row.registrationId}
        style={{ opacity: props.registration.isCancelled ? 0.4 : 1 }}
      >
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setRowExtended(!rowExtended)}
          >
            {rowExtended ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{row.email}</TableCell>
        <TableCell align="right">{row.participantCount}</TableCell>
        <TableCell>{row.comment}</TableCell>
        <TableCell align="right">{row.paymentReason}</TableCell>
        <TableCell align="right">
          {i18n.formatCurrency(row.ticketSum, "EUR", locale)}
        </TableCell>
        <TableCell>
          {row.paidStatus === "notPaid"
            ? "✘"
            : `✓ (${i18n.formatCurrency(row.paidStatus[1], "EUR", locale)})`}
        </TableCell>
        <TableCell>
          {!row.isCancelled && (
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              {row.paidStatus === "notPaid" && (
                <ButtonSwitch
                  buttons={[
                    {
                      title: `Passend (${i18n.formatCurrency(
                        row.ticketSum,
                        "EUR",
                        locale
                      )})`,
                      onClick: () => {
                        props.onPay(
                          props.registration.registrationId,
                          row.ticketSum
                        );
                      },
                    },
                    {
                      title: "Nicht passend",
                      onClick: () => {
                        setModalOpen(true);
                      },
                    },
                  ]}
                />
              )}
              <Button
                variant="contained"
                color="error"
                onClick={() =>
                  props.onCancel(props.registration.registrationId)
                }
              >
                <DeleteIcon />
              </Button>
            </Box>
          )}
        </TableCell>
      </TableRow>
      <TableRow style={{ opacity: props.registration.isCancelled ? 0.4 : 1 }}>
        <TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={rowExtended} timeout="auto" unmountOnExit>
            <Grid container sx={{ margin: 1 }}>
              <Grid md={6} xs={12}>
                <Typography variant="h6">Teilnehmer*innen</Typography>
                <SubParticipantTable
                  participants={props.registration.participants}
                />
              </Grid>
              <Grid md={6} xs={12}>
                <RegistrationTimeline
                  onUndoPay={props.onUndoPay}
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
  buttons: { title: string; onClick: () => void }[];
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
        <Button
          variant="contained"
          startIcon={<PaidIcon />}
          onClick={props.buttons[selectedIndex].onClick}
        >
          {props.buttons[selectedIndex].title}
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
                  {props.buttons.map((option, index) => (
                    <MenuItem
                      key={option.title}
                      disabled={index === 2}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                    >
                      {option.title}
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

interface EventEntryProps {
  event: EventEnvelope<Event>;
  onUndoPaymentClick: (paymentId: string) => void;
}

function EventEntry(props: EventEntryProps) {
  const payload = props.event.payload;

  switch (payload.type) {
    case "RegisterEvent":
      return <>Angemeldet</>;
    case "CancelRegistrationEvent":
      return <>Abgemeldet</>;
    case "PaymentReceivedEvent":
      return (
        <>
          {i18n.formatCurrency(payload.amountInCents, "EUR", "de")} bezahlt
          <Button
            variant="text"
            onClick={() => props.onUndoPaymentClick(payload.paymentId)}
          >
            Undo
          </Button>
        </>
      );
    case "CancelPaymentEvent":
      return <>Zahlung storniert</>;
    default:
      return assertNever(payload);
  }
}

interface RegistrationTimelineProps {
  events: EventEnvelope<Event>[];
  onUndoPay: (paymentId: string) => void;
}

function RegistrationTimeline(props: RegistrationTimelineProps) {
  const { dateTimeFormatter } = useLocale();

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
          <TimelineContent>
            <EventEntry event={event} onUndoPaymentClick={props.onUndoPay} />
          </TimelineContent>
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
