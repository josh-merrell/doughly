SELECT
  c.clientID 'clientID',
  c.firstName 'firstName',
  c.lastName 'lastName'
  c.email 'email',
  c.phone 'phone',
  c.address_1 'address_1',
  c.address_2 'address_2',
  c.city 'city',
  c.state 'state',
FROM tbl_clients c
  WHERE c.clientID > ?cursor?
  {{filter}}
ORDER BY
  c.clientID ASC
LIMIT
  ?limit?
OFFSET
  ?cursor?