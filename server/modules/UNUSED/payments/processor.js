('use strict');

module.exports = ({ db }) => {
  async function create(options) {
    const { customID, userID, method, invoiceID, amount, receivedTime } = options;

    //if amount is 0 or negative, return an error
    if (amount <= 0) {
      global.logger.info(`Amount must be greater than 0`);
      return { error: `Amount must be greater than 0` };
    }

    //get invoice totalBillable
    const { data: invoice, error: invoiceError } = await db.from('invoices').select('totalBillable').eq('invoiceID', invoiceID).single();

    if (invoiceError) {
      global.logger.info(`Error getting invoice when adding new payment: ${invoiceError.message}`);
      return { error: invoiceError.message };
    }

    //need to get all existing payments for this invoice. If the sum of all payments plus the new one is greater than the invoice total, return an error
    const { data: existingPayments, error: existingPaymentsError } = await db.from('payments').select('amount', 'paymentID').eq('invoiceID', invoiceID);

    if (existingPaymentsError) {
      global.logger.info(`Error getting existingpayments of invoice when adding new payment: ${existingPaymentsError.message}`);
      return { error: existingPaymentsError.message };
    }

    const existingPaymentsTotal = existingPayments.reduce((acc, payment) => {
      return acc + payment.amount;
    }, 0);

    if (existingPaymentsTotal + amount > invoice.totalBillable) {
      global.logger.info(`Amount of new payment plus existing payments is greater than invoice total`);
      return { error: `Amount of new payment plus existing payments is greater than invoice total` };
    }

    //otherwise, prepare new invoiceStatus and create the payment
    let newStatus = 'paymentFull';
    if (existingPaymentsTotal + amount < invoice.totalBillable) {
      newStatus = 'paymentPartial';
    }

    const { data: newPayment, error } = await db
      .from('payments')
      .insert({
        paymentID: customID,
        userID,
        receivedTime: receivedTime ? receivedTime : new Date().toISOString(),
        method,
        invoiceID,
        amount,
      })
      .select('paymentID')
      .single();

    if (error) {
      global.logger.info(`Error creating payment: ${error.message}`);
      return { error: error.message };
    }

    //update invoice status
    const { error: updateInvoiceError } = await db
      .from('invoices')
      .update({
        status: newStatus,
      })
      .eq('invoiceID', invoiceID);

    if (updateInvoiceError) {
      global.logger.info(`Error updating invoice status: ${updateInvoiceError.message}`);
      return { error: updateInvoiceError.message };
    }

    global.logger.info(`Created paymentID: ${newPayment.paymentID}, and updated status of invoiceID: ${invoiceID} to ${newStatus}`);
    return newPayment;
  }

  async function getAll(options) {
    const { userID, paymentIDs, invoiceID, method, dateRange } = options;

    let q = db.from('payments').select().filter('userID', 'eq', userID).eq('deleted', false).order('paymentID', { ascending: true });

    if (paymentIDs) {
      q = q.in('paymentID', paymentIDs);
    }
    if (invoiceID) {
      q = q.filter('invoiceID', 'eq', invoiceID);
    }
    if (method) {
      q = q.filter('method', 'eq', method);
    }
    if (dateRange) {
      q = q.gte('receivedTime', dateRange[0]).lte('receivedTime', dateRange[1]);
    }

    const { data: payments, error } = await q;

    if (error) {
      global.logger.info(`Error getting payments: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Got ${payments.length} payments`);
    return payments;
  }

  return {
    get: {
      all: getAll,
    },
    create,
  };
};
