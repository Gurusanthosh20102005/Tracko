const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// ====================================================
// SUPABASE CLIENT CONFIGURATION
// ====================================================

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️  Supabase credentials not found in .env file');
    console.error('   Please set SUPABASE_URL and SUPABASE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ====================================================
// IN-MEMORY MOCK STORE (Fallback when DB is not ready)
// ====================================================
const mockCrowdStore = {
    // Stores live updates from camera
    // Starts empty so that getSampleBusData() uses the hardcoded demo values by default.
    // When a camera update comes in, this store is populated and overrides the demo value for that specific bus.
};

// User provided route data
const mockRouteStore = {
    "221H": [
        { "name": "Chennai Central", "distance": null, "time": 0, "isSource": true },
        { "name": "Pallavan Salai (Bus Depot)", "distance": null, "time": 2 },
        { "name": "Wellington Plaza", "distance": null, "time": 7 },
        { "name": "L.I.C.", "distance": null, "time": 9 },
        { "name": "T.V.S.", "distance": null, "time": 11 },
        { "name": "Anand Theatre", "distance": null, "time": 12 },
        { "name": "Church Park School", "distance": null, "time": 14 },
        { "name": "D.M.S.", "distance": null, "time": 17 },
        { "name": "Vanavil (Anna Arivalayam)", "distance": null, "time": 20 },
        { "name": "S.I.E.T. College", "distance": null, "time": 21 },
        { "name": "Defence Quarters", "distance": null, "time": 24 },
        { "name": "Y.M.C.A. Nandanam (Nandanam)", "distance": null, "time": 26 },
        { "name": "Saidapet (Teachers Training College)", "distance": null, "time": 31 },
        { "name": "Saidapet", "distance": null, "time": 32 },
        { "name": "Saidapet Court / Taluka Office Road", "distance": null, "time": 35 },
        { "name": "Chinna Malai", "distance": null, "time": 36 },
        { "name": "Anna University", "distance": null, "time": 38 },
        { "name": "C.L.R.I.", "distance": null, "time": 41 },
        { "name": "Madhya Kailash", "distance": null, "time": 43 },
        { "name": "W.P.T.", "distance": null, "time": 47 },
        { "name": "Tidel Park", "distance": null, "time": 50 },
        { "name": "S.R.P. Tool", "distance": null, "time": 55 },
        { "name": "I.G.P.", "distance": null, "time": 57 },
        { "name": "Kandanchavadi", "distance": null, "time": 60 },
        { "name": "Perungudi", "distance": null, "time": 63 },
        { "name": "Seevaram", "distance": null, "time": 66 },
        { "name": "Jain College", "distance": null, "time": 68 },
        { "name": "Rattha Tech Tower", "distance": null, "time": 70 },
        { "name": "Okkiyampet", "distance": null, "time": 77 },
        { "name": "T.C.S.", "distance": null, "time": 80 },
        { "name": "Karapakkam", "distance": null, "time": 82 },
        { "name": "Accenture", "distance": null, "time": 85 },
        { "name": "Sholinganallur", "distance": null, "time": 88 },
        { "name": "Satyabhama Dental College and Hospital", "distance": null, "time": 98 },
        { "name": "Semmancheri", "distance": null, "time": 103 },
        { "name": "Navallur", "distance": null, "time": 109 },
        { "name": "Siruseri (Muttukadu)", "distance": null, "time": 114 },
        { "name": "S.I.P.C.O.T. (Muttukadu)", "distance": null, "time": 115 },
        { "name": "Vaniyanchavadi Padma Adarsh School", "distance": null, "time": 117 },
        { "name": "Kazhipattur", "distance": null, "time": 120 },
        { "name": "Hindustan College", "distance": null, "time": 127 },
        { "name": "Chettinad Hospital", "distance": null, "time": 129 },
        { "name": "Padur", "distance": null, "time": 130 },
        { "name": "Vandalur Road Junction", "distance": null, "time": 132 },
        { "name": "Kelambakkam", "distance": null, "time": 133 },
        { "name": "Thaiyur", "distance": null, "time": 140 },
        { "name": "Koman Nagar", "distance": null, "time": 146 },
        { "name": "S.S.N. College", "distance": null, "time": 148 },
        { "name": "Kalavakkam", "distance": null, "time": 153 },
        { "name": "Thiruporur", "distance": null, "time": 156 },
        { "name": "Thiruporur Kovil", "distance": null, "time": 159 },
        { "name": "Thiruporur Bus Stand", "distance": null, "time": 162, "isDestination": true }
    ],
    "45C": [
        { "name": "Koyambedu", "distance": 0, "time": 0, "isSource": true },
        { "name": "Anna Nagar", "distance": 4.0, "time": 10 },
        { "name": "Airport", "distance": 12.0, "time": 30, "isDestination": true }
    ],
    "77": [
        { "name": "Avadi", "distance": null, "time": 0, "isSource": true },
        { "name": "Tube Products of India", "distance": null, "time": 4 },
        { "name": "Murugappa Polytechnic", "distance": null, "time": 6 },
        { "name": "Vaishnavi Nagar", "distance": null, "time": 9 },
        { "name": "Thirumullaivoyal", "distance": null, "time": 12 },
        { "name": "Manikandapuram", "distance": null, "time": 14 },
        { "name": "Vivekananda School", "distance": null, "time": 15 },
        { "name": "Stedford Hospital", "distance": null, "time": 17 },
        { "name": "Ambattur O.T. Bus Stand", "distance": null, "time": 20 },
        { "name": "T.I. School", "distance": null, "time": 22 },
        { "name": "Ulavar Sandhai", "distance": null, "time": 23 },
        { "name": "Canara Bank", "distance": null, "time": 25 },
        { "name": "Ladies Police Station", "distance": null, "time": 25 },
        { "name": "Dunlop", "distance": null, "time": 26 },
        { "name": "Telephone Exchange", "distance": null, "time": 31 },
        { "name": "Ambattur I.T.I.", "distance": null, "time": 33 },
        { "name": "Mannurpet", "distance": null, "time": 36 },
        { "name": "Britannia Industries Limited", "distance": null, "time": 38 },
        { "name": "EDAI Street", "distance": null, "time": 39 },
        { "name": "Junction Of Central Avenue & Erikarai", "distance": null, "time": 40 },
        { "name": "T.V.S. Lucas (Padi)", "distance": null, "time": 41 },
        { "name": "Weels India Road Junction", "distance": null, "time": 43 },
        { "name": "Kovarthanagiri", "distance": null, "time": 45 },
        { "name": "Anna Nagar West Depot", "distance": null, "time": 46 },
        { "name": "Vijayakanth Kalyana Mandapam", "distance": null, "time": 54 },
        { "name": "C.M.B.T", "distance": null, "time": 57, "isDestination": true }
    ],
    "570": [
        { "name": "Kelambakkam", "distance": null, "time": 0, "isSource": true },
        { "name": "Vandalur Road Junction", "distance": null, "time": 1 },
        { "name": "Chettinad Hospital", "distance": null, "time": 4 },
        { "name": "Hindustan College", "distance": null, "time": 6 },
        { "name": "O.M.R. Padur", "distance": null, "time": 8 },
        { "name": "Akshaya", "distance": null, "time": 10 },
        { "name": "Kazhipattur", "distance": null, "time": 14 },
        { "name": "Vaniyanchavadi Padma Adarsh School", "distance": null, "time": 16 },
        { "name": "S.I.P.C.O.T. (Muttukadu)", "distance": null, "time": 18 },
        { "name": "Siruseri (Muttukadu)", "distance": null, "time": 19 },
        { "name": "Egattur", "distance": null, "time": 21 },
        { "name": "Navalur Bus Stop", "distance": null, "time": 24 },
        { "name": "Semmancheri", "distance": null, "time": 31 },
        { "name": "Satyabhama Dental College and Hospital", "distance": null, "time": 34 },
        { "name": "Kumaran Nagar", "distance": null, "time": 37 },
        { "name": "Ponniamman Kovil", "distance": null, "time": 40 },
        { "name": "Sholinganallur (Government School)", "distance": null, "time": 43 },
        { "name": "Sholinganallur", "distance": null, "time": 47 },
        { "name": "Accenture", "distance": null, "time": 49 },
        { "name": "Karapakkam", "distance": null, "time": 51 },
        { "name": "T.C.S.", "distance": null, "time": 53 },
        { "name": "Okkiyampet", "distance": null, "time": 56 },
        { "name": "P.T.C. Quarters", "distance": null, "time": 59 },
        { "name": "Mettukuppam", "distance": null, "time": 61 },
        { "name": "Rattha Tech Tower", "distance": null, "time": 64 },
        { "name": "D.B. Jain College", "distance": null, "time": 65 },
        { "name": "Seevaram", "distance": null, "time": 67 },
        { "name": "Perungudi", "distance": null, "time": 70 },
        { "name": "Kandanchavadi", "distance": null, "time": 73 },
        { "name": "I.G.P.", "distance": null, "time": 76 },
        { "name": "S.R.P. Tool", "distance": null, "time": 78 },
        { "name": "Taramani 100 Feet Road", "distance": null, "time": 82 },
        { "name": "Pillaiyar Koil", "distance": null, "time": 84 },
        { "name": "Bharathi Nagar", "distance": null, "time": 85 },
        { "name": "Baby Nagar", "distance": null, "time": 87 },
        { "name": "Tansi Nagar", "distance": null, "time": 89 },
        { "name": "Dhandeeswaram", "distance": null, "time": 91 },
        { "name": "Dhandeeswaram Tank / Gandhi Road", "distance": null, "time": 93 },
        { "name": "Guru Nanak College", "distance": null, "time": 95 },
        { "name": "Velachery Check Post", "distance": null, "time": 98 },
        { "name": "Guindy Race Course (Kannagipuram)", "distance": null, "time": 101 },
        { "name": "Chellammal College", "distance": null, "time": 103 },
        { "name": "Guindy Industrial Estate", "distance": null, "time": 107 },
        { "name": "S.I.P.C.O.T. (Olympia / Tech Park )", "distance": null, "time": 110 },
        { "name": "Ekkattuthangal", "distance": null, "time": 112 },
        { "name": "Kalaimagal Nagar (Jaya TV)", "distance": null, "time": 114 },
        { "name": "Kasi Theatre (BSNL)", "distance": null, "time": 116 },
        { "name": "B.S.N.L. (Kasi Theatre)", "distance": null, "time": 117 },
        { "name": "Udhayam Theatre (Ashok Pillar)", "distance": null, "time": 119 },
        { "name": "Ashok Nagar Canara Bank", "distance": null, "time": 121 },
        { "name": "Vadapalani", "distance": null, "time": 123 },
        { "name": "Thirunagar", "distance": null, "time": 127 },
        { "name": "M.M.D.A. (Arumbakkam)", "distance": null, "time": 130 },
        { "name": "C.M.B.T", "distance": null, "time": 133, "isDestination": true }
    ],
    "5B": [
        { "name": "Thiyagaraya Nagar Bus Depot", "distance": null, "time": 0, "isSource": true },
        { "name": "C.I.T. Nagar", "distance": null, "time": 1 },
        { "name": "Saidapet (Teachers Training College)", "distance": null, "time": 4 },
        { "name": "Saidapet", "distance": null, "time": 6 },
        { "name": "Saidapet Court / Taluka Office Road", "distance": null, "time": 8 },
        { "name": "Chinna Malai", "distance": null, "time": 9 },
        { "name": "Anna University", "distance": null, "time": 12 },
        { "name": "C.L.R.I.", "distance": null, "time": 15 },
        { "name": "Madhya Kailash", "distance": null, "time": 17 },
        { "name": "Gandhi Nagar", "distance": null, "time": 18 },
        { "name": "Adyar Old Depot", "distance": null, "time": 20 },
        { "name": "Adyar Malar Hospital", "distance": null, "time": 22 },
        { "name": "Andhra Mahila Sabha Hospital (Sathya Studios)", "distance": null, "time": 25 },
        { "name": "R.K. Mutt Road", "distance": null, "time": 27 },
        { "name": "Rani Meyyammai School", "distance": null, "time": 28 },
        { "name": "C.I.D. Quarters", "distance": null, "time": 29 },
        { "name": "Saint Marys Road", "distance": null, "time": 31 },
        { "name": "Ramakrishna Madam", "distance": null, "time": 31 },
        { "name": "Mylapore Tank", "distance": null, "time": 33, "isDestination": true }
    ],
    "A1": [
        { "name": "Thiruvanmiyur", "distance": null, "time": 0, "isSource": true },
        { "name": "Jayanthi Theatre", "distance": null, "time": 1 },
        { "name": "Adyar Depot", "distance": null, "time": 5 },
        { "name": "Telephone Exchange", "distance": null, "time": 5 },
        { "name": "Adayar O.T.", "distance": null, "time": 7 },
        { "name": "Adyar Malar Hospital", "distance": null, "time": 9 },
        { "name": "Andhra Mahila Sabha Hospital (Sathya Studios)", "distance": null, "time": 12 },
        { "name": "R.K. Mutt Road", "distance": null, "time": 14 },
        { "name": "Rani Meyyammai School", "distance": null, "time": 15 },
        { "name": "Mandaveli", "distance": null, "time": 16 },
        { "name": "Mandaveli Market", "distance": null, "time": 17 },
        { "name": "Ramakrishna Madam", "distance": null, "time": 18 },
        { "name": "Mylapore Tank", "distance": null, "time": 19 },
        { "name": "Luz Church", "distance": null, "time": 21 },
        { "name": "Thiruvalluvar Statue", "distance": null, "time": 23 },
        { "name": "Hotel Ajantha (Earlish Lab)", "distance": null, "time": 25 },
        { "name": "Hotel Swageth", "distance": null, "time": 26 },
        { "name": "Royapettah Hospital", "distance": null, "time": 28 },
        { "name": "Wesley School", "distance": null, "time": 29 },
        { "name": "L.I.C.", "distance": null, "time": 31 },
        { "name": "Mount Road Post Office", "distance": null, "time": 34 },
        { "name": "The Hindu", "distance": null, "time": 35 },
        { "name": "Pallavan Salai (Bus Depot)", "distance": null, "time": 38 },
        { "name": "Central Station", "distance": null, "time": 41 },
        { "name": "Central Railway Station", "distance": null, "time": 41, "isDestination": true }
    ]
};

// ====================================================
// BUS FUNCTIONS
// ====================================================

/**
 * Get all active buses with their latest data
 */
async function getAllBuses() {
    try {
        const { data: buses, error } = await supabase
            .from('buses')
            .select(`
                bus_id,
                bus_number,
                capacity,
                bus_type,
                operator:operators(name)
            `)
            .eq('is_active', true);

        if (error) throw error;
        return buses;
    } catch (error) {
        console.error('Error fetching buses:', error.message);
        return [];
    }
}

/**
 * Get bus by bus number
 */
async function getBusByNumber(busNumber) {
    try {
        const { data, error } = await supabase
            .from('buses')
            .select(`
                bus_id,
                bus_number,
                capacity,
                bus_type,
                registration_number,
                operator:operators(name)
            `)
            .eq('bus_number', busNumber)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`Error fetching bus ${busNumber}:`, error.message);
        return null; // Return null on error so fallback logic can take over
    }
}

