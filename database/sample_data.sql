-- ====================================================
-- TRACKO - SAMPLE DATA INSERTS
-- Complete dataset for development and testing
-- ====================================================

-- ====================================================
-- 1. INSERT USERS (5 users)
-- ====================================================

INSERT INTO users (email, phone, name, profile_pic) VALUES
('john.doe@email.com', '+919876543210', 'John Doe', 'https://api.dicebear.com/7.x/avatars/svg?seed=john'),
('jane.smith@email.com', '+919876543211', 'Jane Smith', 'https://api.dicebear.com/7.x/avatars/svg?seed=jane'),
('bob.johnson@email.com', '+919876543212', 'Bob Johnson', 'https://api.dicebear.com/7.x/avatars/svg?seed=bob'),
('alice.williams@email.com', '+919876543213', 'Alice Williams', 'https://api.dicebear.com/7.x/avatars/svg?seed=alice'),
('charlie.brown@email.com', '+919876543214', 'Charlie Brown', 'https://api.dicebear.com/7.x/avatars/svg?seed=charlie');

-- ====================================================
-- 2. INSERT OPERATORS (3 operators)
-- ====================================================

INSERT INTO operators (name, license_number, contact_email, contact_phone, region) VALUES
('Chennai Metro Transport Corp', 'CMTC-2024-001', 'ops@cmtc.gov.in', '+914412345678', 'Chennai'),
('Tamil Nadu State Transport', 'TNSTC-2024-002', 'contact@tnstc.gov.in', '+914412345679', 'Tamil Nadu'),
('Private Express Services', 'PES-2024-003', 'info@pxpress.com', '+914412345680', 'Chennai');

-- ====================================================
-- 3. INSERT BUSES (5 buses)
-- ====================================================

INSERT INTO buses (operator_id, bus_number, registration_number, capacity, bus_type, is_active) VALUES
((SELECT operator_id FROM operators WHERE name = 'Chennai Metro Transport Corp'), '12A', 'TN01AB1234', 50, 'NON_AC', TRUE),
((SELECT operator_id FROM operators WHERE name = 'Chennai Metro Transport Corp'), '45C', 'TN01AB5678', 45, 'AC', TRUE),
((SELECT operator_id FROM operators WHERE name = 'Tamil Nadu State Transport'), '21G', 'TN02CD9012', 55, 'NON_AC', TRUE),
((SELECT operator_id FROM operators WHERE name = 'Private Express Services'), '570', 'TN03EF3456', 40, 'AC', TRUE),
((SELECT operator_id FROM operators WHERE name = 'Private Express Services'), 'A1', 'TN03EF7890', 50, 'ELECTRIC', TRUE);

-- ====================================================
-- 4. INSERT DRIVERS (3 drivers)
-- ====================================================

INSERT INTO drivers (name, license_number, phone, rating, is_available) VALUES
('Rajesh Kumar', 'DL-TN-2024-0001', '+919123456780', 4.5, TRUE),
('Suresh Babu', 'DL-TN-2024-0002', '+919123456781', 4.8, TRUE),
('Ramesh Iyer', 'DL-TN-2024-0003', '+919123456782', 4.2, FALSE);

-- ====================================================
-- 5. INSERT STOPS (10 stops)
-- ====================================================

INSERT INTO stops (name, latitude, longitude, address, facilities) VALUES
('Central Station', 13.082680, 80.275116, 'Chennai Central Railway Station Rd, Park Town', '{"shelter": true, "lights": true, "seating": true}'),
('Broadway', 13.087460, 80.281060, 'Broadway, George Town', '{"shelter": true, "lights": true}'),
('Anna Nagar', 13.085240, 80.208640, 'Anna Nagar Roundtana', '{"shelter": true, "lights": true, "restroom": true}'),
('Koyambedu', 13.071650, 80.195970, 'Koyambedu Bus Terminus', '{"shelter": true, "lights": true, "food": true, "restroom": true}'),
('Tech Park', 12.994790, 80.248440, 'Tidel Park IT SEZ, Taramani', '{"shelter": true, "lights": true}'),
('Adyar Signal', 13.006800, 80.255400, 'Adyar, Chennai', '{"shelter": false, "lights": true}'),
('Guindy', 13.008930, 80.220570, 'Guindy Industrial Estate', '{"shelter": true, "lights": true}'),
('Tambaram', 12.922920, 80.127340, 'Tambaram East Chennai', '{"shelter": true, "lights": true, "restroom": true}'),
('Airport', 12.990530, 80.169200, 'Chennai International Airport', '{"shelter": true, "lights": true, "food": true, "restroom": true, "wifi": true}'),
('CMBT Bus Stand', 13.071650, 80.195970, 'Chennai Mofussil Bus Terminus', '{"shelter": true, "lights": true, "food": true, "restroom": true}');

