import Image from "next/image";
import Link from "next/link";

export default function SiteHeader() {
  return (
    <header className="site-header wpu-shared-header">
      <div className="nav-shell">
        <Link className="brand" href="/" aria-label="World Pickleball Union home">
          <Image
            src="/brand/wpu-logo-approved.png"
            alt="World Pickleball Union"
            width={640}
            height={210}
            priority
          />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          <Link href="/about">About</Link>
          <Link href="/governance">Governance</Link>
          <Link href="/members">Members</Link>
          <Link href="/competitions">Competitions</Link>
          <Link href="/standards">Standards</Link>
          <Link href="/development">Development</Link>
        </nav>

        <Link className="nav-cta" href="/members">
          Join WPU
        </Link>

        <details className="mobile-nav">
          <summary aria-label="Open navigation">
            <span />
            <span />
            <span />
          </summary>

          <nav aria-label="Mobile navigation">
            <Link href="/about">About</Link>
            <Link href="/governance">Governance</Link>
            <Link href="/members">Members</Link>
            <Link href="/competitions">Competitions</Link>
            <Link href="/standards">Standards</Link>
            <Link href="/development">Development</Link>
            <Link className="mobile-nav-join" href="/members">
              Join WPU <span>→</span>
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