// ====================================================
// ROUTE FUNCTIONS
// ====================================================

/**
 * Get all active routes
 */
async function getAllRoutes() {
    try {
        const { data, error } = await supabase
            .from('routes')
            .select(`
                route_id,
                name,
                total_distance_km,
                estimated_duration_min,
                source_stop:stops!routes_source_stop_id_fkey(name, latitude, longitude),
                destination_stop:stops!routes_destination_stop_id_fkey(name, latitude, longitude)
            `)
            .eq('is_active', true);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching routes:', error.message);
        return [];
    }
}

// Helper to generate coordinates between two points
function augmentWithCoordinates(busId, stops) {
    // Define landmarks for Chennai
    const landmarks = {
        '221H': { start: [13.0827, 80.2707], end: [12.7236, 80.1873] }, // Central -> Thiruporur
        '45C': { start: [13.0694, 80.2057], end: [12.9941, 80.1709] }, // Koyambedu -> Airport
        '77': { start: [13.1067, 80.0970], end: [13.0694, 80.2057] }, // Avadi -> CMBT
        '570': { start: [12.8023, 80.2241], end: [13.0694, 80.2057] }, // Kelambakkam -> CMBT
        '5B': { start: [13.0418, 80.2341], end: [13.0368, 80.2676] }, // T.Nagar -> Mylapore
        'A1': { start: [12.9830, 80.2594], end: [13.0827, 80.2707] }, // Thiruvanmiyur -> Central
        'default': { start: [13.0827, 80.2707], end: [13.0418, 80.2341] }
    };

    const route = landmarks[busId] || landmarks['default'];
    // Handle empty stops
    if (!stops || stops.length === 0) return [];

    const totalStops = stops.length;

    return stops.map((stop, index) => {
        const ratio = index / Math.max(1, totalStops - 1);
        const lat = route.start[0] + (route.end[0] - route.start[0]) * ratio;
        const lng = route.start[1] + (route.end[1] - route.start[1]) * ratio;

        // Add slight distinct curve based on busId hash to prevent overlap
        const curve = (busId.charCodeAt(0) % 5) * 0.002 * Math.sin(ratio * Math.PI);

        return {
            ...stop,
            latitude: lat + curve,
            longitude: lng + curve
        };
    });
}