-- ====================================================
-- 6. INSERT ROUTES (3 routes)
-- ====================================================

INSERT INTO routes (operator_id, name, source_stop_id, destination_stop_id, total_distance_km, estimated_duration_min, is_active)
SELECT
    (SELECT operator_id FROM operators WHERE name = 'Chennai Metro Transport Corp'),
    'Central Station - Tech Park',
    (SELECT stop_id FROM stops WHERE name = 'Central Station'),
    (SELECT stop_id FROM stops WHERE name = 'Tech Park'),
    18.5,
    45,
    TRUE;

INSERT INTO routes (operator_id, name, source_stop_id, destination_stop_id, total_distance_km, estimated_duration_min, is_active)
SELECT
    (SELECT operator_id FROM operators WHERE name = 'Tamil Nadu State Transport'),
    'Koyambedu - Airport',
    (SELECT stop_id FROM stops WHERE name = 'Koyambedu'),
    (SELECT stop_id FROM stops WHERE name = 'Airport'),
    12.0,
    30,
    TRUE;

INSERT INTO routes (operator_id, name, source_stop_id, destination_stop_id, total_distance_km, estimated_duration_min, is_active)
SELECT
    (SELECT operator_id FROM operators WHERE name = 'Private Express Services'),
    'Broadway - Tambaram',
    (SELECT stop_id FROM stops WHERE name = 'Broadway'),
    (SELECT stop_id FROM stops WHERE name = 'Tambaram'),
    22.0,
    55,
    TRUE;

-- ====================================================
-- 7. INSERT ROUTE_STOPS ⭐ (Intermediate Stops)
-- ====================================================

-- Route 1: Central Station → Tech Park (with intermediate stops)
WITH route AS (SELECT route_id FROM routes WHERE name = 'Central Station - Tech Park')
INSERT INTO route_stops (route_id, stop_id, sequence_number, distance_from_start_km, scheduled_arrival_offset_min, scheduled_departure_offset_min, is_source, is_destination)
SELECT
    route.route_id,
    s.stop_id,
    v.seq,
    v.dist,
    v.arr,
    v.dep,
    v.src,
    v.dest
FROM route
CROSS JOIN (VALUES
    ((SELECT stop_id FROM stops WHERE name = 'Central Station'), 1, 0.0, 0, 0, TRUE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Broadway'), 2, 3.2, 8, 10, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Anna Nagar'), 3, 7.5, 18, 20, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Koyambedu'), 4, 12.0, 28, 30, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Guindy'), 5, 15.5, 38, 40, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Tech Park'), 6, 18.5, 45, 45, FALSE, TRUE)
) AS v(stop_id, seq, dist, arr, dep, src, dest);

-- Route 2: Koyambedu → Airport
WITH route AS (SELECT route_id FROM routes WHERE name = 'Koyambedu - Airport')
INSERT INTO route_stops (route_id, stop_id, sequence_number, distance_from_start_km, scheduled_arrival_offset_min, scheduled_departure_offset_min, is_source, is_destination)
SELECT
    route.route_id,
    s.stop_id,
    v.seq,
    v.dist,
    v.arr,
    v.dep,
    v.src,
    v.dest
FROM route
CROSS JOIN (VALUES
    ((SELECT stop_id FROM stops WHERE name = 'Koyambedu'), 1, 0.0, 0, 0, TRUE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Anna Nagar'), 2, 4.0, 10, 12, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Airport'), 3, 12.0, 30, 30, FALSE, TRUE)
) AS v(stop_id, seq, dist, arr, dep, src, dest);

-- Route 3: Broadway → Tambaram
WITH route AS (SELECT route_id FROM routes WHERE name = 'Broadway - Tambaram')
INSERT INTO route_stops (route_id, stop_id, sequence_number, distance_from_start_km, scheduled_arrival_offset_min, scheduled_departure_offset_min, is_source, is_destination)
SELECT
    route.route_id,
    s.stop_id,
    v.seq,
    v.dist,
    v.arr,
    v.dep,
    v.src,
    v.dest
