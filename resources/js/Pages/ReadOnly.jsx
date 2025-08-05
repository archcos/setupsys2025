import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';

const fieldLabels = {
  tarp: 'Tarpaulin',
  pdc: 'Post-Dated Check',
  liquidation: 'Liquidation Report',
};

const renderStatus = (value) =>
  value ? (
    <CheckCircle className="text-green-500 w-5 h-5" />
  ) : (
    <Circle className="text-gray-400 w-5 h-5" />
  );

export default function ReadOnlyChecklist({ implementation }) {
  if (!implementation) return null;

  const totalAmount = implementation.tags?.reduce(
    (sum, tag) => sum + parseFloat(tag.tag_amount || 0),
    0
  );

  const projectCost = parseFloat(implementation.project?.project_cost || 0);
  const percentage = (totalAmount / projectCost) * 100;

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4">
      <h3 className="text-lg font-semibold">Implementation Checklist</h3>

      <div className="text-sm text-gray-700 border-b pb-2">
        Project Cost:{' '}
        <strong>
          ₱{projectCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </strong>
      </div>

      {/* Basic checklist */}
      <div className="space-y-3">
        {['tarp', 'pdc', 'liquidation'].map((field) => (
          <div key={field} className="flex items-center gap-3">
            {renderStatus(implementation[field])}
            <span>{fieldLabels[field]}</span>
          </div>
        ))}
      </div>

      {/* Tag status */}
      <div className="pt-4 border-t space-y-2">
        <h4 className="text-sm font-medium">Tags</h4>

        <ul className="space-y-1 text-sm">
          {implementation.tags?.map((tag) => (
            <li key={tag.tag_id} className="flex justify-between border px-3 py-1 rounded bg-gray-50">
              <span>{tag.tag_name}</span>
              <span>₱{parseFloat(tag.tag_amount).toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <div className="text-xs text-gray-600 pt-1">
          Tag Total: <strong>₱{totalAmount?.toLocaleString()}</strong> (
          {percentage.toFixed(1)}% of project cost)
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
          <div
            className="bg-blue-500 h-full transition-all"
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Untagging status */}
      <div className="pt-4 border-t space-y-2">
        <div className="flex items-center gap-3">
          {renderStatus(implementation.first_untagged)}
          <span>First Untagging (≥ 50%)</span>
        </div>
        <div className="flex items-center gap-3">
          {renderStatus(implementation.final_untagged)}
          <span>Final Untagging (100%)</span>
        </div>
      </div>
    </div>
  );
}