/**
 * Get route with all stops by bus number
 */
async function getRouteStopsByBusNumber(busNumber) {
    console.log(`[DEBUG] getRouteStopsByBusNumber called for: '${busNumber}'`);
    try {
        // First, get the active trip for this bus
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .select('route_id')
            .eq('bus_id', (
                await supabase
                    .from('buses')
                    .select('bus_id')
                    .eq('bus_number', busNumber)
                    .single()
            ).data?.bus_id || 'mock-bus-id') // Handle null if bus not found
            .eq('status', 'IN_PROGRESS')
            .order('trip_date', { ascending: false })
            .limit(1)
            .single();

        if (tripError) {
            // Fallback to MOCK ROUTE STORE if DB trip not found
            if (mockRouteStore[busNumber]) {
                console.log(`Using mock route data for ${busNumber}`);
                let routeStops = mockRouteStore[busNumber];

                // Inject coordinates
                routeStops = augmentWithCoordinates(busNumber, routeStops);

                const first = routeStops[0];
                const last = routeStops[routeStops.length - 1];

                return {
                    id: busNumber,
                    name: `${first.name} - ${last.name}`,
                    stops: routeStops
                };
            }
            return null;
        }

        // Get route stops from DB
        const { data: routeStops, error } = await supabase
            .from('route_stops')
            .select(`
                sequence_number,
                distance_from_start_km,
                scheduled_arrival_offset_min,
                is_source,
                is_destination,
                stop:stops(name, latitude, longitude)
            `)
            .eq('route_id', trip.route_id)
            .order('sequence_number', { ascending: true });

        if (error) throw error;

        return {
            id: busNumber,
            name: routeStops[0]?.stop.name + ' - ' + routeStops[routeStops.length - 1]?.stop.name,
            stops: routeStops.map(rs => ({
                name: rs.stop.name,
                distance: rs.distance_from_start_km,
                time: rs.scheduled_arrival_offset_min,
                isSource: rs.is_source,
                isDestination: rs.is_destination,
                latitude: rs.stop.latitude,
                longitude: rs.stop.longitude
            }))
        };
    } catch (error) {
        console.error(`Error fetching route stops for bus ${busNumber}:`, error.message);
        // Final fallback
        if (mockRouteStore[busNumber]) {
            let routeStops = mockRouteStore[busNumber];
            routeStops = augmentWithCoordinates(busNumber, routeStops);
            const first = routeStops[0];
            const last = routeStops[routeStops.length - 1];
            return {
                id: busNumber,
                name: `${first.name} - ${last.name}`,
                stops: routeStops
            };
        }
        return null;
    }
}