FROM route
CROSS JOIN (VALUES
    ((SELECT stop_id FROM stops WHERE name = 'Broadway'), 1, 0.0, 0, 0, TRUE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Central Station'), 2, 1.5, 5, 7, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Guindy'), 3, 8.0, 20, 22, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Adyar Signal'), 4, 14.0, 35, 37, FALSE, FALSE),
    ((SELECT stop_id FROM stops WHERE name = 'Tambaram'), 5, 22.0, 55, 55, FALSE, TRUE)
) AS v(stop_id, seq, dist, arr, dep, src, dest);

-- ====================================================
-- 8. INSERT TRIPS (1 complete trip + 1 in progress)
-- ====================================================

INSERT INTO trips (route_id, bus_id, driver_id, trip_date, scheduled_start_time, actual_start_time, scheduled_end_time, actual_end_time, status)
SELECT
    (SELECT route_id FROM routes WHERE name = 'Central Station - Tech Park'),
    (SELECT bus_id FROM buses WHERE bus_number = '12A'),
    (SELECT driver_id FROM drivers WHERE name = 'Rajesh Kumar'),
    CURRENT_DATE,
    '08:00:00',
    '08:02:00',
    '08:45:00',
    '08:48:00',
    'COMPLETED';

INSERT INTO trips (route_id, bus_id, driver_id, trip_date, scheduled_start_time, actual_start_time, scheduled_end_time, status)
SELECT
    (SELECT route_id FROM routes WHERE name = 'Koyambedu - Airport'),
    (SELECT bus_id FROM buses WHERE bus_number = '45C'),
    (SELECT driver_id FROM drivers WHERE name = 'Suresh Babu'),
    CURRENT_DATE,
    '09:00:00',
    '09:01:00',
    '09:30:00',
    'IN_PROGRESS';

-- ====================================================
-- 9. INSERT LIVE_LOCATION (10 GPS updates for active trip)
-- ====================================================

-- Get the active trip ID
WITH active_trip AS (
    SELECT trip_id, bus_id FROM trips WHERE status = 'IN_PROGRESS' LIMIT 1
)
INSERT INTO live_location (bus_id, trip_id, latitude, longitude, speed, heading, timestamp)
SELECT
    at.bus_id,
    at.trip_id,
    v.lat,
    v.lng,
    v.spd,
    v.hdg,
    NOW() - INTERVAL '1 minute' * v.mins_ago
FROM active_trip at
CROSS JOIN (VALUES
    (13.071650, 80.195970, 35.5, 120, 10), -- Koyambedu (10 min ago)
    (13.075000, 80.200000, 40.0, 125, 9),
    (13.078000, 80.203000, 38.5, 130, 8),
    (13.082000, 80.206000, 42.0, 135, 7),
    (13.085240, 80.208640, 35.0, 140, 6),  -- Anna Nagar (6 min ago)
    (13.088000, 80.180000, 45.0, 145, 5),
    (13.090000, 80.175000, 48.0, 150, 4),
    (13.092000, 80.172000, 50.0, 155, 3),    (13.094000, 80.170000, 45.5, 160, 2),
    (13.990530, 80.169200, 20.0, 165, 1)   -- Near Airport (1 min ago)
) AS v(lat, lng, spd, hdg, mins_ago);

-- ====================================================
-- 10. INSERT BUS_CROWDING (crowd data for trips)
-- ====================================================

-- Crowd updates for active trip
WITH active_trip AS (
    SELECT trip_id, bus_id FROM trips WHERE status = 'IN_PROGRESS' LIMIT 1
)
INSERT INTO bus_crowding (bus_id, trip_id, passenger_count, capacity_percentage, detection_source, timestamp)
SELECT
    at.bus_id,
    at.trip_id,
    v.count,
    v.pct,
    v.src::detection_source_enum,
    NOW() - INTERVAL '1 minute' * v.mins_ago
FROM active_trip at
CROSS JOIN (VALUES
    (8, 20, 'CAMERA', 15),
    (12, 30, 'CAMERA', 10),
    (18, 45, 'CAMERA', 5),
    (15, 37, 'CAMERA', 2)
) AS v(count, pct, src, mins_ago);

-- ====================================================
-- 11. INSERT TICKETS (2 tickets)
-- ====================================================

