import '@payloadcms/next/css';
import '@/styles/payload-admin.css';

import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import type { ServerFunctionClientArgs } from 'payload';
import type { ReactNode } from 'react';

import config from '@/payload.config';

import { importMap } from './admin/importMap.js';

type PayloadRootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function PayloadRootLayout({ children }: PayloadRootLayoutProps) {
  const serverFunction = async (args: ServerFunctionClientArgs) => {
    'use server';

    return handleServerFunctions({ ...args, config, importMap });
  };

  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
