import type { Metadata } from "next";
import Link from "next/link";
import { signedInAccount } from "@/lib/control/http";
import { entriesReady, entryPlayer, playerEntries } from "@/lib/entries/service";
import { registrationStatus } from "@/lib/entries/model";
import "../../event-studio/studio.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My tournament entries",robots:{index:false,follow:false}};
export default async function MyEntries(){
  const account=await signedInAccount().catch(()=>null);
  const ready=await entriesReady().catch(()=>false);
  const player=account&&ready?await entryPlayer(account).catch(()=>null):null;
  const entries=player?await playerEntries(player.id):[];
  return <main className="es"><div className="es-shell"><section className="es-gate es-entry-loop">
    <Link href="/passport">Player Passport</Link><h1>My tournament entries</h1>
    {!account?<Link className="es-primary" href="/join?mode=login">Sign in to WPU</Link>:
      !ready?<p>Tournament entries are temporarily unavailable.</p>:
      !entries.length?<p>No tournament entries yet.</p>:<ul className="es-entry-list">{entries.map(entry=><li key={entry.id}>
        <span><strong>{entry.eventTitle}</strong><br/>{entry.name} · {registrationStatus[entry.status]}</span>
        <Link className="es-secondary" href={"/events/"+entry.eventSlug+"/enter/"+entry.divisionId}>View status</Link>
      </li>)}</ul>}
  </section></div></main>;
}
