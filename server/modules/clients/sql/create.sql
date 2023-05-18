INSERT INTO tbl_clients (name_first, name_last, email, phone, address_1, address_2, city, state)
VALUES ('{{firstName}}', '{{lastName}}', '{{email}}', '{{phone}}', '{{address1}}', '{{address2}}', '{{city}}', '{{state}}')
RETURNING client_id, name_first, name_last, email, phone, address_1, address_2, city, state;
