export interface Address {
  street: string;
  postalCode: string;
  city: string;
  country: string;
}

export interface Participant {
  fullName: string;
  birthday: Day;
  address: Address;
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
}
