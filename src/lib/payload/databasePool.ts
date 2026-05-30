export const productionBuildDatabasePoolMaxLimit = 6;

export function resolvePayloadDatabasePoolMax(
  configuredMax: number,
  options: Readonly<{ isProductionBuild: boolean }>,
) {
  if (!options.isProductionBuild) {
    return configuredMax;
  }

  return Math.min(configuredMax, productionBuildDatabasePoolMaxLimit);
}
