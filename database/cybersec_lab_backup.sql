-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: cybersec_lab
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price_at_purchase` decimal(10,2) NOT NULL,
  `order_group_id` varchar(50) NOT NULL,
  `order_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `order_status` enum('Pending','Confirmed','Processing','Shipped','Out for Delivery','Delivered','Cancelled','Returned') NOT NULL DEFAULT 'Pending',
  `payment_status` varchar(50) NOT NULL DEFAULT 'Paid',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,6,38,2,1299.99,'ORD-A37D35209322','2026-06-12 05:43:59','Cancelled','Paid','2026-06-12 08:43:15'),(2,6,41,4,399.99,'ORD-A37D35209322','2026-06-12 05:43:59','Cancelled','Paid','2026-06-12 08:43:15'),(3,9,11,2,199.50,'ORD-F1C240213B01','2026-06-12 07:07:19','Delivered','Paid','2026-06-12 07:07:19'),(4,9,11,1,199.50,'ORD-60CE4D145BED','2026-06-12 07:07:19','Cancelled','Paid','2026-06-12 07:07:19'),(5,9,11,2,199.50,'ORD-4A108D403E5E','2026-06-12 07:07:46','Delivered','Paid','2026-06-12 07:07:46'),(6,9,11,1,199.50,'ORD-90E080075FEA','2026-06-12 07:07:46','Cancelled','Paid','2026-06-12 07:07:46'),(7,6,53,1,26900.00,'ORD-A2B17557F0A6','2026-06-12 08:43:28','Delivered','Paid','2026-06-12 08:53:13');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `category` varchar(50) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `sku` varchar(50) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(500) NOT NULL DEFAULT '',
  `gallery_urls` text,
  `brand` varchar(100) NOT NULL DEFAULT '',
  `mrp` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount_percent` int NOT NULL DEFAULT '0',
  `stock_status` enum('In Stock','Out of Stock') NOT NULL DEFAULT 'In Stock',
  `rating` decimal(3,2) NOT NULL DEFAULT '4.00',
  `reviews_count` int NOT NULL DEFAULT '0',
  `tags` varchar(255) NOT NULL DEFAULT '',
  `specifications` text,
  `featured` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','hidden') NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (11,'Vintage Leather Jacket','100% genuine dark brown leather jacket for men. Features classic asymmetric zip closure, multiple zippered utility pockets, and warm lining.','Fashion',1999.50,11,'FASH-JKT-L','2026-06-11 10:15:47','/uploads/product-images/product-1781243966256-550831709.webp',NULL,'Boulevard Rider ',2999.98,33,'In Stock',4.40,48,'','',1,'active'),(12,'Urban Slim Fit Jeans','Premium stretch denim jeans for men. Slim fit design with traditional five-pocket styling, vintage wash, and heavy-duty zipper fly.','Fashion',599.99,7,'FASH-JNS-S','2026-06-11 10:15:47','/uploads/product-images/product-1781243882417-632988701.jpg',NULL,'Urbano ',799.99,25,'In Stock',4.20,64,'','',1,'active'),(13,'Smart Air Fryer XL','5.8-quart electric air fryer with 10-in-1 touchscreen presets. Uses rapid hot air circulation to cook with up to 85% less oil than deep fryers.','Home & Kitchen',5999.99,18,'KTC-AF-XL','2026-06-11 10:15:47','/uploads/product-images/product-1781244149095-360899979.webp',NULL,'SOLARA ',7999.99,25,'In Stock',4.80,320,'','',1,'active'),(14,'Stainless Steel Cookware Set','10-piece professional-grade stainless steel pots and pans set. Features heavy-gauge aluminum core base for fast, even heat distribution.','Home & Kitchen',3000.00,2,'KTC-CW-SS','2026-06-11 10:15:47','/uploads/product-images/product-1781243762278-409027895.webp',NULL,'solara',3500.00,14,'In Stock',4.00,0,'','',0,'active'),(15,'The AI Revolution','A comprehensive look at the past, present, and future of Artificial Intelligence, deep learning systems, and societal implications. Paperback.','Books',500.00,2,'BOK-AI-REV','2026-06-11 10:15:47','/uploads/product-images/product-1781243575482-871299552.jpg',NULL,'Scholastic Ireland',700.00,29,'In Stock',4.30,52,'','',0,'active'),(16,'Master Python Programming','Step-by-step developer guide to learning advanced Python programming concepts, web APIs, data structures, and database scripting. Paperback.','Books',300.00,12,'BOK-PY-MST','2026-06-11 10:15:47','/uploads/product-images/product-1781243391498-111903177.jpg',NULL,'',499.98,40,'In Stock',4.00,0,'','',1,'active'),(17,'Pro Court Grip Basketball','Official size 7 indoor/outdoor composite leather basketball. Features advanced grip channel technology for consistent bounce and control.','Sports',1900.00,7,'SPR-BKB-PC','2026-06-11 10:15:47','/uploads/product-images/product-1781243329136-625923187.jpg',NULL,'',2500.00,24,'In Stock',4.60,110,'','',0,'active'),(18,'BalanceFit Eco Yoga Mat','6mm thick non-slip eco-friendly TPE yoga mat. Provides comfortable joint cushioning, dual-sided traction texture, and carry strap.','Sports',700.00,6,'SPR-MAT-BF','2026-06-11 10:15:47','/uploads/product-images/product-1781243280268-368117688.jpg',NULL,'',900.00,22,'In Stock',4.00,0,'','',0,'active'),(37,'Gaming Mouse X','RGB gaming mouse with programmable buttons','Electronics',1179.99,2,'MOU-GMX-01','2026-06-11 10:30:42','/uploads/product-images/product-1781258742912-19750270.webp',NULL,'',1299.98,9,'In Stock',4.00,0,'','',0,'active'),(38,'iPhone 17 Pro','Latest Apple smartphone\r\n\r\nCore Performance & Hardware\r\n\r\nProcessor: Apple A19 Pro chip built on a 3nm architecture.\r\n\r\nCPU Structure: Hexa-core configuration with 2 performance cores and 4 efficiency cores.\r\n\r\nGraphics & AI: 6-core GPU with Neural Accelerators and a dedicated 16-core Neural Engine.\r\n\r\nMemory: Equipped with 12GB RAM.\r\n\r\nStorage Variants: Available choices include 256GB, 512GB, and 1TB configurations.\r\n\r\nThermal Management: First-generation integrated laser-welded vapour chamber using deionised water to handle local AI workloads.','Electronics',124000.00,7,'IPH-17P','2026-06-11 10:31:24','/uploads/product-images/product-1781255274785-929680484.webp',NULL,'iPhone 17 Pro',150000.00,17,'In Stock',4.00,0,'','',1,'active'),(39,'Samsung Galaxy S23','Flagship Android smartphone\r\n\r\nKey Specifications\r\n\r\nDisplay: 6.1\" Dynamic AMOLED 2X with a smooth 120Hz refresh rate\r\n\r\nProcessor: Qualcomm Snapdragon 8 Gen 2 (For Galaxy)Camera System: 50MP main, 10MP telephoto (3x optical zoom), and 12MP ultra-wide lenses\r\n\r\nBattery: 3,900 mAh with 25W fast charging and wireless charging support\r\n\r\nDurability: Armor Aluminum frame with Corning Gorilla Glass Victus 2 on the front and back','Electronics',75000.00,4,'SAM-S23','2026-06-11 10:31:24','/uploads/product-images/product-1781260471593-591831725.jpg',NULL,'Samsung ',78000.00,4,'In Stock',4.00,0,'','',0,'active'),(40,'Dell XPS 15','Premium productivity laptop\r\n\r\nPremium productivity laptop\r\n\r\nDell XPS 16: The Futuristic Vision\r\n\r\nThe Dell XPS 16 Laptop represents a complete radical shift in premium laptop design, focusing heavily on minimalist aesthetics and raw performance.\r\n\r\nDesign: Crafted from CNC-machined aluminum and Gorilla Glass 3. It features a striking, completely seamless palm rest where the trackpad is entirely hidden from view.\r\n\r\nKeyboard & Controls: Uses a \"zero-lattice\" keyboard with large, flat keycaps and minimal spacing. The traditional top row is replaced by a glowing, touch-capacitive LED function bar.\r\n\r\nTrackpad: Features a custom haptic feedback motor underneath the glass layer. It mimics physical clicks using precise vibrations, allowing you to click anywhere on the lower deck.\r\n\r\nPerformance Focus: Built for heavy-duty AI processing, 3D rendering, and professional video editing. It sacrifices post-purchase part upgrades for faster, tighter internal efficiency.','Electronics',45000.00,1,'DEL-XPS15','2026-06-11 10:31:24','/uploads/product-images/product-1781242542476-88425531.webp',NULL,'',46000.00,2,'In Stock',4.00,0,'','',0,'active'),(41,'Sony WH-1000XM7','Noise cancelling headphones\r\n\r\nForm Factor: Circumaural (Over-Ear)\r\n\r\nNoise Cancellation: Fully adaptive Active Noise Cancellation (ANC) with AI machine learning and real-time environment recognition \r\n\r\nAudio Technology: High-Resolution Audio support, LDAC codec, and AI-driven DSEE Extreme for upscaling compressed music files \r\n\r\nMicrophone: Advanced multi-mic beamforming array with AI background noise-reduction for crystal-clear hands-free calls even in windy environments\r\n\r\nConnectivity: Bluetooth with multipoint pairing (connect to multiple devices simultaneously) and low latency\r\n\r\nBattery Life: Up to 30 hours of continuous music playback with ANC turned on; fast charging support\r\n\r\nControls: Intuitive touch sensors on the earcups alongside physical buttons for power and ANC adjustments\r\n\r\nApp Support: Integrates with the official Sony Headphones Connect / Sound Connect application for EQ tuning and custom listening profiles\r\n\r\nAs a premium iteration in the 1000X line, the XM7 targets high-end wireless ecosystems and improves upon previous iterations with deeper processing power and enhanced structural comfort','Electronics',800.00,10,'SON-WH7','2026-06-11 10:31:24','/uploads/product-images/product-1781241784075-997152739.png',NULL,'Sony',1000.00,20,'In Stock',4.00,0,'','',1,'active'),(53,'Dyson OnTrac™ headphones Ceramic Cinnabar','Best-in-class noise cancellation. Enhanced audio range\r\n\r\nLong lasting battery life1 of 55 hours on one charge\r\n\r\nHeadphones, remastered\r\n\r\n','Electronics',26900.00,2,'Dyson OnTrac™ headphones','2026-06-12 06:06:06','/uploads/product-images/product-1781244366940-826806308.jpg','','OnTrac',44999.00,40,'In Stock',4.00,0,'','',1,'active'),(55,'Kurti','','Fashion',399.00,4,'Kurti','2026-06-12 07:14:23','/uploads/product-images/product-1781248463352-327188435.jpg','','sambalpuri elegance',599.00,33,'In Stock',4.00,0,'','',1,'active'),(56,'DRESS AND JACKET FOR WOMEN','Product Highlights\r\n\r\nCOPY\r\nColor\r\nBlack\r\n\r\nFabric\r\nCrepe\r\n\r\nFit/ Shape\r\nFit and Flare\r\n\r\nLength\r\nCalf-Length\r\n\r\nAdditional Details\r\nNeck\r\nShoulder Straps\r\n\r\nPrint or Pattern Type\r\nSolid\r\n\r\nSurface Styling\r\nSmocking or Shirred\r\n\r\nOcassion\r\nCasual\r\n\r\nSleeve Length\r\nSleeveless\r\n\r\nSleeve Styling\r\nShoulder Strap\r\n\r\nPattern\r\nSolid\r\n\r\nNet Quantity (N)\r\n1\r\n\r\nAdd On\r\nJacket\r\n\r\nCharacter\r\nWonder Woman\r\n\r\nTYPE\r\nOne Piece\r\n\r\nGeneric Name\r\nDresses\r\n\r\nCountry of Origin\r\nIndia\r\n\r\nMore Information','Fashion',600.00,5,'DAJFW','2026-06-12 08:36:55','/uploads/product-images/product-1781260327435-647978556.jpg','','Dress',800.00,25,'In Stock',4.00,0,'','',1,'active'),(57,'800ML Manually Handy Chopper Mixer Cut For Vegetable, Onion, Salad, Tomato Crush Chopper ','Product Highlights\r\n\r\nCOPY\r\nType\r\nChopper\r\n\r\nElectric\r\nNo\r\n\r\nBlade Material\r\nStainless Steel\r\n\r\nBody Material\r\nPlastic\r\n\r\nAdditional Details\r\nNet Quantity (N)\r\nPack Of 1\r\n\r\nColor\r\nMulticolor\r\n\r\nProduct Weight Unit\r\nG\r\n\r\nProduct Breadth\r\n6\r\n\r\nPackaging Unit\r\nCm\r\n\r\nPackaging Breadth\r\n6\r\n\r\nPackaging Weight Unit\r\nG\r\n\r\nIdeal Usage\r\nVegetable & Fruit\r\n\r\nPackaging Weight\r\n50\r\n\r\nPackaging Length\r\n8\r\n\r\nProduct Height\r\n8\r\n\r\nProduct Weight\r\n100\r\n\r\nPackaging Height\r\n8\r\n\r\nProduct Length\r\n8\r\n\r\nProduct Unit\r\nCm\r\n\r\nPower Consumption\r\n100 Watts\r\n\r\nWarranty Period\r\nNo Warranty\r\n\r\nOperating Voltage\r\n100 Volts\r\n\r\nPower Source\r\nAC Powered\r\n\r\nGeneric Name\r\nMini Food Processors & Choppers\r\n\r\nCountry of Origin\r\nIndia\r\n\r\nProduct Safety Information\r\nProduct may be regulated by BIS Quality Control Order. Visit https://www.bis.gov.in/know-your-standard/ for more information; check IS mark on item/ upon delivery.','Home & Kitchen',165.00,4,'CH-1','2026-06-12 09:05:04','/uploads/product-images/product-1781255104070-265857427.jpg','','',180.00,8,'In Stock',4.00,0,'','',1,'active'),(58,'GYM- T-shirts','Product details\r\n\r\nTop highlights\r\n\r\nMaterial composition100% Polyester\r\nFit type: Athletic Fit\r\nSleeve type: Half Sleeve\r\nCollar style: Crew Neck\r\nLengthStandard Length\r\nNeck style: Round Neck\r\nCountry of Origin: India\r\n\r\nAbout this item\r\nLightweight Fabric\r\nMoisture-Wicking\r\nLightweight & Breathable\r\nAdditional Information\r\nManufacturer3Colours RGB,CHENNAI 600061\r\nPacker3Colours RGB,CHENNAI 600061\r\nItem Weight200 g\r\nItem Dimensions LxWxH20 x 20 x 2 Centimeters\r\nNet Quantity1 Count\r\nGeneric Name: T-Shirt','Sports',157.00,3,'GYM-B','2026-06-12 09:12:29','/uploads/product-images/product-1781260244299-415360656.jpg','','T- shirts',180.00,13,'In Stock',4.00,0,'','',0,'active'),(59,'Formal ','','Fashion',800.00,6,'FORMAL-1','2026-06-12 10:29:06','/uploads/product-images/product-1781260146631-841990274.jpg','','Formal',1000.00,20,'In Stock',4.00,0,'','',1,'active');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,'user','$2b$10$B67X0SgxDV8LDTZF5Qh9cekrsuUNQdJKsbSbie2HiYeBbb/rToKmC','user@cybersec.lab','user','2026-06-11 10:15:47'),(5,'christymarryageorge','$2a$10$iI6jRtOk9D1Rli5wZa45KOaWruvYHyv1oDdqdSHlFDm0bEuAhcJwi','christymarryageorge@gmail.com','admin','2026-06-11 10:20:12'),(6,'Krupa George','$2a$10$4hw5yKadOTGtVo.8cgKbeOzs5mbQJlAroX2uUalO/VmiRVEgs9kUm','chxistymarrya@gmail.com','user','2026-06-12 04:25:48'),(9,'admin','$2a$10$tlDeNHk6wZseBJeiYbCYpu6fRjMrJ8nNKDJBmjrEYdrEY.yxH7lJy','admin@cybersec.lab','admin','2026-06-12 06:17:15'),(10,'admin_test','$2a$10$y4hZcatRQcGnzO8IcV3B0u7rhwsy3hoTeQJXRBjgo9Wfdb0kGRXim','test@admin.com','user','2026-06-12 06:23:54'),(11,'admin_sz','$2a$10$YoV0qga6ZOslkXcV7kNFG.nMJ.mHvalX9E.AZdpxMeuD3TTcB1uv2','admin@shopzone.com','user','2026-06-12 06:26:52');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_wishlist` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist`
--

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
INSERT INTO `wishlist` VALUES (1,6,53,'2026-06-12 08:42:08'),(2,9,58,'2026-06-12 09:51:13');
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;
--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(50) NOT NULL,
  `role` varchar(50) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `action` text NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `details` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lab_users`
--

DROP TABLE IF EXISTS `lab_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lab_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `secret_note` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lab_users`
--

LOCK TABLES `lab_users` WRITE;
/*!40000 ALTER TABLE `lab_users` DISABLE KEYS */;
INSERT INTO `lab_users` VALUES (1,'admin_demo','DemoPass123','FLAG{sqli_demo_success_99182}'),(2,'user_demo','UserPass456','Welcome to the secure user area!');
/*!40000 ALTER TABLE `lab_users` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-13 12:55:03
