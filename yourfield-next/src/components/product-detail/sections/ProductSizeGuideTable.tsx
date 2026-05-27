import type { SizeGuideTableProps } from './types';

export function ProductSizeGuideTable({
  columns,
  cornerLabel,
  heading,
  rows,
}: SizeGuideTableProps) {
  return (
    <>
      <div className="detail-section-heading">
        <h2>{heading}</h2>
      </div>
      <div className="detail-table-wrap">
        <table className="detail-size-table">
          <thead>
            <tr>
              <th scope="col">{cornerLabel}</th>
              {columns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {columns.map((column, index) => (
                  <td key={`${row.label}-${column}`}>{row.values[index] || '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
