/**
 * Minimal in-memory stand-in for the Supabase query builder, covering exactly
 * the calls the click-tracking and click-analytics code makes (select / insert
 * / update with eq, in, gt, gte, order, limit, maybeSingle, head counts).
 * Lets the tests exercise the real code paths end to end without a database.
 */
export type Row = Record<string, any>;

type Filter = (row: Row) => boolean;

export class FakeDb {
  tables: Record<string, Row[]> = {};
  /** Return an error for matching inserts (e.g. simulate a missing migration). */
  failInsert: ((table: string, row: Row) => string | null) | null = null;
  private seq = 0;

  seed(table: string, rows: Row[]): this {
    this.tables[table] = [...(this.tables[table] ?? []), ...rows.map((r) => ({ ...r }))];
    return this;
  }

  rows(table: string): Row[] {
    return this.tables[table] ?? [];
  }

  nextId(): string {
    this.seq += 1;
    return `00000000-0000-4000-8000-${String(this.seq).padStart(12, '0')}`;
  }

  from(table: string): Query {
    return new Query(this, table);
  }
}

class Query implements PromiseLike<any> {
  private mode: 'select' | 'insert' | 'update' = 'select';
  private filters: Filter[] = [];
  private payload: Row = {};
  private head = false;
  private wantCount = false;
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private returnRows = false;

  constructor(private db: FakeDb, private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }): this {
    if (this.mode === 'update') this.returnRows = true;
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(row: Row): this {
    this.mode = 'insert';
    this.payload = row;
    return this;
  }
  update(patch: Row): this {
    this.mode = 'update';
    this.payload = patch;
    return this;
  }
  eq(col: string, value: unknown): this {
    this.filters.push((r) => r[col] === value);
    return this;
  }
  in(col: string, values: unknown[]): this {
    this.filters.push((r) => values.includes(r[col]));
    return this;
  }
  gt(col: string, value: number): this {
    this.filters.push((r) => typeof r[col] === 'number' && r[col] > value);
    return this;
  }
  gte(col: string, value: string): this {
    this.filters.push((r) => typeof r[col] === 'string' && r[col] >= value);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }): this {
    this.orderBy = { col, asc: opts?.ascending !== false };
    return this;
  }
  limit(n: number): this {
    this.max = n;
    return this;
  }
  async maybeSingle(): Promise<any> {
    const res = this.execute();
    return { data: Array.isArray(res.data) ? res.data[0] ?? null : res.data, error: res.error };
  }
  then<T1 = any, T2 = never>(
    onfulfilled?: ((value: any) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null
  ): Promise<T1 | T2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private matching(): Row[] {
    return this.db.rows(this.table).filter((r) => this.filters.every((f) => f(r)));
  }

  private execute(): { data: any; error: { message: string } | null; count?: number | null } {
    if (this.mode === 'insert') {
      const message = this.db.failInsert?.(this.table, this.payload) ?? null;
      if (message) return { data: null, error: { message } };
      const row = { id: this.db.nextId(), ...this.payload };
      this.db.tables[this.table] = [...this.db.rows(this.table), row];
      return { data: null, error: null };
    }
    if (this.mode === 'update') {
      const targets = this.matching();
      targets.forEach((r) => Object.assign(r, this.payload));
      return { data: this.returnRows ? targets.map((r) => ({ ...r })) : null, error: null };
    }
    let rows = this.matching().map((r) => ({ ...r }));
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      rows.sort((a, b) => (a[col] < b[col] ? -1 : a[col] > b[col] ? 1 : 0) * (asc ? 1 : -1));
    }
    if (this.max !== null) rows = rows.slice(0, this.max);
    if (this.head) return { data: null, error: null, count: rows.length };
    return { data: rows, error: null, count: this.wantCount ? rows.length : null };
  }
}

/** Typed as the real client where the code under test expects one. */
export const asSupabase = <T>(db: FakeDb): T => db as unknown as T;
