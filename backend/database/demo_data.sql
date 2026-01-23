-- Demo Data for Event Organizing & Management System (Updated with BCrypt Hashes)

-- Clear existing data (using CASCADE to handle foreign key dependencies)
TRUNCATE TABLE reviews, payments, bookings, event_packages, events, categories, users RESTART IDENTITY CASCADE;

-- 1. Users (1 ADMIN, 2 ORGANIZER, 2 CLIENT)
-- All passwords are set to "[name]123" except the first admin which is "admin123"
INSERT INTO users (name, email, password_hash, role, status) VALUES
('Amit Sharma', 'admin@eventify.com', '$2b$10$Jw6VySXSBPZC6u77l.Be1uYrg8TA7F/6uZ3iyZovIfzh9jFvsFFmi', 'ADMIN', 'ACTIVE'),
('Official Admin', 'admin@gmail.com', '$2b$10$Jw6VySXSBPZC6u77l.Be1uYrg8TA7F/6uZ3iyZovIfzh9jFvsFFmi', 'ADMIN', 'ACTIVE'),
('Priya Kapoor', 'priya.events@gmail.com', '$2b$10$l74APZBKqewKV1VIbJ6baezeSI9JNOoCPRQmD1CNEyUSosf3GJ4H6', 'ORGANIZER', 'ACTIVE'),
('Rahul Verma', 'rahul.organizer@outlook.com', '$2b$10$NWSJd6.5SQZiOc6TPnzfROP2isVJsQYvUN0glITvr4wOq3hx3yJbm', 'ORGANIZER', 'ACTIVE'),
('Sneha Reddy', 'sneha.reddy@gmail.com', '$2b$10$4rfFH4erwajvudNXxRgt8eJWqgb4ZOZVcM79ZyuJxOO2.wK0vNylG', 'CLIENT', 'ACTIVE'),
('Vikram Singh', 'vikram.s@yahoo.com', '$2b$10$cl3aT6v.IR6UukropS8PSeofdooFfhVCL9vK7zC/IV0B3Kax/Ya4W', 'CLIENT', 'ACTIVE');

-- 2. Categories (Complete list since we truncated them)
INSERT INTO categories (name) VALUES 
('Wedding'),        -- ID 1
('Corporate'),      -- ID 2
('Music'),          -- ID 3
('Birthday'),       -- ID 4
('Workshop'),       -- ID 5
('Tech Conference'), -- ID 6
('Sports Meet'),     -- ID 7
('Art Exhibition'),  -- ID 8
('Food Festival'),   -- ID 9
('Fashion Show');    -- ID 10

-- 3. Events (Linked to Organizers and Categories)
-- Organizers (from section 1):
-- Amit Sharma (ID 1 - ADMIN)
-- Official Admin (ID 2 - ADMIN)
-- Priya Kapoor (ID 3 - ORGANIZER)
-- Rahul Verma (ID 4 - ORGANIZER)
INSERT INTO events (organizer_id, category_id, title, description, location, city, start_date, end_date, max_capacity, status) VALUES
(3, 6, 'Global Tech Summit 2026', 'A gathering of industry leaders to discuss the future of AI and Robotics.', 'Tech Park Convention Center', 'Bangalore', '2026-05-15', '2026-05-17', 500, 'APPROVED'),
(3, 3, 'Summer Beats Music Fest', 'An overnight music festival featuring top indie bands and DJs.', 'Green Valley Grounds', 'Pune', '2026-06-10', '2026-06-11', 2000, 'APPROVED'),
(4, 2, 'Corporate Leadership Retreat', 'Exclusive workshop for executive management and team building.', 'Hilltop Resort', 'Lonavala', '2026-04-20', '2026-04-22', 50, 'APPROVED'),
(4, 9, 'Flavor Fusion Food Expo', 'Taste cuisines from around the world with live cooking demos.', 'Exhibition Grounds', 'Mumbai', '2026-07-05', '2026-07-07', 1000, 'APPROVED'),
(3, 1, 'The Royal Heritage Wedding', 'A grand destination wedding management showcase.', 'Heritage Palace', 'Jaipur', '2026-08-12', '2026-08-14', 300, 'PENDING');

-- 4. Event Packages (One per event for simplicity)
INSERT INTO event_packages (event_id, package_name, price, features) VALUES
(1, 'All-Access Pass', 1500.00, 'Includes all workshops\nLunch included\nNetworking dinner'),
(2, 'VIP Entry', 2500.00, 'Front row access\nBackstage tour\nComplimentary drinks'),
(3, 'Executive Package', 5000.00, 'Stay at 5-star resort\nOne-on-one coaching\nPremium course material'),
(4, 'Taster Ticket', 800.00, 'Entry to all food stalls\n5 free tasting coupons\nChef мастер-класс access'),
(5, 'Silver Wedding Plan', 4500.00, 'Decoration setup\nCatering for 100 people\nPhotography services');

-- 5. Bookings (Linked to Clients and Event Packages)
-- Clients are IDs 5 and 6
INSERT INTO bookings (event_id, client_id, package_id, qty, total_amount, booking_status, payment_status) VALUES
(1, 5, 1, 2, 3000.00, 'CONFIRMED', 'PAID'),
(2, 6, 2, 1, 2500.00, 'CONFIRMED', 'PAID'),
(3, 5, 3, 1, 5000.00, 'PENDING', 'UNPAID'),
(4, 6, 4, 3, 2400.00, 'CONFIRMED', 'PAID'),
(5, 5, 5, 1, 4500.00, 'CANCELLED', 'FAILED');

-- 6. Payments (Linked to Bookings)
-- Bookings: 1, 2, 4 are CONFIRMED/PAID
INSERT INTO payments (booking_id, amount, method, upi_app, transaction_id, status) VALUES
(1, 3000.00, 'UPI', 'GPay', 'TXN_SUMMIT_001', 'SUCCESS'),
(2, 2500.00, 'UPI', 'PhonePe', 'TXN_MUSIC_002', 'SUCCESS'),
(4, 2400.00, 'UPI', 'GPay', 'TXN_FOOD_003', 'SUCCESS'),
(5, 4500.00, 'UPI', 'PhonePe', 'TXN_FAIL_004', 'FAILED');

-- 7. Reviews (Linked to Events and Clients)
INSERT INTO reviews (event_id, client_id, rating, comment) VALUES
(1, 5, 5, 'Perfectly organized! The AI panel was mind-blowing.'),
(2, 6, 4, 'Great music, but the entry process was a bit slow.'),
(4, 6, 5, 'Delicious food and amazing atmosphere. Highly recommended!'),
(1, 6, 4, 'Very informative but seating was a bit cramped.'),
(3, 5, 3, 'Interesting content but the venue was quite far.');
