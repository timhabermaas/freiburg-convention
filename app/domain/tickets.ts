import { Day, Ticket } from "./types";

export const TICKETS: Ticket[] = [
  {
    ticketId: "40086a2b-ef9f-48f7-a9ed-1390b146e83f",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    category: "OlderThan12",
    price: 3000,
  },
  {
    ticketId: "40086a2b-ef9f-48f7-a9ed-1390b146e83e",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    category: "Supporter",
    price: 3500,
  },
];
