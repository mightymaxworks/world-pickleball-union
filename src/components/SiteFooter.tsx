import Link from "next/link";
import { joinWpu, playerSignIn } from "@/lib/public-paths";

export default function SiteFooter() {
  return <footer className="public-site-footer">
    <div>
      <Link className="public-footer-brand" href="/">World Pickleball Union</Link>
      <nav aria-label="Footer navigation">
        <Link href={joinWpu}>Join WPU</Link><Link href={playerSignIn}>Sign in</Link>
        <Link href="/governance">Governance</Link><Link href="/standards">Standards</Link>
        <Link href="/initiatives/global-marina">Global Marina</Link><Link href="/brand">Brand</Link>
        <Link href="/supporters">Support Network</Link><Link href="/membership/privacy">Privacy</Link>
        <a href="mailto:info@worldpickleball.world">Contact WPU</a>
      </nav>
    </div>
  </footer>;
}
