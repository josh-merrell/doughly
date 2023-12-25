const getOrdersSchema_query = {
  type: 'object',
  properties: {
    orderIDs: { type: 'array', items: { type: 'integer' } },
    clientID: { type: 'string' },
    name: { type: 'string' },
    scheduledDeliveryTimeRange: { type: 'array', items: { type: 'string' }, description: 'Range of scheduled delivery dates to filter by (YYYY-MM-DD format)' },
    createdDateRange: { type: 'array', items: { type: 'string' }, description: 'Range of create dates to filter by (YYYY-MM-DD format)' },
    fulfilledTimeRange: { type: 'array', items: { type: 'string' }, description: 'Range of fulfillment dates to filter by (YYYY-MM-DD format)' },
    fulfillment: { type: 'string', enum: ['pickup', 'delivery'] },
    status: { type: 'string', enum: ['created', 'inProgress', 'readyForDelivery', 'delivered', 'cancelled'] },
  },
};

const getOrderSchema_params = {
  type: 'object',
  required: ['orderID'],
  properties: {
    orderID: { type: 'string' },
  },
};

const newOrderSchema_body = {
  type: 'object',
  required: ['name', 'clientID', 'scheduledDeliveryTime', 'fulfillment'],
  properties: {
    name: { type: 'string' },
    clientID: { type: 'integer' },
    scheduledDeliveryTime: { type: 'string' },
    fulfillment: { type: 'string', enum: ['pickup', 'delivery'] },
    description: { type: 'string' },
  },
};

const OrderUpdateSchema_body = {
  type: 'object',
  properties: {
    scheduledDeliveryTime: { type: 'string' },
    description: { type: 'string' },
    name: { type: 'string' },
    fulfillment: { type: 'string', enum: ['pickup', 'delivery'] },
    fulfilledTime: { type: 'string' },
    status: { type: 'string', enum: ['created', 'inProgress', 'readyForDelivery', 'delivered', 'cancelled'] },
  },
};

const OrderUpdateSchema_params = {
  type: 'object',
  required: ['orderID'],
  properties: {
    orderID: { type: 'string' },
  },
};

const OrderDeleteSchema_params = {
  type: 'object',
  required: ['orderID'],
  properties: {
    orderID: { type: 'string' },
  },
};

module.exports = {
  getOrdersSchema_query,
  getOrderSchema_params,
  newOrderSchema_body,
  OrderUpdateSchema_body,
  OrderUpdateSchema_params,
  OrderDeleteSchema_params,
};
