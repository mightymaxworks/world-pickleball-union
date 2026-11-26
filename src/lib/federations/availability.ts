import { queryD1 } from "@/lib/supporters-db";

// Old Worker/database combinations keep their existing paths until the additive
// release is registered. Once registered, every new-request path checks the pause.
export async function federationActivationReady() {
  const [row] = await queryD1("SELECT 1 AS ready FROM wpu_schema_migrations WHERE filename='wpu-federation-activation-v1.sql'");
  return row?.ready === 1;
}

export const onlineRequestsOpen = `coalesce((SELECT v.state FROM wpu_federation_activation_events v
  WHERE v.organisation_id=o.id ORDER BY v.sequence DESC LIMIT 1),'open')<>'paused'`;

export async function onlineRequestCondition() {
  return await federationActivationReady() ? onlineRequestsOpen : "1=1";
}
