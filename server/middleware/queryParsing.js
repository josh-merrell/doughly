const queryArrayParser = (req, res, next) => {
  for (const key in req.query) {
    const value = req.query[key];

    // if the key ends with "IDs", parse the value into an array
    if (key.endsWith('IDs') || key.endsWith('ateRange') || key.endsWith('imeRange') || key.endsWith('ourRange')) {
      req.query[key] = value.split(',').map((item) => {
        // Attempt to convert numeric strings to numbers
        const parsedNumber = Number(item);
        return isNaN(parsedNumber) ? item : parsedNumber;
      });
    }
  }

  next();
};

module.exports = { queryArrayParser };