// ====================================================
// CROWD DETECTION FUNCTIONS
// ====================================================

/**
 * Update crowd data from camera/sensor
 */
async function updateCrowdData(busNumber, passengerCount) {
    try {
        // Mock fallback if DB fails
        let bus = { bus_id: 'mock-id', capacity: 50 };
        try {
            bus = await getBusByNumber(busNumber);
        } catch (e) {
            console.log(`[DB] Bus lookup failed (using mock): ${e.message}`);
        }

        if (!bus) {
            bus = { bus_id: 'mock-id', capacity: 50 };
        }

        const capacityPercentage = Math.round((passengerCount / bus.capacity) * 100);

        // --- 1. UPDATE IN-MEMORY STORE (Crucial for fallback display) ---
        mockCrowdStore[busNumber] = {
            passengers: passengerCount,
            capacityPercentage: capacityPercentage,
            lastUpdate: new Date().toISOString()
        };
        console.log(`[MEMORY] Store updated for ${busNumber}: ${passengerCount} (${capacityPercentage}%)`);

        // --- 2. TRY UPDATING DB ---
        try {
            const { data, error } = await supabase
                .from('bus_crowding')
                .insert({
                    bus_id: bus.bus_id,
                    trip_id: null,
                    passenger_count: passengerCount,
                    capacity_percentage: capacityPercentage,
                    detection_source: 'CAMERA'
                })
                .select()
                .single();

            if (error) throw error;
            console.log(`[DB] Updated crowd for ${busNumber}: ${passengerCount} passengers (${capacityPercentage}%)`);
            return data;
        } catch (dbError) {
            console.log(`[DB] Update failed (${dbError.message}), using in-memory store`);
            return {
                bus_id: bus.bus_id,
                passenger_count: passengerCount,
                capacity_percentage: capacityPercentage,
                timestamp: new Date().toISOString()
            };
        }
    } catch (error) {
        console.error(`Error in updateCrowdData wrapper:`, error.message);
        return { success: true, note: 'fallback' };
    }
}

