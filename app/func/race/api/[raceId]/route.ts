import { responseHeaders } from "@/lib/race/http";
export function GET() {
  return Response.json(
    { error: "Use the permanent race endpoint at /func/race/api." },
    { status: 410, headers: responseHeaders },
  );
}
export const POST = GET;
