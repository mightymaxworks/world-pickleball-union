import Image from "next/image";
import Link from "next/link";
import { joinWpu, playerSignIn, publicNavigation } from "@/lib/public-paths";

export default function SiteHeader() {
  return <header className="site-header public-header">
    <div className="public-header-inner">
      <Link className="public-logo" href="/" aria-label="World Pickleball Union home">
        <Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={640} height={210} priority />
      </Link>
      <nav className="public-main-nav" aria-label="Primary navigation">
        {publicNavigation.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <div className="public-header-actions">
        <Link className="public-signin" href={playerSignIn}>Sign in</Link>
        <Link className="public-join" href={joinWpu}>Join WPU</Link>
        <details className="public-mobile-menu">
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">{publicNavigation.map(([label, href]) =>
            <Link key={href} href={href}>{label}</Link>)}</nav>
        </details>
      </div>
    </div>
  </header>;
}
