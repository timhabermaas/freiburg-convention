import { LoaderFunction, useLoaderData } from "remix";
import { EventEnvelope, Event } from "~/domain/events";
import { getEvents } from "~/domain/state";

export const loader: LoaderFunction = async ({ context }) => {
  return getEvents(context.eventStore);
};

export default function EventsIndex() {
  const events = useLoaderData();

  return (
    <div>
      <ul>
        {events.map((event: EventEnvelope<Event>) => (
          <li key={event.id}>
            {event.id}/{event.version} ({event.timeStamp.toString()}):{" "}
            <pre>{JSON.stringify(event.payload, null, "\t")}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
