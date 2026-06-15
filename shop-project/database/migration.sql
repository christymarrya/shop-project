USE cybersec_lab;

-- 0. Clean up NULL values for existing records
UPDATE products SET image_url = '' WHERE image_url IS NULL;

-- 1. Modify existing image_url column constraints
ALTER TABLE products MODIFY COLUMN image_url VARCHAR(500) DEFAULT '' NOT NULL;

-- 2. Add other new columns to products table
ALTER TABLE products 
  ADD COLUMN gallery_urls TEXT DEFAULT NULL,
  ADD COLUMN brand VARCHAR(100) DEFAULT '' NOT NULL,
  ADD COLUMN mrp DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
  ADD COLUMN discount_percent INT DEFAULT 0 NOT NULL,
  ADD COLUMN stock_status ENUM('In Stock', 'Out of Stock') DEFAULT 'In Stock' NOT NULL,
  ADD COLUMN rating DECIMAL(3, 2) DEFAULT 4.00 NOT NULL,
  ADD COLUMN reviews_count INT DEFAULT 0 NOT NULL,
  ADD COLUMN tags VARCHAR(255) DEFAULT '' NOT NULL,
  ADD COLUMN specifications TEXT DEFAULT NULL,
  ADD COLUMN featured TINYINT(1) DEFAULT 0 NOT NULL,
  ADD COLUMN status ENUM('active', 'hidden') DEFAULT 'active' NOT NULL;

-- 3. Create Wishlist Table
CREATE TABLE IF NOT EXISTS wishlist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_wishlist UNIQUE (user_id, product_id)
) ENGINE=InnoDB;