/**
 * Get latest crowd data for a bus
 */
async function getLatestCrowdData(busNumber) {
    try {
        // 1. Try DB fetch first
        const bus = await getBusByNumber(busNumber);

        if (bus) {
            const { data, error } = await supabase
                .from('bus_crowding')
                .select('*')
                .eq('bus_id', bus.bus_id)
                .order('timestamp', { ascending: false })
                .limit(1)
                .single();

            if (data && !error) {
                return {
                    passengers: data.passenger_count,
                    capacityPercentage: data.capacity_percentage,
                    lastUpdate: data.timestamp
                };
            }
        }

        // 2. Fallback to In-Memory Store if DB fetch failed or bus not found
        console.warn(`[DB] Could not fetch crowd data for ${busNumber} from DB. Using Memory Store.`);
        const memData = mockCrowdStore[busNumber] || { passengers: 0, capacityPercentage: 0, lastUpdate: new Date() };
        return {
            passengers: memData.passengers,
            capacityPercentage: memData.capacityPercentage,
            lastUpdate: memData.lastUpdate
        };

    } catch (error) {
        console.error(`Error fetching crowd data for ${busNumber}:`, error.message);
        // Fallback to memory store on error
        const memData = mockCrowdStore[busNumber] || { passengers: 0, capacityPercentage: 0, lastUpdate: new Date() };
        return {
            passengers: memData.passengers,
            capacityPercentage: memData.capacityPercentage,
            lastUpdate: memData.lastUpdate
        };
    }
}

