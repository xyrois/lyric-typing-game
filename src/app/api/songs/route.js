import { getConnection } from "@/lib/db";

export async function GET() {
  const db = await getConnection();

  const [songs] = await db.execute(
    "SELECT * FROM songs ORDER BY title ASC"
  );

  await db.end();

  return Response.json(songs);
}