const calculateLocalTax = async (subtotal) => {
  return subtotal * process.env.LOCAL_TAX_RATE;
};

module.exports = {
  calculateLocalTax,
};
