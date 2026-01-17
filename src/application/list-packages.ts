import type { PackageRepository } from "../ports/package-repo";

export class ListPackages {
  constructor(private readonly packages: PackageRepository) {}

  async execute() {
    const items = await this.packages.list();
    return { items };
  }
}
