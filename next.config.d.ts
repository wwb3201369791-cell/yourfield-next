import type { NextConfig } from 'next';

export const defaultBuildWorkerCount: number;

export function getBuildWorkerCount(value: string | null | undefined): number | undefined;

export function remotePatternFromUrl(value: string | null | undefined): {
  protocol: string;
  hostname: string;
  port: string;
  pathname: string;
} | null;

export const serverComponentsExternalPackages: string[];

declare const nextConfig: NextConfig;

export default nextConfig;
