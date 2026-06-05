// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { CompanyMap } from '@/components/ui/Map';

afterEach(() => {
  cleanup();
});

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

  it('uses Gaode for Chinese map links while keeping the embedded preview on OpenStreetMap', () => {
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

    const iframe = screen.getByTitle('显示永霏集团总部位置的高德地图');
    const externalLink = screen.getByRole('link', { name: /在高德地图中查看/ });

    expect(iframe.getAttribute('src')).toContain('openstreetmap.org/export/embed.html');
    expect(externalLink.getAttribute('href')).toContain('uri.amap.com/marker');
  });

  it('uses Google Maps embeds and links for English and Russian pages', () => {
    const { rerender } = render(
      <CompanyMap
        locale="en"
        coordinates={{ lat: 27.816329, lng: 112.989066, zoom: 15 }}
        mapService="google"
        title="YourField headquarters"
        text="Preview headquarters on the map."
        placeholder="Map preview"
        frameTitle="Google map showing YourField headquarters"
        openMapLabel="Open in Google Maps"
      />,
    );

    expect(
      screen.getByTitle('Google map showing YourField headquarters').getAttribute('src'),
    ).toContain('google.com/maps');
    expect(
      screen.getByTitle('Google map showing YourField headquarters').getAttribute('src'),
    ).toContain('hl=en');
    expect(
      screen.getByRole('link', { name: /Open in Google Maps/ }).getAttribute('href'),
    ).toContain('google.com/maps/search');

    rerender(
      <CompanyMap
        locale="ru"
        coordinates={{ lat: 27.816329, lng: 112.989066, zoom: 15 }}
        mapService="google"
        title="Штаб-квартира YourField"
        text="Предпросмотр расположения штаб-квартиры."
        placeholder="Предпросмотр карты"
        frameTitle="Карта Google с расположением штаб-квартиры YourField"
        openMapLabel="Открыть в Google Maps"
      />,
    );

    expect(
      screen.getByTitle('Карта Google с расположением штаб-квартиры YourField').getAttribute('src'),
    ).toContain('hl=ru');
  });
});
