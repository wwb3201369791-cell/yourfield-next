import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import SolutionPositionCell from '@/components/admin/cells/SolutionPositionCell';

function cellLabel(props: Parameters<typeof SolutionPositionCell>[0]) {
  const element = SolutionPositionCell(props) as ReactElement<{ children: string }>;

  return element.props.children;
}

describe('SolutionPositionCell', () => {
  it('shows the exact operator-facing frontend position', () => {
    expect(cellLabel({ cellData: 1 })).toBe('第 1 位');
    expect(cellLabel({ cellData: 2 })).toBe('第 2 位');
    expect(cellLabel({ data: 3 })).toBe('第 3 位');
    expect(cellLabel({ cellData: 10 })).toBe('第 10 位');
  });

  it('shows unset positions clearly', () => {
    expect(cellLabel({ cellData: 0 })).toBe('未设置');
    expect(cellLabel({})).toBe('未设置');
  });
});