// ====================================================
// TRIP FUNCTIONS
// ====================================================

/**
 * Get all active trips with bus and route info
 */
async function getActiveTrips() {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select(`
                trip_id,
                trip_date,
                status,
                bus:buses(bus_number, capacity, bus_type),
                route:routes(name, total_distance_km),
                driver:drivers(name, rating)
            `)
            .eq('status', 'IN_PROGRESS');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching active trips:', error.message);
        return [];
    }
}

/**
 * Get active trips with crowd data (for bus list display)
 */
async function getActiveBusesWithCrowd() {
    try {
        // Get all active trips
        const trips = await getActiveTrips();

        // If no active trips, return sample data as fallback
        if (!trips || trips.length === 0) {
            console.log('[DB] No active trips found, using fallback sample data');
            return getSampleBusData(); // Used by fallback, this returns data with crowd info from memory store
        }

        const busesWithCrowd = await Promise.all(
            trips.map(async (trip) => {
                const crowdData = await getLatestCrowdData(trip.bus.bus_number);

                return {
                    id: trip.bus.bus_number,
                    route: trip.route.name,
                    crowd: crowdData.capacityPercentage || 0,
                    status: 'On Time',
                    eta: '5 min',
                    capacity: trip.bus.capacity,
                    passengers: crowdData.passengers || 0
                };
            })
        );

        return busesWithCrowd;
    } catch (error) {
        console.error('Error fetching buses with crowd:', error.message);
        return getSampleBusData();
    }
}

