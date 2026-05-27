import { ProductSectionHeading } from './ProductSectionHeading';
import type { SpecTableProps } from './types';

export function ProductSpecTable({ heading, rows, tagLabel }: SpecTableProps) {
  return (
    <>
      <ProductSectionHeading heading={heading} tagLabel={tagLabel} />
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
