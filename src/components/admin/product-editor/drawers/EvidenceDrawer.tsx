'use client';

import React from 'react';

import { SectionFieldDrawer } from './SectionFieldDrawer';

export function EvidenceDrawer() {
  return (
    <SectionFieldDrawer
      title="资料与认证状态"
      description="维护质量证据和认证状态。"
      fields={[
    { path: 'qualityEvidence', label: '质量证据', kind: 'readonly' },
    { path: 'certifications', label: '认证', kind: 'readonly', localized: false },
      ]}
    />
  );
}