/**
 * Fallback sample bus data for when database is not set up
 * UPDATED: Merges with in-memory crowd data for live updates
 */
function getSampleBusData() {
    const rawData = [
        { id: '221H', route: 'Chennai Central - Thiruporur Bus Stand', crowd: 45, status: 'On Time', eta: '3 min' },
        { id: '45C', route: 'Koyambedu - Airport', crowd: 60, status: 'Delayed', eta: '12 min' },
        { id: '77', route: 'Avadi - C.M.B.T', crowd: 75, status: 'On Time', eta: '8 min' },
        { id: '570', route: 'Kelambakkam - C.M.B.T', crowd: 90, status: 'V. Crowded', eta: '1 min' },
        { id: '5B', route: 'Thiyagaraya Nagar - Mylapore Tank', crowd: 30, status: 'On Time', eta: '6 min' },
        { id: 'A1', route: 'Thiruvanmiyur - Central Rly Stn', crowd: 15, status: 'On Time', eta: '10 min' },
        // Legacy
        { id: '12A', route: 'Central Stn - Tech Park', crowd: 65, status: 'On Time', eta: '15 min' },
        { id: '21G', route: 'Broadway - Tambaram', crowd: 45, status: 'On Time', eta: '8 min' }
    ];

    // Merge live updates from memory store
    return rawData.map(bus => {
        const mem = mockCrowdStore[bus.id];
        if (mem) { // If we have ANY updates (including 0 passengers), use them
            return {
                ...bus,
                crowd: mem.capacityPercentage,
                livePassengers: mem.passengers,
                passengers: mem.passengers
            };
        }
        return bus;
    });
}

// ====================================================
// EXPORT ALL FUNCTIONS
// ====================================================

/**
 * Find active buses that stop at a specific location
 */
async function findBusesServingStop(locationName) {
    try {
        // 1. Find stops matching the name
        const { data: stops, error: stopError } = await supabase
            .from('stops')
            .select('stop_id, name')
            .ilike('name', `%${locationName}%`);

        if (stopError || !stops.length) return [];

        const stopIds = stops.map(s => s.stop_id);

        // 2. Find routes that include these stops
        const { data: routeStops, error: rsError } = await supabase
            .from('route_stops')
            .select('route_id')
            .in('stop_id', stopIds);

        if (rsError || !routeStops.length) return [];

        const routeIds = [...new Set(routeStops.map(rs => rs.route_id))];

        // 3. Find active trips on these routes
        const { data: trips, error: tripError } = await supabase
            .from('trips')
            .select(`
                trip_id, 
                bus:buses(bus_number, capacity),
                route:routes(name)
            `)
            .in('route_id', routeIds)
            .eq('status', 'IN_PROGRESS');

        if (tripError) return [];

        // 4. Format results
        if (trips && trips.length > 0) {
            return Promise.all(trips.map(async t => {
                const crowd = await getLatestCrowdData(t.bus.bus_number);
                return {
                    id: t.bus.bus_number,
                    route: t.route.name,
                    crowd: crowd.capacityPercentage,
                    eta: '10 min', // Mock ETA for generic query
                    destination_match: stops[0].name // The matched stop name
                };
            }));
        }

        // Fallback: Check mock store if using mock data
        const matches = [];
        Object.keys(mockRouteStore).forEach(busId => {
            const stops = mockRouteStore[busId];
            if (stops.some(s => s.name.toLowerCase().includes(locationName.toLowerCase()))) {
                matches.push({
                    id: busId,
                    route: `${stops[0].name} - ${stops[stops.length - 1].name}`,
                    crowd: mockCrowdStore[busId]?.capacityPercentage || 0,
                    destination_match: stops.find(s => s.name.toLowerCase().includes(locationName.toLowerCase())).name
                });
            }
        });
        return matches;

    } catch (error) {
        console.error('Error searching buses by stop:', error.message);
        return [];
    }
}

module.exports = {
    supabase,
    getAllBuses,
    getBusByNumber,
    getAllRoutes,
    getRouteStopsByBusNumber,
    updateCrowdData,
    getLatestCrowdData,
    getActiveTrips,
    getActiveBusesWithCrowd,
    findBusesServingStop
};
