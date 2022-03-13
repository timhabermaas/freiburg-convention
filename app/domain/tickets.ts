import { Day, Ticket } from "./types";

export const TICKETS: Ticket[] = [
  {
    id: "40086a2b-ef9f-48f7-a9ed-1390b146e83f",
    text: "Do.–So., >12 Jahre: 30€",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    category: "OlderThan12",
    price: 3000,
  },
  {
    id: "40086a2b-ef9f-48f7-a9ed-1390b146e83e",
    text: "Do.–So., >12 Jahre: 35€ (Supporter)",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    category: "Supporter",
    price: 3500,
  },
];
