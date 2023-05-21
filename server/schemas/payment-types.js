const newPaymentSchema = {
  type: 'object',
  required: ['invoiceID', 'method', 'amount'],
  properties: {
    invoiceID: { type: 'integer' },
    method: { type: 'string' },
    amount: { type: 'number' },
  },
};

const getPaymentsSchema = {
  type: 'object',
  properties: {
    paymentIDs: { type: 'array', items: { type: 'integer' } },
    method: {
      type: 'string',
      enum: ['cash', 'card', 'digital'],
      description: 'The method of payment to filter by',
    },
    invoiceID: { type: 'string', description: 'Filter by invoice ID' },
    dateRange: { type: 'array', items: { type: 'string' }, description: 'Filter by date range' },
  },
};

module.exports = {
  newPaymentSchema,
  getPaymentsSchema,
};
