const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL and SUPABASE_KEY are required.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('🌱 Starting database seeding...');

    // 1. Users
    console.log('Inserting Users...');
    const users = [
        { email: 'john.doe@email.com', phone: '+919876543210', name: 'John Doe', profile_pic: 'https://api.dicebear.com/7.x/avatars/svg?seed=john' },
        { email: 'jane.smith@email.com', phone: '+919876543211', name: 'Jane Smith', profile_pic: 'https://api.dicebear.com/7.x/avatars/svg?seed=jane' },
        { email: 'bob.johnson@email.com', phone: '+919876543212', name: 'Bob Johnson', profile_pic: 'https://api.dicebear.com/7.x/avatars/svg?seed=bob' },
        { email: 'alice.williams@email.com', phone: '+919876543213', name: 'Alice Williams', profile_pic: 'https://api.dicebear.com/7.x/avatars/svg?seed=alice' },
        { email: 'charlie.brown@email.com', phone: '+919876543214', name: 'Charlie Brown', profile_pic: 'https://api.dicebear.com/7.x/avatars/svg?seed=charlie' }
    ];

    // Upsert users (on conflict do nothing or update) - Email is unique
    for (const user of users) {
        const { error } = await supabase.from('users').upsert(user, { onConflict: 'email' });
        if (error) console.error('Error inserting user:', user.email, error.message);
    }

    // 2. Operators
    console.log('Inserting Operators...');
    const operators = [
        { name: 'Chennai Metro Transport Corp', license_number: 'CMTC-2024-001', contact_email: 'ops@cmtc.gov.in', contact_phone: '+914412345678', region: 'Chennai' },
        { name: 'Tamil Nadu State Transport', license_number: 'TNSTC-2024-002', contact_email: 'contact@tnstc.gov.in', contact_phone: '+914412345679', region: 'Tamil Nadu' },
        { name: 'Private Express Services', license_number: 'PES-2024-003', contact_email: 'info@pxpress.com', contact_phone: '+914412345680', region: 'Chennai' }
    ];

    for (const op of operators) {
        const { error } = await supabase.from('operators').upsert(op, { onConflict: 'license_number' });
        if (error) console.error('Error inserting operator:', op.name, error.message);
    }

    // Get Operator IDs
    const { data: opData } = await supabase.from('operators').select('operator_id, name');
    const getOpId = (name) => opData.find(o => o.name === name)?.operator_id;

    // 3. Buses
    console.log('Inserting Buses...');
    const buses = [
        { operator_id: getOpId('Chennai Metro Transport Corp'), bus_number: '12A', registration_number: 'TN01AB1234', capacity: 50, bus_type: 'NON_AC', is_active: true },
        { operator_id: getOpId('Chennai Metro Transport Corp'), bus_number: '45C', registration_number: 'TN01AB5678', capacity: 45, bus_type: 'AC', is_active: true },
        { operator_id: getOpId('Tamil Nadu State Transport'), bus_number: '21G', registration_number: 'TN02CD9012', capacity: 55, bus_type: 'NON_AC', is_active: true },
        { operator_id: getOpId('Private Express Services'), bus_number: '570', registration_number: 'TN03EF3456', capacity: 40, bus_type: 'AC', is_active: true },
        { operator_id: getOpId('Private Express Services'), bus_number: 'A1', registration_number: 'TN03EF7890', capacity: 50, bus_type: 'ELECTRIC', is_active: true }
    ];

    for (const bus of buses) {
        if (!bus.operator_id) continue;
        const { error } = await supabase.from('buses').upsert(bus, { onConflict: 'bus_number' });
        if (error) console.error('Error inserting bus:', bus.bus_number, error.message);
    }

    // 4. Drivers
    console.log('Inserting Drivers...');
    const drivers = [
        { name: 'Rajesh Kumar', license_number: 'DL-TN-2024-0001', phone: '+919123456780', rating: 4.5, is_available: true },
        { name: 'Suresh Babu', license_number: 'DL-TN-2024-0002', phone: '+919123456781', rating: 4.8, is_available: true },
        { name: 'Ramesh Iyer', license_number: 'DL-TN-2024-0003', phone: '+919123456782', rating: 4.2, is_available: false }
    ];
    for (const driver of drivers) {
        const { error } = await supabase.from('drivers').upsert(driver, { onConflict: 'license_number' });
        if (error) console.error('Error inserting driver:', driver.name, error.message);
    }

    // 5. Stops
    console.log('Inserting Stops...');
    const stops = [
        { name: 'Central Station', latitude: 13.082680, longitude: 80.275116, address: 'Chennai Central Railway Station Rd, Park Town', facilities: { shelter: true, lights: true, seating: true } },
        { name: 'Broadway', latitude: 13.087460, longitude: 80.281060, address: 'Broadway, George Town', facilities: { shelter: true, lights: true } },
        { name: 'Anna Nagar', latitude: 13.085240, longitude: 80.208640, address: 'Anna Nagar Roundtana', facilities: { shelter: true, lights: true, restroom: true } },
        { name: 'Koyambedu', latitude: 13.071650, longitude: 80.195970, address: 'Koyambedu Bus Terminus', facilities: { shelter: true, lights: true, food: true, restroom: true } },
        { name: 'Tech Park', latitude: 12.994790, longitude: 80.248440, address: 'Tidel Park IT SEZ, Taramani', facilities: { shelter: true, lights: true } },
        { name: 'Adyar Signal', latitude: 13.006800, longitude: 80.255400, address: 'Adyar, Chennai', facilities: { shelter: false, lights: true } },
        { name: 'Guindy', latitude: 13.008930, longitude: 80.220570, address: 'Guindy Industrial Estate', facilities: { shelter: true, lights: true } },
        { name: 'Tambaram', latitude: 12.922920, longitude: 80.127340, address: 'Tambaram East Chennai', facilities: { shelter: true, lights: true, restroom: true } },
        { name: 'Airport', latitude: 12.990530, longitude: 80.169200, address: 'Chennai International Airport', facilities: { shelter: true, lights: true, food: true, restroom: true, wifi: true } },
        { name: 'CMBT Bus Stand', latitude: 13.071650, longitude: 80.195970, address: 'Chennai Mofussil Bus Terminus', facilities: { shelter: true, lights: true, food: true, restroom: true } }
    ];
    // Upsert logic for stops is tricky without unique name constraint, but let's assume names are unique for this seed
    // Ideally we check if exists first
    for (const stop of stops) {
        // Check if exists
        const { data: existing } = await supabase.from('stops').select('stop_id').eq('name', stop.name).single();
        if (!existing) {
            const { error } = await supabase.from('stops').insert(stop);
            if (error) console.error('Error inserting stop:', stop.name, error.message);
        }
    }

    // Refresh IDs
    const { data: stopData } = await supabase.from('stops').select('stop_id, name');
    const getStopId = (name) => stopData.find(s => s.name === name)?.stop_id;

    // 6. Routes
    console.log('Inserting Routes...');
    const routes = [
        {
            operator_id: getOpId('Chennai Metro Transport Corp'),
            name: 'Central Station - Tech Park',
            source_stop_id: getStopId('Central Station'),
            destination_stop_id: getStopId('Tech Park'),
            total_distance_km: 18.5,
            estimated_duration_min: 45,
            is_active: true
        },
        {
            operator_id: getOpId('Tamil Nadu State Transport'),
            name: 'Koyambedu - Airport',
            source_stop_id: getStopId('Koyambedu'),
            destination_stop_id: getStopId('Airport'),
            total_distance_km: 12.0,
            estimated_duration_min: 30,
            is_active: true
        },
        {
            operator_id: getOpId('Private Express Services'),
            name: 'Broadway - Tambaram',
            source_stop_id: getStopId('Broadway'),
            destination_stop_id: getStopId('Tambaram'),
            total_distance_km: 22.0,
            estimated_duration_min: 55,
            is_active: true
        }
    ];

    for (const route of routes) {
        if (!route.operator_id || !route.source_stop_id || !route.destination_stop_id) continue;
        // Check existence by name
        const { data: existing } = await supabase.from('routes').select('route_id').eq('name', route.name).single();
        if (!existing) {
            const { error } = await supabase.from('routes').insert(route);
            if (error) console.error('Error inserting route:', route.name, error.message);
        }
    }

    // Get Route IDs
    const { data: routeData } = await supabase.from('routes').select('route_id, name');
    const getRouteId = (name) => routeData.find(r => r.name === name)?.route_id;

    // 7. Route Stops
    console.log('Inserting Route Stops...');
    // Helper to insert stops
    const insertRouteStops = async (routeName, stopsList) => {
        const routeId = getRouteId(routeName);
        if (!routeId) return;

        for (const s of stopsList) {
            const stopId = getStopId(s.stopName);
            if (!stopId) continue;

            // Check existence
            const { data: existing } = await supabase.from('route_stops')
                .select('route_stop_id')
                .eq('route_id', routeId)
                .eq('stop_id', stopId)
                .eq('sequence_number', s.seq)
                .single();

            if (!existing) {
                const { error } = await supabase.from('route_stops').insert({
                    route_id: routeId,
                    stop_id: stopId,
                    sequence_number: s.seq,
                    distance_from_start_km: s.dist,
                    scheduled_arrival_offset_min: s.arr,
                    scheduled_departure_offset_min: s.dep,
                    is_source: s.src || false,
                    is_destination: s.dest || false
                });
                if (error) console.error('Error inserting route stop:', routeName, s.stopName, error.message);
            }
        }
    };

    await insertRouteStops('Central Station - Tech Park', [
        { stopName: 'Central Station', seq: 1, dist: 0.0, arr: 0, dep: 0, src: true },
        { stopName: 'Broadway', seq: 2, dist: 3.2, arr: 8, dep: 10 },
        { stopName: 'Anna Nagar', seq: 3, dist: 7.5, arr: 18, dep: 20 },
        { stopName: 'Koyambedu', seq: 4, dist: 12.0, arr: 28, dep: 30 },
        { stopName: 'Guindy', seq: 5, dist: 15.5, arr: 38, dep: 40 },
        { stopName: 'Tech Park', seq: 6, dist: 18.5, arr: 45, dep: 45, dest: true }
    ]);

    await insertRouteStops('Koyambedu - Airport', [
        { stopName: 'Koyambedu', seq: 1, dist: 0.0, arr: 0, dep: 0, src: true },
        { stopName: 'Anna Nagar', seq: 2, dist: 4.0, arr: 10, dep: 12 },
        { stopName: 'Airport', seq: 3, dist: 12.0, arr: 30, dep: 30, dest: true }
    ]);

    // 8. Trips
    console.log('Inserting Trips...');
    // Existing completed trip
    const trip1 = {
        route_id: getRouteId('Central Station - Tech Park'),
        bus_id: (await supabase.from('buses').select('bus_id').eq('bus_number', '12A').single()).data?.bus_id,
        driver_id: (await supabase.from('drivers').select('driver_id').eq('name', 'Rajesh Kumar').single()).data?.driver_id,
        trip_date: new Date().toISOString().split('T')[0],
        scheduled_start_time: '08:00:00',
        actual_start_time: '08:02:00',
        scheduled_end_time: '08:45:00',
        actual_end_time: '08:48:00',
        status: 'COMPLETED'
    };
    if (trip1.route_id && trip1.bus_id && trip1.driver_id) {
        const { error } = await supabase.from('trips').insert(trip1);
        if (error && !error.message.includes('duplicate')) console.error('Error inserting completed trip:', error.message);
    }

    // Active trip
    const trip2 = {
        route_id: getRouteId('Koyambedu - Airport'),
        bus_id: (await supabase.from('buses').select('bus_id').eq('bus_number', '12A').single()).data?.bus_id, // Reuse 12A for demo purposes as requested in setup? No, sample uses 45C.
        driver_id: (await supabase.from('drivers').select('driver_id').eq('name', 'Suresh Babu').single()).data?.driver_id,
        trip_date: new Date().toISOString().split('T')[0],
        scheduled_start_time: '09:00:00',
        actual_start_time: '09:01:00',
        status: 'IN_PROGRESS'
    };
    // Fix: Sample data used 45C for trip 2, let's use 45C
    trip2.bus_id = (await supabase.from('buses').select('bus_id').eq('bus_number', '45C').single()).data?.bus_id;

    if (trip2.route_id && trip2.bus_id && trip2.driver_id) {
        // Check if active trip exists for this bus to avoid constraint errors
        const { data: existing } = await supabase.from('trips').select('trip_id').eq('bus_id', trip2.bus_id).eq('status', 'IN_PROGRESS').single();
        if (!existing) {
            const { error } = await supabase.from('trips').insert(trip2);
            if (error) console.error('Error inserting active trip:', error.message);
        }
    }

    console.log('✅ Seeding completed!');
}

seed().catch(err => console.error('Unexpected error:', err));
