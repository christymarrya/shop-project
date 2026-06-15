USE cybersec_lab;

-- Seed Sample Users
-- admin123 -> $2b$10$94/k0RRWEdzFjXd20AZO.OtNX0HKeogmYoZ9VDMIZsNJdjB55gCO6
-- user123  -> $2b$10$B67X0SgxDV8LDTZF5Qh9cekrsuUNQdJKsbSbie2HiYeBbb/rToKmC
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2b$10$94/k0RRWEdzFjXd20AZO.OtNX0HKeogmYoZ9VDMIZsNJdjB55gCO6', 'admin@cybersec.lab', 'admin'),
('user', '$2b$10$B67X0SgxDV8LDTZF5Qh9cekrsuUNQdJKsbSbie2HiYeBbb/rToKmC', 'user@cybersec.lab', 'user')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Consumer Products with Extended Schema Columns
INSERT INTO products (
  name, description, category, price, quantity, sku, 
  image_url, gallery_urls, brand, mrp, discount_percent, 
  stock_status, rating, reviews_count, tags, specifications, 
  featured, status
) VALUES
-- Electronics
(
  'Precision Pro 15 Laptop', 
  '15.6-inch high-performance laptop with 16GB RAM, 512GB SSD, Intel Core i7 processor, and stunning FHD display. Perfect for productivity and creative workflows.', 
  'Electronics', 
  899.99, 15, 'LAP-PRC-15',
  'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1496181130204-755241524eab?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=600&q=80',
  'TechBrand', 1199.99, 25,
  'In Stock', 4.80, 120, 'laptop, computer, work, tech',
  'Processor: Intel Core i7\nMemory: 16GB LPDDR4X\nStorage: 512GB NVMe SSD\nDisplay: 15.6\" FHD IPS 300 nits\nOS: Windows 11 Home',
  1, 'active'
),
(
  'Nova 12 Smartphone', 
  '6.5-inch dual-camera smartphone featuring 128GB storage, 5G connectivity, 120Hz refresh rate display, and all-day battery life.', 
  'Electronics', 
  699.99, 20, 'PHN-NOV-12',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80,https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
  'ApexPhone', 899.99, 22,
  'In Stock', 4.50, 85, 'smartphone, phone, mobile, tech',
  'Processor: Octa-Core 5G\nRAM: 8GB\nStorage: 128GB\nCamera: Dual 48MP+12MP\nDisplay: 6.5\" 120Hz Super AMOLED\nBattery: 5000 mAh',
  1, 'active'
),
(
  'Aura Wireless Headphones', 
  'Active noise-canceling over-ear wireless headphones. Provides premium studio sound quality, plush memory foam ear cups, and 40-hour battery life.', 
  'Electronics', 
  149.99, 30, 'AUD-AUR-W',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
  'AudioLux', 199.99, 25,
  'In Stock', 4.60, 240, 'headphones, wireless, bluetooth, music',
  'Type: Over-Ear Wireless\nBattery: Up to 40 Hours (ANC Off)\nConnectivity: Bluetooth 5.2 / 3.5mm Aux\nNoise Canceling: Active Noise Cancellation (ANC)',
  1, 'active'
),
(
  'Apex Mechanical Keyboard', 
  'Tactile blue-switch mechanical gaming keyboard with customizable RGB backlighting, aircraft-grade aluminum frame, and dedicated media controls.', 
  'Electronics', 
  89.99, 40, 'KBD-APX-M',
  'https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?auto=format&fit=crop&w=600&q=80',
  'ApexGamer', 119.99, 25,
  'In Stock', 4.70, 95, 'keyboard, mechanical, rgb, gaming',
  'Switches: Tactile Blue Mechanical\nBacklight: Full RGB Customization\nFrame: Aircraft-Grade Aluminum\nConnection: Wired USB Detachable',
  0, 'active'
),
(
  'Horizon 27-inch 4K Monitor', 
  'Ultra-slim 27\" 4K UHD monitor with IPS panel, HDR support, 99% sRGB color gamut, and dual HDMI and DisplayPort inputs.', 
  'Electronics', 
  299.99, 10, 'MON-HRZ-27',
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
  'TechBrand', 399.99, 25,
  'In Stock', 4.70, 75, 'monitor, screen, 4K, display',
  'Screen Size: 27 inches\nResolution: 4K UHD (3840 x 2160)\nPanel Type: IPS\nRefresh Rate: 60Hz\nInputs: 2x HDMI, 1x DisplayPort',
  0, 'active'
),
(
  'ActiveFit Smart Watch', 
  'Fitness tracker and smartwatch with built-in GPS, heart rate monitor, sleep tracking, and custom notification widgets. Water-resistant up to 50m.', 
  'Electronics', 
  129.99, 60, 'WCH-ACT-F',
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=600&q=80',
  'ApexFit', 179.99, 27,
  'In Stock', 4.50, 180, 'watch, smart, fitness, tracker',
  'Battery Life: Up to 7 Days\nWater Resistance: 5 ATM (50 meters)\nSensors: Heart Rate, GPS, SpO2, Accelerometer\nCompatibility: iOS & Android',
  0, 'active'
),

