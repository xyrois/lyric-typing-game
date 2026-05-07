import { getConnection } from "@/lib/db";

export async function GET(request, context) {
  const { id } = await context.params;

  const db = await getConnection();

  const [lyrics] = await db.execute(
    `
    SELECT *
    FROM lyrics
    WHERE song_id = ?
    ORDER BY line_index ASC
    `,
    [id]
  );

  await db.end();

  return Response.json(lyrics);
}