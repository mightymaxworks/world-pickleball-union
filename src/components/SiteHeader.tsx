import Image from "next/image";
import Link from "next/link";
import { joinWpu, playerSignIn } from "@/lib/public-paths";

import { PublicDesktopNavigation, PublicMobileNavigation } from "./PublicMenus";

export default function SiteHeader() {
  return <header className="site-header public-header">
    <div className="public-header-inner">
      <Link className="public-logo" href="/" aria-label="World Pickleball Union home">
        <Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={640} height={210} priority />
      </Link>
      <PublicDesktopNavigation />
      <div className="public-header-actions">
        <Link className="public-signin" href={playerSignIn}>Sign in</Link>
        <Link className="public-join" href={joinWpu}>Join WPU</Link>
        <PublicMobileNavigation />
      </div>
    </div>
  </header>;
}
