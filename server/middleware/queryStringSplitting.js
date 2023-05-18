function queryItemsSplitter(items) {
  return (req, res, next) => {
    if (items) {
      req.query[items] = req.query[items].split(',').map(Number);
    }
    next();
  };
}

module.exports = { queryItemsSplitter };
