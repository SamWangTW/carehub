export async function POST() {
  return Response.json({
    success: true,
    readAt: new Date().toISOString(),
  });
}
