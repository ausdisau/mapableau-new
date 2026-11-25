import AccessibleButton from "./AccessibleButton";
import type { PUBLIC_SERVICES } from "../lib/service-directory";

export default function ServiceTile({
  service,
}: {
  service: (typeof PUBLIC_SERVICES)[number];
}) {
  return (
    <article
      className="service-card"
      aria-labelledby={`service-${service.id}-name`}
    >
      <h3 id={`service-${service.id}-name`}>{service.name}</h3>
      <p>{service.description}</p>
      <AccessibleButton href={service.href}>
        Visit {service.name}
      </AccessibleButton>
      <a
        href={"/access/request?service=" + service.id}
        aria-label={"Request access to " + service.name}
      >
        Request access
      </a>
    </article>
  );
}
