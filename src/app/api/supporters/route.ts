import {NextResponse} from "next/server";
import {queryD1} from "@/lib/supporters-db";
export const dynamic="force-dynamic";
export async function GET(){
 try{
  const rows=await queryD1("SELECT name,country,region,category,website FROM supporter_pledges WHERE status='approved' AND authority_confirmed=1 AND publication_consent=1 ORDER BY name LIMIT 500");
  return NextResponse.json({supporters:rows.map(row=>({...row,status:"pledged"}))},{headers:{"Cache-Control":"no-store"}});
 }catch(e){console.error("WPU_SUPPORTERS_DIRECTORY_QUERY_FAILED",e);return NextResponse.json({supporters:[],error:"Directory temporarily unavailable"},{status:503});}
}
