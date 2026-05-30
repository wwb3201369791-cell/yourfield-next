import '@payloadcms/next/css';
import '@/styles/payload-admin.css';

import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import type { ServerFunctionClient } from 'payload';
import type { ReactNode } from 'react';

import config from '@/payload.config';

import { importMap } from './admin/importMap.js';

type PayloadRootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const serverFunction: ServerFunctionClient = async function serverFunction(args) {
  'use server';

  return handleServerFunctions({ ...args, config, importMap });
};

export default function PayloadRootLayout({ children }: PayloadRootLayoutProps) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  );
}