WITH active_trip AS (SELECT trip_id FROM trips WHERE status = 'IN_PROGRESS' LIMIT 1)
INSERT INTO tickets (user_id, trip_id, from_stop_id, to_stop_id, passenger_count, fare_amount, qr_code, status, valid_until)
SELECT
    (SELECT user_id FROM users WHERE email = 'john.doe@email.com'),
    active_trip.trip_id,
    (SELECT stop_id FROM stops WHERE name = 'Koyambedu'),
    (SELECT stop_id FROM stops WHERE name = 'Airport'),
    2,
    100.00,
    'TKT-' || gen_random_uuid()::text,
    'VALID',
    NOW() + INTERVAL '2 hours'
FROM active_trip;

WITH completed_trip AS (SELECT trip_id FROM trips WHERE status = 'COMPLETED' LIMIT 1)
INSERT INTO tickets (user_id, trip_id, from_stop_id, to_stop_id, passenger_count, fare_amount, qr_code, status, valid_until)
SELECT
    (SELECT user_id FROM users WHERE email = 'jane.smith@email.com'),
    completed_trip.trip_id,
    (SELECT stop_id FROM stops WHERE name = 'Central Station'),
    (SELECT stop_id FROM stops WHERE name = 'Tech Park'),
    1,
    50.00,
    'TKT-' || gen_random_uuid()::text,
    'USED',
    NOW() - INTERVAL '1 hour'
FROM completed_trip;

-- ====================================================
-- 12. INSERT PASSES (1 active monthly pass)
-- ====================================================

INSERT INTO passes (user_id, pass_type, route_id, amount, valid_from, valid_until, qr_code, status)
SELECT
    (SELECT user_id FROM users WHERE email = 'alice.williams@email.com'),
    'MONTHLY',
    (SELECT route_id FROM routes WHERE name = 'Central Station - Tech Park'),
    1500.00,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'PASS-' || gen_random_uuid()::text,
    'ACTIVE';

-- ====================================================
-- 13. INSERT PAYMENTS (2 payments)
-- ====================================================

-- Payment for ticket 1
INSERT INTO payments (user_id, ticket_id, amount, payment_method, payment_status, transaction_id, payment_gateway_response)
SELECT
    t.user_id,
    t.ticket_id,
    t.fare_amount,
    'UPI',
    'SUCCESS',
    'TXN-' || gen_random_uuid()::text,
    '{"upi_id": "user@paytm", "status": "captured"}'::jsonb
FROM tickets t WHERE EXISTS (SELECT 1 FROM users WHERE email = 'john.doe@email.com' AND user_id = t.user_id)
LIMIT 1;

-- Payment for pass
INSERT INTO payments (user_id, pass_id, amount, payment_method, payment_status, transaction_id, payment_gateway_response)
SELECT
    p.user_id,
    p.pass_id,
    p.amount,
    'CARD',
    'SUCCESS',
    'TXN-' || gen_random_uuid()::text,
    '{"card_last4": "4242", "status": "captured"}'::jsonb
FROM passes p WHERE EXISTS (SELECT 1 FROM users WHERE email = 'alice.williams@email.com' AND user_id = p.user_id)
LIMIT 1;

-- ====================================================
-- 14. INSERT NOTIFICATIONS (sample for users)
-- ====================================================

INSERT INTO notifications (user_id, title, message, type, metadata)
SELECT
    (SELECT user_id FROM users WHERE email = 'john.doe@email.com'),
    'Bus Delayed',
    'Your bus 45C is delayed by 10 minutes',
    'DELAY',
    '{"delay_minutes": 10, "bus_number": "45C"}'::jsonb;

INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT
    (SELECT user_id FROM users WHERE email = 'jane.smith@email.com'),
    'Special Offer!',
    'Get 20% off on monthly passes this week',
    'OFFER',
    FALSE;

-- ====================================================
-- 15. INSERT FEEDBACK (1 feedback entry)
-- ====================================================

WITH completed_trip AS (SELECT trip_id, bus_id, driver_id FROM trips WHERE status = 'COMPLETED' LIMIT 1)
INSERT INTO feedback (user_id, trip_id, bus_id, driver_id, rating, comment, category)
SELECT
    (SELECT user_id FROM users WHERE email = 'jane.smith@email.com'),
    ct.trip_id,
    ct.bus_id,
    ct.driver_id,
    5,
    'Excellent service! Driver was very professional and bus was clean.',
    'DRIVER'
FROM completed_trip ct;
