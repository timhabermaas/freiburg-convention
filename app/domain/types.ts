export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export type Cents = number;

export type Accommodation = "gym" | "tent" | "selfOrganized";

export type AgeCategory = "Baby" | "Child" | "OlderThan12";

export type SupporterCategory = "Normal" | "Supporter" | "Cheaper";

export type TShirtSize = "S" | "M" | "L" | "XL";

export const T_SHIRT_SIZES: TShirtSize[] = ["S", "M", "L", "XL"];

export interface Participant {
  registrationId: string;
  participantId: string;
  fullName: string;
  birthday: Day;
  address: Address;
  ticket: OrderedTicket;
  accommodation: Accommodation;
  tShirtSize?: TShirtSize;
  isCancelled: boolean;
}

export interface Registration {
  registrationId: string;
  email: string;
  comment: string;
  paymentReason: string;
  registeredAt: Date;
  isCancelled: boolean;
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
    return new Date(this.toUtcUnixTime());
  }

  public toUtcUnixTime(): number {
    return Date.UTC(this.year, this.month - 1, this.day);
  }

  public isEqual(other: Day): boolean {
    return (
      this.day === other.day &&
      this.month === other.month &&
      this.year === other.year
    );
  }

  public diffInDays(other: Day): number {
    const selfUtc = this.toUtcUnixTime();
    const otherUtc = other.toUtcUnixTime();

    const msPerDay = 1000 * 60 * 60 * 24;

    return Math.floor((selfUtc - otherUtc) / msPerDay);
  }
}

export interface Ticket {
  ticketId: string;
  ageCategory: AgeCategory;
  from: Day;
  to: Day;
  price: Cents;
}

export interface OrderedTicket {
  ticketId: string;
  ageCategory: AgeCategory;
  from: Day;
  to: Day;
  price: Cents;
  priceModifier: Cents;
}

export interface Mail {
  from: string;
  to: string[];
  cc: string[];
  subject: string;
  body: string;
}

export type PaidStatus =
  | { type: "paid"; amountInCents: number }
  | { type: "notPaid" };

export interface Limits {
  total?: number;
  tent?: number;
  gym?: number;
  selfOrganized?: number;
}
