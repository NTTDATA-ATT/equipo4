import type { TelcoPackage } from "../domain/types";

export interface PackageRepository {
  list(): Promise<TelcoPackage[]>;
  getById(id: string): Promise<TelcoPackage | null>;
}
