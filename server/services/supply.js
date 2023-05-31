/**

in: 
  - neededQuantity
  - stockProductID
  - needByDate
out:
  - status ['sufficient', 'insufficient']

**/

const supplyCheck = async (neededQuantity, stockProductID, needByDate) => {
  return 'sufficient'; //TODO implement
};

module.exports = {
  supplyCheck,
};