-- Fashion
(
  'Vintage Leather Jacket', 
  '100% genuine dark brown leather jacket for men. Features classic asymmetric zip closure, multiple zippered utility pockets, and warm lining.', 
  'Fashion', 
  199.50, 15, 'FASH-JKT-L',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80',
  'RetroWear', 299.99, 33,
  'In Stock', 4.40, 48, 'jacket, leather, fashion, mens',
  'Material: 100% Genuine Cowhide Leather\nLining: Polyester Satin\nClosure: Asymmetrical Zipper\nPockets: 4 Exterior Zip Pockets, 2 Interior Pockets',
  0, 'active'
),
(
  'Urban Slim Fit Jeans', 
  'Premium stretch denim jeans for men. Slim fit design with traditional five-pocket styling, vintage wash, and heavy-duty zipper fly.', 
  'Fashion', 
  49.99, 85, 'FASH-JNS-S',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80',
  'RetroWear', 79.99, 37,
  'In Stock', 4.20, 64, 'jeans, slim-fit, denim, fashion',
  'Material: 98% Cotton, 2% Elastane\nFit: Slim Fit\nStyling: 5-Pocket Layout\nCare: Machine Wash Cold',
  0, 'active'
),

-- Home & Kitchen
(
  'Smart Air Fryer XL', 
  '5.8-quart electric air fryer with 10-in-1 touchscreen presets. Uses rapid hot air circulation to cook with up to 85% less oil than deep fryers.', 
  'Home & Kitchen', 
  99.99, 18, 'KTC-AF-XL',
  'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?auto=format&fit=crop&w=600&q=80',
  'ChefPro', 149.99, 33,
  'In Stock', 4.80, 320, 'air fryer, kitchen, cooking, appliance',
  'Capacity: 5.8 Quarts\nPresets: 10 One-Touch Cooking Programs\nTemperature Range: 100°F - 400°F\nPower: 1700W\nDishwasher Safe: Yes',
  1, 'active'
),

-- Books
(
  'The AI Revolution', 
  'A comprehensive look at the past, present, and future of Artificial Intelligence, deep learning systems, and societal implications. Paperback.', 
  'Books', 
  18.50, 100, 'BOK-AI-REV',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  'PressBooks', 24.99, 26,
  'In Stock', 4.30, 52, 'books, AI, technology, learning',
  'Author: Dr. Alan Turing\nPages: 320 Pages\nPublisher: SciTech Publications\nFormat: Paperback\nLanguage: English',
  0, 'active'
),

-- Sports
(
  'Pro Court Grip Basketball', 
  'Official size 7 indoor/outdoor composite leather basketball. Features advanced grip channel technology for consistent bounce and control.', 
  'Sports', 
  29.99, 70, 'SPR-BKB-PC',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=600&q=80',
  'SlamDunk', 39.99, 25,
  'In Stock', 4.60, 110, 'basketball, sports, outdoors, game',
  'Size: Official Size 7 (29.5\")\nMaterial: High-Grip Composite Leather\nUsage: Indoor / Outdoor Play\nChannels: Wide Deep Channel Design',
  0, 'active'
)
ON DUPLICATE KEY UPDATE 
  price=VALUES(price), 
  quantity=VALUES(quantity),
  mrp=VALUES(mrp),
  discount_percent=VALUES(discount_percent),
  rating=VALUES(rating),
  reviews_count=VALUES(reviews_count),
  featured=VALUES(featured),
  status=VALUES(status);
