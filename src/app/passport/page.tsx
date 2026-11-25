import type { Metadata } from "next";
import PassportDashboard from "./passport-dashboard";
import "./passport.css";

export const metadata: Metadata = {
  title: "Player Passport",
  description: "Your private World Pickleball Union membership and sporting profile.",
  alternates: { canonical: "/passport" },
  robots: { index: false, follow: false },
};

export default function PassportPage() {
  return <PassportDashboard />;
}
