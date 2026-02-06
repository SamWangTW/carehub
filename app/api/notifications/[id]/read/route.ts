export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return Response.json({
    id,
    readAt: new Date().toISOString(),
  });
}
