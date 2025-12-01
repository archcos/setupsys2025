// constants/refundConstants.js

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const REFUND_STATUS = {
  PAID: 'paid',
  UNPAID: 'unpaid',
  RESTRUCTURED: 'restructured',
};

export const STATUS_STYLES = {
  paid: 'bg-green-100 text-green-800 border border-green-300',
  unpaid: 'bg-red-100 text-red-800 border border-red-300',
  restructured: 'bg-blue-100 text-blue-800 border border-blue-300',
};