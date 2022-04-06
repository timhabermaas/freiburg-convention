import { Day, Ticket } from "./types";

export const TICKETS: Ticket[] = [
  // 4 days
  {
    ticketId: "t-1",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    ageCategory: "OlderThan12",
    price: 5000,
  },
  {
    ticketId: "t-2",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    ageCategory: "Child",
    price: 3000,
  },
  {
    ticketId: "t-3",
    from: new Day(2022, 5, 26),
    to: new Day(2022, 5, 29),
    ageCategory: "Baby",
    price: 0,
  },
  // 3 days
  {
    ticketId: "t-4",
    from: new Day(2022, 5, 27),
    to: new Day(2022, 5, 29),
    ageCategory: "OlderThan12",
    price: 4000,
  },
  {
    ticketId: "t-5",
    from: new Day(2022, 5, 27),
    to: new Day(2022, 5, 29),
    ageCategory: "Child",
    price: 2500,
  },
  {
    ticketId: "t-6",
    from: new Day(2022, 5, 27),
    to: new Day(2022, 5, 29),
    ageCategory: "Baby",
    price: 0,
  },
];
