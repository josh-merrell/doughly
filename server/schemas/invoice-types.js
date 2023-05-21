const invoiceUpdateSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['draft', 'pending', 'sent', 'paymentPending', 'paymentPartial', 'paymentFull', 'closed', 'overdue', 'void', 'refunded', 'disputed'],
    },
    subtotal: { type: 'number' },
  },
};

const newInvoiceSchema = {
  type: 'object',
  required: ['type', 'status', 'subtotal'],
  properties: {
    type: {
      type: 'string',
      enum: ['order'],
      description: 'The type of invoice to create',
    },
    status: {
      type: 'string',
      enum: ['draft', 'pending', 'sent', 'paymentPending', 'paymentPartial', 'paymentFull', 'closed', 'overdue', 'void', 'refunded', 'disputed'],
      description: 'The status of the invoice',
    },
    subtotal: { type: 'number' },
  },
};

const getInvoicesSchema = {
  type: 'object',
  properties: {
    invoiceIDs: { type: 'array', items: { type: 'integer' } },
    type: {
      type: 'string',
      enum: ['order'],
      description: 'The type of invoice to filter by',
    },
    status: {
      type: 'string',
      enum: ['draft', 'pending', 'sent', 'paymentPending', 'paymentPartial', 'paymentFull', 'closed', 'overdue', 'void', 'refunded', 'disputed'],
      description: 'The status of the invoice to filter by',
    },
    subtotalMin: { type: 'string', description: 'Filter by minimum subtotal' },
    subtotalMax: { type: 'string', description: 'Filter by maximum subtotal' },
  },
};

module.exports = {
  newInvoiceSchema,
  invoiceUpdateSchema,
  getInvoicesSchema,
};
