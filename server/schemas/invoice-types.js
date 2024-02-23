const getInvoicesSchema_query = {
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

const getInvoiceSchema_params = {
  type: 'object',
  properties: {
    invoiceID: { type: 'string' },
  },
};

const newInvoiceSchema_body = {
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

const invoiceUpdateSchema_body = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['draft', 'pending', 'sent', 'paymentPending', 'paymentPartial', 'paymentFull', 'closed', 'overdue', 'void', 'refunded', 'disputed'],
    },
    subtotal: { type: 'number' },
  },
};

const invoiceUpdateSchema_params = {
  type: 'object',
  required: ['invoiceID'],
  properties: {
    invoiceID: { type: 'string' },
  },
};

const getInvoiceNotesSchema_query = {
  type: 'object',
  properties: {
    invoiceNoteIDs: { type: 'array', items: { type: 'integer' } },
    invoiceID: { type: 'string' },
  },
};

const newInvoiceNoteSchema_body = {
  type: 'object',
  required: ['note'],
  properties: {
    note: {
      type: 'string',
    },
  },
};

const newInvoiceNoteSchema_params = {
  type: 'object',
  required: ['invoiceID'],
  properties: {
    invoiceID: { type: 'string' },
  },
};

const getInvoiceLogsSchema_query = {
  type: 'object',
  properties: {
    invoiceLogIDs: { type: 'array', items: { type: 'integer' } },
    invoiceID: { type: 'string', description: 'Filter by invoice ID' },
    type: { type: 'string', enum: ['created', 'statusChange'] },
    dateRange: { type: 'array', items: { type: 'string' }, description: 'Filter by date range' },
  },
};

const newInvoiceLogSchema_body = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      enum: ['created', 'statusChange'],
    },
    log: {
      type: 'string',
    },
  },
};

const newInvoiceLogSchema_params = {
  type: 'object',
  required: ['invoiceID'],
  properties: {
    invoiceID: { type: 'string' },
  },
};

module.exports = {
  newInvoiceSchema_body,
  invoiceUpdateSchema_body,
  invoiceUpdateSchema_params,
  getInvoicesSchema_query,
  getInvoiceSchema_params,
  getInvoiceNotesSchema_query,
  newInvoiceNoteSchema_body,
  newInvoiceNoteSchema_params,
  getInvoiceLogsSchema_query,
  newInvoiceLogSchema_body,
  newInvoiceLogSchema_params,
};
