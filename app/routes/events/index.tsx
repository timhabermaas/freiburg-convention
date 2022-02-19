import { LoaderFunction, useLoaderData } from "remix";
import { EventEnvelope, Event } from "~/types";
import { getEvents } from "~/state";

export const loader: LoaderFunction = async ({ context }) => {
  console.log(context);
  return getEvents(context);
};

export default function EventsIndex() {
  const events = useLoaderData();

  return (
    <div>
      <ul>
        {events.map((event: EventEnvelope<Event>) => (
          <li key={event.id}>
            {event.id} ({event.timeStamp.toString()}):{" "}
            <pre>{JSON.stringify(event.payload, null, "\t")}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
