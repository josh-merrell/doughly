function queryItemsSplitter(items) {
  return (req, res, next) => {
    if (req.query[items] !== undefined) {
      req.query[items] = req.query[items].split(',').map(Number);
    }
    next();
  };
}

module.exports = { queryItemsSplitter };
