USE cybersec_lab;

ALTER TABLE orders 
  ADD COLUMN order_status ENUM('Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned') DEFAULT 'Pending' NOT NULL,
  ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Paid' NOT NULL,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
