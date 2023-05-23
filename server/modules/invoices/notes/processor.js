('use strict');

module.exports = ({ db }) => {
  async function getAll(options) {
    const { invoiceNoteIDs, invoiceID } = options;

    let q = db.from('invoiceNotes').select().order('invoiceNoteID', { ascending: true });

    if (invoiceNoteIDs) {
      q = q.in('invoiceNoteID', invoiceNoteIDs);
    }
    if (invoiceID) {
      q = q.eq('invoiceID', invoiceID);
    }

    const { data: invoiceNotes, error } = await q;

    if (error) {
      global.logger.info(`Error getting invoiceNotes: ${error.message}`);
      return { error: error.message };
    }
    global.logger.info(`Got invoiceNotes`);
    return invoiceNotes;
  }

  async function create(options) {
    const { invoiceID, note } = options;
    //verify that the provided invoiceID exists, return error if not
    const invoice = await db.from('invoices').select().eq('invoiceID', invoiceID);
    if (!invoice) {
      global.logger.info(`Invoice with provided ID (${invoiceID}) does not exist`);
      return { error: `Invoice with provided ID (${invoiceID}) does not exist` };
    }

    //add note to invoice
    const { data, error } = await db.from('invoiceNotes').insert({ invoiceID, note, time: new Date().toISOString() });

    if (error) {
      global.logger.info(`Error creating invoiceNote: ${error.message}`);
      return { error: error.message };
    }

    global.logger.info(`Created invoiceNote`);
    return data;
  }

  return {
    get: {
      all: getAll,
    },
    create,
  };
};
