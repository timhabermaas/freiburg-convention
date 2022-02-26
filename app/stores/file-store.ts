import * as fs from "fs";
import { v4 as uuid } from "uuid";
import { EventStore } from "~/stores/interface";
import { EventEnvelope, Event } from "~/types";

export class FileStore implements EventStore {
  private fileName: string;

  constructor(fileName: string) {
    this.fileName = fileName;
  }

  readAll(): Promise<EventEnvelope<Event>[]> {
    this.ensureFileExists();
    const data = fs.readFileSync(this.fileName);
    const result = [];

    for (const line of data.toString().split("\n")) {
      if (line.trim() === "") {
        continue;
      }

      const l = JSON.parse(line);

      result.push({
        ...l,
        timeStamp: new Date(Date.parse(l.timeStamp)),
      });
    }

    return Promise.resolve(result);
  }

  save(payload: Event, versionNumber: number): Promise<EventEnvelope<Event>> {
    const event = {
      payload,
      id: uuid(),
      version: versionNumber,
      timeStamp: new Date(),
    };

    this.ensureFileExists();
    fs.appendFileSync(this.fileName, JSON.stringify(event) + "\n");

    return Promise.resolve(event);
  }

  private ensureFileExists() {
    fs.closeSync(fs.openSync(this.fileName, "a"));
  }
}
