import type { SpecTableProps } from './types';

export function ProductSpecTable({ heading, rows, tagLabel }: SpecTableProps) {
  return (
    <>
      <div className="detail-section-heading">
        <span className="section-tag">{tagLabel}</span>
        <h2>{heading}</h2>
      </div>
      <div className="detail-table-wrap">
        <table className="detail-spec-table">
          <tbody>
            {rows.map((spec) => (
              <tr key={spec.label}>
                <th scope="row">{spec.label}</th>
                <td>{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
