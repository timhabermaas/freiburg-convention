import { LoaderFunction, useLoaderData } from "remix";
import { EventEnvelope, Event } from "~/domain/events";
import { EventStore } from "~/services/stores/interface";
import { whenAuthorized } from "~/session";

export const loader: LoaderFunction = async ({ context, request }) => {
  const contextTyped = context as { eventStore: EventStore };

  return whenAuthorized(request, async () => {
    return contextTyped.eventStore.readAll();
  });
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
