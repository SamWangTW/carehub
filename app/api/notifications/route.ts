import { list } from "../../../lib/mock-db/notifications";

export async function GET() {
  return Response.json({ data: list() });
}
