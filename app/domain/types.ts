export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export type Cents = number;

export type Accommodation = "gym" | "tent" | "selfOrganized";

export type Category = "Baby" | "Child" | "OlderThan12" | "Supporter";

export interface Participant {
  participantId: string;
  fullName: string;
  birthday: Day;
  address: Address;
  ticket: Ticket;
  accommodation: Accommodation;
}

export interface Registration {
  registrationId: string;
  email: string;
  comment: string;
}

export class Day {
  private day: number;
  private month: number;
  private year: number;

  constructor(year: number, month: number, day: number) {
    this.day = day;
    this.month = month;
    this.year = year;
  }

  static parse(input: string): Day {
    const parts = input.split("-");
    if (parts.length !== 3) {
      throw new Error(`"${input}" is not a valid day`);
    }

    return new Day(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10),
      parseInt(parts[2], 10)
    );
  }

  public toJSON(): string {
    return `${this.year}-${this.month.toString().padStart(2, "0")}-${this.day
      .toString()
      .padStart(2, "0")}`;
  }

  public toUtcDate(): Date {
    return new Date(Date.UTC(this.year, this.month - 1, this.day));
  }
}

export interface Ticket {
  ticketId: string;
  category: Category;
  from: Day;
  to: Day;
  price: Cents;
}

export interface Mail {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}
