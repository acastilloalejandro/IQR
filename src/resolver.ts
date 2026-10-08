import type { IqrCredential } from "./types.js";

export interface IqrResolver {
  resolve(id: string): Promise<IqrCredential | null>;
}

export class HttpResolver implements IqrResolver {
  constructor(private readonly baseUrl: string) {}

  async resolve(id: string): Promise<IqrCredential | null> {
    const url = this.baseUrl.replace(/\/$/, "") + "/q/" + encodeURIComponent(id);
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) return null;
    return await response.json() as IqrCredential;
  }
}

export class MemoryResolver implements IqrResolver {
  private readonly records = new Map<string, IqrCredential>();

  constructor(records: IqrCredential[] = []) {
    records.forEach((record) => this.records.set(record.id, record));
  }

  set(record: IqrCredential): void {
    this.records.set(record.id, record);
  }

  async resolve(id: string): Promise<IqrCredential | null> {
    return this.records.get(id) ?? null;
  }
}