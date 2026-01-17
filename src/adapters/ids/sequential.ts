import type { IdGenerator } from "../../ports/id-generator";

export class SequentialId implements IdGenerator {
  private seq = 1;
  constructor(private readonly prefix: string, private readonly pad = 6) {}

  next(): string {
    const id = `${this.prefix}-${String(this.seq).padStart(this.pad, "0")}`;
    this.seq += 1;
    return id;
  }
}
