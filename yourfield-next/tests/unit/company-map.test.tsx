// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { CompanyMap } from '@/components/ui/Map';

describe('CompanyMap', () => {
  it('keeps the expanded map card focused on preview text instead of contact address details', () => {
    render(
      <CompanyMap
        locale="zh"
        coordinates={{ lat: 27.816329, lng: 112.989066, zoom: 15 }}
        mapService="amap"
        title="永霏集团总部"
        text="在地图中预览总部位置。"
        placeholder="地图预览：永霏集团总部"
        frameTitle="显示永霏集团总部位置的高德地图"
        openMapLabel="在高德地图中查看"
      />,
    );

    expect(screen.getByText('地图预览')).not.toBeNull();
    expect(screen.getByRole('heading', { name: '永霏集团总部' })).not.toBeNull();
    expect(screen.getByText('在地图中预览总部位置。')).not.toBeNull();
    expect(screen.getByRole('link', { name: /在高德地图中查看/ })).not.toBeNull();
    expect(screen.getByRole('link', { name: /OpenStreetMap contributors/ })).not.toBeNull();
    expect(screen.queryByText(/创业东路/)).toBeNull();
    expect(screen.queryByText('城市')).toBeNull();
    expect(screen.queryByText('区位')).toBeNull();
  });
});
