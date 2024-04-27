const { calculateLocalTax } = require('../../../services/taxes');
const { updater } = require('../../../db');

('use strict');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { userID, invoiceIDs, type, status, subtotalMin, subtotalMax } = options;

    let q = db.from('invoices').select().filter('userID', 'eq', userID).eq('deleted', false).order('invoiceID', { ascending: true });

    if (invoiceIDs) {
      q = q.in('invoiceID', invoiceIDs);
    }
    if (type) {
      q = q.filter('type', 'eq', type);
    }
    if (status) {
      q = q.filter('status', 'eq', status);
    }
    if (subtotalMin) {
      q = q.gte('subtotal', subtotalMin);
    }
    if (subtotalMax) {
      q = q.lte('subtotal', subtotalMax);
    }

    const { data: invoices, error } = await q;

    if (error) {
      global.logger.info(`Error getting invoices: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got invoices`);
    return invoices;
  }

  async function create(options) {
    const { customID, userID, type, status, subtotal } = options;

    //if subtotal is 0 or negative, return an error
    if (subtotal <= 0) {
      global.logger.info(`Subtotal must be greater than 0`);
      return { error: `Subtotal must be greater than 0` };
    }

    const taxesFees = await calculateLocalTax(subtotal);

    const { data, error } = await db
      .from('invoices')
      .insert({
        invoiceID: customID,
        userID,
        createdTime: new Date().toISOString(),
        type,
        status,
        subtotal,
        taxesFees,
        totalBillable: subtotal + taxesFees,
      })
      .select('invoiceID');

    if (error) {
      global.logger.info(`Error creating invoice: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Created invoice`);
    return data;
  }

  async function update(options) {
    const updatedFields = {};
    for (let key in options) {
      if (key !== 'invoiceID' && options[key] !== undefined) {
        updatedFields[key] = options[key];
      }
    }
    //if subtotal is 0 or negative, return an error
    if (updatedFields.subtotal <= 0) {
      global.logger.info(`Subtotal must be greater than 0`);
      return { error: `Subtotal must be greater than 0` };
    }

    const taxesFees = await calculateLocalTax(updatedFields.subtotal);

    //only update taxesFees and totalBillable if subtotal is being updated
    if (options.subtotal) {
      updatedFields.taxesFees = taxesFees;
      updatedFields.totalBillable = updatedFields.subtotal + taxesFees;
    }

    try {
      const updatedInvoice = await updater('invoiceID', options.invoiceID, 'invoices', updatedFields);
      global.logger.info(`Updated invoice ${options.invoiceID}`);
      return updatedInvoice;
    } catch (error) {
      global.logger.info(`Error updating invoice ${options.invoiceID}: ${error.message}`);
      return { error: error.message };
    }
  }

  async function existsByInvoiceID(options) {
    const { data, error } = await db.from('invoices').select('invoiceID').eq('invoiceID', options.invoiceID).eq('deleted', false);
    if (error) {
      global.logger.info(`Error checking if invoice ${options.invoiceID} exists: ${error.message}`);
      return { error: error.message };
    }
    return data.length > 0;
  }

  return {
    create,
    update,
    exists: {
      by: {
        invoiceID: existsByInvoiceID,
      },
    },
    get: {
      all: getAll,
    },
  };
};
