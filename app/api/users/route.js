export async function GET(req) {
  return Response.json(
    { error: "Use /api/users/search with a query instead." },
    { status: 410 }
  );
}
