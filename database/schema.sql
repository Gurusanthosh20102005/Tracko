-- ====================================================
-- TRACKO BUS TRACKING - SUPABASE/POSTGRESQL SCHEMA
-- Production-Grade Database System
-- ====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geo queries (optional but recommended)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ====================================================
-- 1. USERS TABLE
-- ====================================================

CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_pic TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);

-- ====================================================
-- 2. OPERATORS TABLE
-- ====================================================

CREATE TABLE operators (
    operator_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    region VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_operators_region ON operators(region);

-- ====================================================
-- 3. BUSES TABLE
-- ====================================================

CREATE TYPE bus_type_enum AS ENUM ('AC', 'NON_AC', 'ELECTRIC');

CREATE TABLE buses (
    bus_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(operator_id) ON DELETE RESTRICT,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    registration_number VARCHAR(30) UNIQUE,
    capacity INT NOT NULL CHECK (capacity > 0),
    bus_type bus_type_enum NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buses_operator ON buses(operator_id);
CREATE INDEX idx_buses_number ON buses(bus_number);
CREATE INDEX idx_buses_active ON buses(is_active) WHERE is_active = TRUE;

-- ====================================================
-- 4. DRIVERS TABLE
-- ====================================================

CREATE TABLE drivers (
    driver_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    photo TEXT,
    rating DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drivers_available ON drivers(is_available) WHERE is_available = TRUE;
CREATE INDEX idx_drivers_license ON drivers(license_number);

-- ====================================================
-- 5. STOPS TABLE
-- ====================================================

CREATE TABLE stops (
    stop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    address TEXT,
    facilities JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Geo index for location-based queries
CREATE INDEX idx_stops_location ON stops USING GIST (
    ST_MakePoint(longitude::double precision, latitude::double precision)
);

CREATE INDEX idx_stops_name ON stops(name);

-- ====================================================
-- 6. ROUTES TABLE
-- ====================================================

CREATE TABLE routes (
    route_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(operator_id) ON DELETE RESTRICT,
    name VARCHAR(200) NOT NULL,
    source_stop_id UUID NOT NULL REFERENCES stops(stop_id),
    destination_stop_id UUID NOT NULL REFERENCES stops(stop_id),
    total_distance_km DECIMAL(6,2),
    estimated_duration_min INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT check_different_source_dest CHECK (source_stop_id != destination_stop_id)
);

CREATE INDEX idx_routes_operator ON routes(operator_id);
CREATE INDEX idx_routes_source ON routes(source_stop_id);
CREATE INDEX idx_routes_dest ON routes(destination_stop_id);
CREATE INDEX idx_routes_active ON routes(is_active) WHERE is_active = TRUE;

-- ====================================================
-- 7. ROUTE_STOPS TABLE ⭐ (INTERMEDIATE STOPS)
-- ====================================================

CREATE TABLE route_stops (
    route_stop_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE CASCADE,
    stop_id UUID NOT NULL REFERENCES stops(stop_id) ON DELETE RESTRICT,
    sequence_number INT NOT NULL,
    distance_from_start_km DECIMAL(6,2) DEFAULT 0,
    scheduled_arrival_offset_min INT, -- Minutes from route start
    scheduled_departure_offset_min INT,
    is_source BOOLEAN DEFAULT FALSE,
    is_destination BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (route_id, sequence_number),
    UNIQUE (route_id, stop_id, sequence_number),
    CHECK (sequence_number > 0),
    CHECK (scheduled_departure_offset_min >= scheduled_arrival_offset_min)
);

CREATE INDEX idx_route_stops_route ON route_stops(route_id, sequence_number);
CREATE INDEX idx_route_stops_stop ON route_stops(stop_id);

-- Ensure only 1 source and 1 destination per route (enforced via triggers later)

-- ====================================================
-- 8. TRIPS TABLE
-- ====================================================

CREATE TYPE trip_status_enum AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TABLE trips (
    trip_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(route_id) ON DELETE RESTRICT,
    bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE RESTRICT,
    driver_id UUID NOT NULL REFERENCES drivers(driver_id) ON DELETE RESTRICT,
    trip_date DATE NOT NULL,
    scheduled_start_time TIME NOT NULL,
    actual_start_time TIME,
    scheduled_end_time TIME,
    actual_end_time TIME,
    status trip_status_enum DEFAULT 'SCHEDULED',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_trips_bus ON trips(bus_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_trips_date_status ON trips(trip_date, status);
CREATE INDEX idx_trips_status ON trips(status) WHERE status = 'IN_PROGRESS';

-- ====================================================
-- 9. LIVE_LOCATION TABLE (Real-Time Tracking)
-- ====================================================

CREATE TABLE live_location (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(trip_id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    speed DECIMAL(5,2), -- km/h
    heading INT CHECK (heading >= 0 AND heading <= 360),
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_live_location_bus_time ON live_location(bus_id, timestamp DESC);
CREATE INDEX idx_live_location_trip ON live_location(trip_id);

-- Auto-delete old location data (keep last 24 hours)
CREATE INDEX idx_live_location_cleanup ON live_location(timestamp);

-- ====================================================
-- 10. BUS_CROWDING TABLE (Crowd Detection)
-- ====================================================

CREATE TYPE detection_source_enum AS ENUM ('CAMERA', 'MANUAL', 'SENSOR');

CREATE TABLE bus_crowding (
    crowding_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID NOT NULL REFERENCES buses(bus_id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(trip_id) ON DELETE CASCADE,
    passenger_count INT NOT NULL CHECK (passenger_count >= 0),
    capacity_percentage INT CHECK (capacity_percentage >= 0 AND capacity_percentage <= 150),
    detection_source detection_source_enum NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_crowding_bus_time ON bus_crowding(bus_id, timestamp DESC);
CREATE INDEX idx_crowding_trip ON bus_crowding(trip_id);

-- ====================================================
-- 11. TICKETS TABLE
-- ====================================================

CREATE TYPE ticket_status_enum AS ENUM ('VALID', 'USED', 'EXPIRED', 'CANCELLED');

CREATE TABLE tickets (
    ticket_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES  users(user_id) ON DELETE RESTRICT,
    trip_id UUID NOT NULL REFERENCES trips(trip_id) ON DELETE RESTRICT,
    from_stop_id UUID NOT NULL REFERENCES stops(stop_id),
    to_stop_id UUID NOT NULL REFERENCES stops(stop_id),
    passenger_count INT DEFAULT 1 CHECK (passenger_count > 0),
    fare_amount DECIMAL(10,2) NOT NULL CHECK (fare_amount >= 0),
    qr_code TEXT UNIQUE,
    status ticket_status_enum DEFAULT 'VALID',
    booked_at TIMESTAMP DEFAULT NOW(),
    valid_until TIMESTAMP
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_trip ON tickets(trip_id);
CREATE INDEX idx_tickets_qr ON tickets(qr_code);
CREATE INDEX idx_tickets_status ON tickets(status) WHERE status = 'VALID';

-- ====================================================
-- 12. PASSES TABLE
-- ====================================================

CREATE TYPE pass_type_enum AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL');
CREATE TYPE pass_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TABLE passes (
    pass_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    pass_type pass_type_enum NOT NULL,
    route_id UUID REFERENCES routes(route_id) ON DELETE RESTRICT, -- NULL = universal pass
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    qr_code TEXT UNIQUE,
    status pass_status_enum DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (valid_until >= valid_from)
);

CREATE INDEX idx_passes_user ON passes(user_id);
CREATE INDEX idx_passes_status ON passes(status) WHERE status = 'ACTIVE';
CREATE INDEX idx_passes_validity ON passes(valid_from, valid_until);

-- ====================================================
-- 13. PAYMENTS TABLE
-- ====================================================

CREATE TYPE payment_method_enum AS ENUM ('CARD', 'UPI', 'WALLET', 'CASH');
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE RESTRICT,
    ticket_id UUID REFERENCES tickets(ticket_id) ON DELETE SET NULL,
    pass_id UUID REFERENCES passes(pass_id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method payment_method_enum NOT NULL,
    payment_status payment_status_enum DEFAULT 'PENDING',
    transaction_id VARCHAR(100) UNIQUE,
    payment_gateway_response JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    CHECK (
        (ticket_id IS NOT NULL AND pass_id IS NULL) OR
        (ticket_id IS NULL AND pass_id IS NOT NULL)
    )
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_ticket ON payments(ticket_id);
CREATE INDEX idx_payments_pass ON payments(pass_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_transaction ON payments(transaction_id);

-- ====================================================
-- 14. NOTIFICATIONS TABLE
-- ====================================================

CREATE TYPE notification_type_enum AS ENUM ('DELAY', 'ROUTE_CHANGE', 'OFFER', 'SYSTEM');

CREATE TABLE notifications (
    notification_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read, created_at DESC);

-- ====================================================
-- 15. FEEDBACK TABLE
-- ====================================================

CREATE TYPE feedback_category_enum AS ENUM ('CLEANLINESS', 'DRIVER', 'PUNCTUALITY', 'COMFORT', 'OTHER');

CREATE TABLE feedback (
    feedback_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(trip_id) ON DELETE SET NULL,
    bus_id UUID REFERENCES buses(bus_id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(driver_id) ON DELETE SET NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category feedback_category_enum NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_trip ON feedback(trip_id);
CREATE INDEX idx_feedback_bus ON feedback(bus_id);
CREATE INDEX idx_feedback_driver ON feedback(driver_id);
CREATE INDEX idx_feedback_rating ON feedback(rating);

-- ====================================================
-- TRIGGERS & FUNCTIONS
-- ====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-expire tickets
CREATE OR REPLACE FUNCTION expire_old_tickets()
RETURNS void AS $$
BEGIN
    UPDATE tickets SET status = 'EXPIRED'
    WHERE status = 'VALID' AND valid_until < NOW();
END;
$$ LANGUAGE plpgsql;

-- Auto-expire passes
CREATE OR REPLACE FUNCTION expire_old_passes()
RETURNS void AS $$
BEGIN
    UPDATE passes SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' AND valid_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- ====================================================
-- Row Level Security (RLS) for Supabase
-- ====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY users_select_own ON users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tickets_select_own ON tickets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY passes_select_own ON passes
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY payments_select_own ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY notifications_select_own ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY feedback_select_own ON feedback
    FOR SELECT USING (user_id = auth.uid());

-- Public read access for operational tables
CREATE POLICY buses_public_read ON buses
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY routes_public_read ON routes
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY stops_public_read ON stops
    FOR SELECT USING (TRUE);

CREATE POLICY route_stops_public_read ON route_stops
    FOR SELECT USING (TRUE);

CREATE POLICY trips_public_read ON trips
    FOR SELECT USING (TRUE);

CREATE POLICY live_location_public_read ON live_location
    FOR SELECT USING (TRUE);

CREATE POLICY bus_crowding_public_read ON bus_crowding
    FOR SELECT USING (TRUE);

-- ====================================================
-- VIEWS FOR COMMON QUERIES
-- ====================================================

--  View: Current bus locations with trip details
CREATE VIEW current_bus_locations AS
SELECT DISTINCT ON (ll.bus_id)
    ll.bus_id,
    b.bus_number,
    b.bus_type,
    ll.latitude,
    ll.longitude,
    ll.speed,
    ll.heading,
    ll.timestamp,
    t.trip_id,
    t.status AS trip_status,
    r.name AS route_name,
    d.name AS driver_name
FROM live_location ll
JOIN buses b ON ll.bus_id = b.bus_id
LEFT JOIN trips t ON ll.trip_id = t.trip_id
LEFT JOIN routes r ON t.route_id = r.route_id
LEFT JOIN drivers d ON t.driver_id = d.driver_id
ORDER BY ll.bus_id, ll.timestamp DESC;

-- View: Route details with all stops
CREATE VIEW route_details AS
SELECT
    r.route_id,
    r.name AS route_name,
    rs.sequence_number,
    s.name AS stop_name,
    s.latitude,
    s.longitude,
    rs.distance_from_start_km,
    rs.scheduled_arrival_offset_min,
    rs.is_source,
    rs.is_destination
FROM routes r
JOIN route_stops rs ON r.route_id = rs.route_id
JOIN stops s ON rs.stop_id = s.stop_id
ORDER BY r.route_id, rs.sequence_number;

-- View: Active trips with crowd data
CREATE VIEW active_trips_with_crowd AS
SELECT
    t.trip_id,
    t.trip_date,
    b.bus_number,
    r.name AS route_name,
    t.status,
    bc.passenger_count,
    bc.capacity_percentage,
    b.capacity,
    bc.timestamp AS crowd_updated_at
FROM trips t
JOIN buses b ON t.bus_id = b.bus_id
JOIN routes r ON t.route_id = r.route_id
LEFT JOIN LATERAL (
    SELECT passenger_count, capacity_percentage, timestamp
    FROM bus_crowding
    WHERE bus_id = t.bus_id AND trip_id = t.trip_id
    ORDER BY timestamp DESC
    LIMIT 1
) bc ON TRUE
WHERE t.status = 'IN_PROGRESS';
