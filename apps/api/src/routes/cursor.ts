import { ValidationError } from "@snc/shared";

export const encodeCursor = (data: Record<string, string>): string =>
  Buffer.from(JSON.stringify(data)).toString("base64url");

export const decodeCursor = (
  cursor: string,
  fields: { timestampField: string; idField: string },
): { timestamp: Date; id: string } => {
  try {
    const decoded = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf-8"),
    );
    if (
      typeof decoded[fields.timestampField] !== "string" ||
      typeof decoded[fields.idField] !== "string"
    ) {
      throw new ValidationError("Invalid cursor format");
    }
    const timestamp = new Date(decoded[fields.timestampField] as string);
    if (isNaN(timestamp.getTime())) {
      throw new ValidationError("Invalid cursor date");
    }
    return { timestamp, id: decoded[fields.idField] as string };
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError("Invalid cursor");
  }
};

/**
 * Given rows fetched with limit+1, determine if there's a next page,
 * pop the overflow row, and encode the cursor from the last item.
 * Returns { items: T[], nextCursor: string | null }.
 */
export function buildPaginatedResponse<T>(
  rows: T[],
  limit: number,
  cursorFields: (lastItem: T) => Record<string, string>,
): { items: T[]; nextCursor: string | null } {
  let nextCursor: string | null = null;
  if (rows.length > limit) {
    rows.pop();
    const lastItem = rows[rows.length - 1]!;
    nextCursor = encodeCursor(cursorFields(lastItem));
  }
  return { items: rows, nextCursor };
}
