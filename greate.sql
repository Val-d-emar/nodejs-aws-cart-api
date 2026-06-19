-- =========================================================================
-- 1. DATABASE STRUCTURE 
-- =========================================================================

DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TYPE IF EXISTS cart_status CASCADE;

CREATE TYPE cart_status AS ENUM ('OPEN', 'ORDERED');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  password VARCHAR NOT NULL
);

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at DATE NOT NULL DEFAULT CURRENT_DATE,
  updated_at DATE NOT NULL DEFAULT CURRENT_DATE,
  status cart_status NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE cart_items (
  cart_id UUID REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (cart_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cart_id UUID REFERENCES carts(id) ON DELETE NO ACTION,
  payment JSONB NOT NULL,
  delivery JSONB NOT NULL,
  comments TEXT,
  status VARCHAR NOT NULL DEFAULT 'IN_PROGRESS',
  total NUMERIC NOT NULL
);

-- =========================================================================
-- 2. TEST DATA SEEDING 
-- =========================================================================

INSERT INTO users (id, name, password) VALUES 
('e0b24ac9-92fd-45b3-b995-14eddca275f4', 'Val-d-emar', 'TEST_PASSWORD');

INSERT INTO carts (id, user_id, status) VALUES 
('369fee86-2b99-4c57-b507-13b82794e5e9', 'e0b24ac9-92fd-45b3-b995-14eddca275f4', 'OPEN');

INSERT INTO cart_items (cart_id, product_id, count) VALUES 
('369fee86-2b99-4c57-b507-13b82794e5e9', '7567ec4b-b10c-48c5-9345-fc73c48a80aa', 2);
