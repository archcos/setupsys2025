
export const STAGES = [
  'Company Profile',
  'Project Created',
  'Project Review',
  'Awaiting Approval',
  'Approved',
  'Implementation',
  'Liquidation',
  'Refund',
  'Completed'
];

export const REVIEW_APPROVAL_STAGES = [
  'internal_rtec',
  'internal_compliance',
  'external_rtec',
  'external_compliance',
];

export const REVIEW_APPROVAL_LABELS = {
  'internal_rtec': 'Internal RTEC',
  'internal_compliance': 'Internal Compliance',
  'external_rtec': 'External RTEC',
  'external_compliance': 'External Compliance',
};

export const STATUS_COLORS = {
  completed: 'bg-green-50 border-green-200',
  'in-progress': 'bg-blue-50 border-blue-200',
  'in-review': 'bg-indigo-50 border-indigo-200',
  'needs-attention': 'bg-orange-50 border-orange-200',
  'terminated': 'bg-red-50 border-red-200'
};

export const STATUS_TEXT_COLORS = {
  completed: 'text-green-700',
  'in-progress': 'text-blue-700',
  'in-review': 'text-indigo-700',
  'needs-attention': 'text-orange-700',
  'terminated': 'text-red-700'
};
