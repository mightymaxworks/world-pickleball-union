import { permanentRedirect } from "next/navigation";
import { organisationJoin } from "@/lib/public-paths";

export default function Federations() { permanentRedirect(organisationJoin); }
