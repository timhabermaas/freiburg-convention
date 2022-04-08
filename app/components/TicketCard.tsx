import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  List,
  ListItem,
  Typography,
} from "@mui/material";
import { Ticket } from "~/domain/types";
import * as i18n from "~/i18n";
import { formatDuration, formatTimeSpan } from "~/utils";

interface TicketCardProps {
  ticket: Ticket;
  locale: i18n.SupportedLocales;
  priceModifier: number;
  selected?: boolean;
  onClick?: () => void;
  name: string;
}

export function TicketCard(props: TicketCardProps) {
  return (
    <Card variant="elevation">
      <CardContent>
        <Typography gutterBottom variant="h5" component="h6">
          {formatDuration(props.ticket, props.locale)},{" "}
          {formatTimeSpan(props.ticket, props.locale)}
        </Typography>
        <Typography gutterBottom variant="subtitle1" component="h6">
          {i18n.translateCategory(props.ticket.ageCategory)[props.locale]}
        </Typography>
        <List dense>
          {i18n.ticketFeatures[props.locale].map((feature) => (
            <ListItem key={feature}>{feature}</ListItem>
          ))}
        </List>
        <Grid container justifyContent="flex-end">
          <Box>
            {props.priceModifier !== 0 && (
              <>
                <Typography
                  display="inline"
                  variant="subtitle1"
                  color="secondary"
                >
                  {i18n.formatCurrency(props.ticket.price, "EUR", props.locale)}
                </Typography>
                <Typography
                  display="inline"
                  variant="subtitle1"
                  color="secondary"
                >
                  {` ${
                    props.priceModifier > 0
                      ? " + "
                      : props.priceModifier < 0
                      ? " - "
                      : ""
                  }`}
                </Typography>
                <Typography
                  display="inline"
                  variant="subtitle1"
                  color="secondary"
                >
                  {i18n.formatCurrency(
                    Math.abs(props.priceModifier),
                    "EUR",
                    props.locale
                  )}
                  {" = "}
                </Typography>
              </>
            )}
            <Typography display="inline" variant="h6" color="secondary">
              {i18n.formatCurrency(
                props.ticket.price + props.priceModifier,
                "EUR",
                props.locale
              )}
            </Typography>
          </Box>
        </Grid>
      </CardContent>
      <CardActions>
        <Button
          variant={props.selected ? "contained" : "outlined"}
          onClick={() => props.onClick && props.onClick()}
        >
          {i18n.select[props.locale]}
        </Button>
      </CardActions>
    </Card>
  );
}
