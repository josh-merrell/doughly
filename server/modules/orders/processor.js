/* eslint-disable prettier/prettier */

const axios = require('axios');

('use strict');

const { updater } = require('../../db');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, orderIDs, clientID, name, scheduledDeliveryTimeRange, createdTimeRange, fulfilledTimeRange, fulfillment, status } = options;
    
    let q = db.from('orders').select().filter('userID', 'eq', userID).eq('deleted', false).order('orderID', { ascending: true });

    if (orderIDs) { q = q.in('orderID', orderIDs) }
    if (clientID) { q = q.filter('clientID', 'eq', clientID) }
    if (name) { q = q.like('name', name) }
    if (scheduledDeliveryTimeRange) {
      q = q.gte('scheduledDeliveryTime', scheduledDeliveryTimeRange[0]).lte('scheduledDeliveryTime', scheduledDeliveryTimeRange[1]);
    }
    if (createdTimeRange) {
      q = q.gte('createdTime', createdTimeRange[0]).lte('createdTime', createdTimeRange[1]);
    }
    if (fulfilledTimeRange) {
      q = q.gte('fulfilledTime', fulfilledTimeRange[0]).lte('fulfilledTime', fulfilledTimeRange[1]);
    }
    if (fulfillment) { q = q.filter('fulfillment', 'eq', fulfillment) }
    if (status) { q = q.filter('status', 'eq', status) }

    const { data: orders, error } = await q;

    if (error) {
      global.logger.info(`Error getting orders: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got ${orders.length} orders`);
    return orders;
  }

  async function getOrderByID(options) {
    const { data, error } = await db.from('orders').select().eq('orderID', options.orderID).eq('deleted', false).single();
    if (error) {
      global.logger.info(`Error getting order by ID: ${options.orderID}:${error.message}`);
      return { error: error.message };
    }
    return data;
  }

  async function create(options) {
    const { userID, clientID, name, scheduledDeliveryTime, fulfillment, description } = options;

    //validate client, return error if they don't exist
    const { data: client, error } = await db.from('clients').select().eq('clientID', clientID);
    if (error) {
      global.logger.info(`Error validating client ID: ${clientID} while creating order ${error.message}`);
      return { error: error.message };
    }
    if (!client.length) {
      global.logger.info(`Order creation failed: client ${clientID} does not exist`);
      return { error: `Order creation failed: client ${clientID} does not exist` };
    }
    
    
    //if delivery date is in the past, set to fulfilled, otherwise set to created
    const status = new Date(scheduledDeliveryTime) < new Date() ? 'delivered' : 'created';
    //if delivery date is in the past, set fulfillment date to delivery date
    const fulfilledTime = new Date(scheduledDeliveryTime) < new Date() ? scheduledDeliveryTime : null;
    //create an invoice
    const invoice = await axios.post(`${process.env.NODE_HOST}:${process.env.PORT}/invoices`, {
      type: 'order',
      status: 'draft',
      subtotal: 10.00 //TODO: calculate subtotal from orderStockProducts and orderTaskProducts
    }, {
      headers: {
        'authorization': options.authorization,
      }
    });
    //create an order
    const { data: order, error: orderError } = await db
      .from('orders')
      .insert({ userID, clientID, name, scheduledDeliveryTime, fulfillment, status, fulfilledTime, invoiceID: invoice.data[0].invoiceID, description, createdTime: new Date() })
      .select('orderID');

    if (orderError) {
      global.logger.info(`Error creating order: ${orderError.message}`);
      return { error: orderError.message };
    }
    //TODO: calculate subtotal from orderStockProducts and orderTaskProducts, then update invoice 'subtotal'

    global.logger.info(`Created order ${order.orderID}`);
    return order;
  }

  async function update(options) {
    //get order
    const { data: order, error: orderError } = await db.from('orders').select().eq('orderID', options.orderID).single();
    if (orderError) {
      global.logger.info(`Error getting order ID:${options.orderID}: while updating order: ${orderError.message}`);
      return { error: orderError.message };
    }

    //if order status is cancelled, return error
    if (order.status === 'cancelled') {
      global.logger.info(`Error updating order ${options.orderID}: order is cancelled, cannot make changes.`);
      return { error: 'order is cancelled, cannot make changes.' };
    }

    //if options.scheduledDeliveryTime is in the past, return an error
    if (new Date(options.scheduledDeliveryTime) < new Date()) {
      global.logger.info(`Error updating order ${options.orderID}: scheduledDeliveryTime cannot be in the past`);
      return { error: 'scheduledDeliveryTime cannot be in the past' };
    }

    //if options.fulfilledTime is in the future, return an error
    if (new Date(options.fulfilledTime) > new Date()) {
      global.logger.info(`Error updating order ${options.orderID}: fulfilledTime cannot be in the future`);
      return { error: 'fulfilledTime cannot be in the future' };
    }

    //if status is being changed to a valued not equal to 'delivered', set fulfilledTime to null before updating
    if (options.status !== 'delivered') options.fulfilledTime = null;
    
    const updateFields = {};
    for (let key in options) {
      if (key !== 'orderID' && options[key]) updateFields[key] = options[key];
    }
    
    try {
      const updatedOrder = await updater('orderID', options.orderID, 'orders', updateFields);
      global.logger.info(`Updated order ${options.orderID}`);
      return updatedOrder;
    } catch (error) {
      global.logger.info(`Error updating order ID:${options.orderID}: ${error.message}`);
      return { error: error.message };
    }
    
  }

  async function deleteOrder(options) {
    //get order, if it doesn't exist, return error
    const { data: order, error: orderError } = await db.from('orders').select().eq('orderID', options.orderID).eq('deleted', false).single();
    if (orderError) {
      global.logger.info(`Error getting order ID:${options.orderID}: while deleting order: ${orderError.message}`);
      return { error: orderError.message };
    }
    if (!order.length) {
      global.logger.info(`Error deleting order ${options.orderID}: order does not exist`);
      return { error: 'order does not exist' };
    }

    //change status of related invoice to 'void'
    try {
      await axios.patch(`${process.env.NODE_HOST}:${process.env.PORT}/invoices/${order.invoiceID}`, {
        status: 'void',
      }, {
        headers: {
          'authorization': options.authorization,
        }
      });
    } catch (error) {
      global.logger.info(`Error voiding invoice ${order.invoiceID} while deleting order ${options.orderID}: ${error.message}`);
      return { error: error.message };
    }

    const { data, error } = await db.from('orders').update({ deleted: true }).match({ orderID: options.orderID });

    if (error) {
      global.logger.info(`Error deleting order ${options.orderID}: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Deleted order ${options.orderID}`);
    return data;
  }

  async function existsByOrderID(options) {
    const { data, error } = await db.from('orders').select('orderID').match({ orderID: options.orderID }).eq('deleted', false);

    if (error) {
      global.logger.info(`Error checking whether order ${options.orderID} exists: ${error.message}`);
      return { error: error.message };
    }

    return data.length > 0;
  }

  return {
    create,
    update,
    delete: deleteOrder,
    exists: {
      by: {
        ID: existsByOrderID,
      },
    },
    get: {
      by: {
        orderID: getOrderByID,
      },
      all: getAll,
    },
  };
};
