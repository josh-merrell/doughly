const newPaymentSchema_body = {
  type: 'object',
  required: ['invoiceID', 'method', 'amount'],
  properties: {
    invoiceID: { type: 'integer' },
    method: { type: 'string' },
    amount: { type: 'number' },
    receivedTime: { type: 'string', description: 'When the payment was received' },
  },
};

const getPaymentsSchema_query = {
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
  newPaymentSchema_body,
  getPaymentsSchema_query,
};
