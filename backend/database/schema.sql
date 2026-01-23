-- Database Schema for Event Organizing & Management System

-- Users Table
CREATE TYPE user_role AS ENUM ('ADMIN', 'ORGANIZER', 'CLIENT');
CREATE TYPE user_status AS ENUM ('ACTIVE', 'BLOCKED', 'PENDING_VERIFICATION');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'CLIENT',
    status user_status DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);

-- Events Table
CREATE TYPE event_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    city VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    max_capacity INTEGER DEFAULT 0,
    status event_status DEFAULT 'PENDING',
    banner_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Event Packages Table
CREATE TABLE event_packages (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    package_name VARCHAR(100) NOT NULL, -- e.g., Basic, Standard, Premium
    price DECIMAL(10, 2) NOT NULL,
    features TEXT -- newline separated or JSON string
);

-- Bookings Table
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');
CREATE TYPE payment_status AS ENUM ('UNPAID', 'PAID', 'FAILED');

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    package_id INTEGER REFERENCES event_packages(id) ON DELETE CASCADE,
    qty INTEGER DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_status booking_status DEFAULT 'PENDING',
    payment_status payment_status DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TYPE payment_method AS ENUM ('UPI');
CREATE TYPE payment_app AS ENUM ('PhonePe', 'GPay');
CREATE TYPE payment_transaction_status AS ENUM ('SUCCESS', 'FAILED');

CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    method payment_method DEFAULT 'UPI',
    upi_app payment_app,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    status payment_transaction_status DEFAULT 'SUCCESS',
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Data
INSERT INTO categories (name) VALUES ('Wedding'), ('Corporate'), ('Music'), ('Birthday'), ('Workshop');
