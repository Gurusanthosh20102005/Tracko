import { createClient } from '@supabase/supabase-js'

// ====================================================
// SUPABASE CLIENT CONFIGURATION
// ====================================================

const supabaseUrl = 'https://egccnktderbphdvqfnth.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY || 'your-anon-key-here'
const supabase = createClient(supabaseUrl, supabaseKey)

// ====================================================
// REAL-TIME TRACKING FUNCTIONS
// ====================================================

/**
 * Update bus GPS location (called from bus device)
 * @param busId - UUID of the bus
 * @param tripId - UUID of the current trip
 * @param location - {latitude, longitude, speed, heading}
 */
export async function updateBusLocation(busId, tripId, location) {
    const { data, error } = await supabase
        .from('live_location')
        .insert({
            bus_id: busId,
            trip_id: tripId,
            latitude: location.latitude,
            longitude: location.longitude,
            speed: location.speed,
            heading: location.heading,
            timestamp: new Date().toISOString()
        })

    if (error) throw error
    return data
}

/**
 * Subscribe to real-time bus location updates
 * @param busId - UUID of the bus to track
 * @param callback - Function to call when location updates
 */
export function subscribeToBusLocation(busId, callback) {
    return supabase
        .channel(`bus:${busId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'live_location',
                filter: `bus_id=eq.${busId}`
            },
            callback
        )
        .subscribe()
}

/**
 * Get latest location for a bus
 */
export async function getLatestBusLocation(busId) {
    const { data, error } = await supabase
        .from('live_location')
        .select('*')
        .eq('bus_id', busId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

    if (error) throw error
    return data
}

// ====================================================
// CROWD DETECTION FUNCTIONS
// ====================================================

/**
 * Update crowd data from camera/sensor
 */
export async function updateCrowdData(busId, tripId, crowdData) {
    const capacity = await getBusCapacity(busId)
    const capacityPercentage = Math.round((crowdData.passengerCount / capacity) * 100)

    const { data, error } = await supabase
        .from('bus_crowding')
        .insert({
            bus_id: busId,
            trip_id: tripId,
            passenger_count: crowdData.passengerCount,
            capacity_percentage: capacityPercentage,
            detection_source: crowdData.source || 'CAMERA'
        })

    if (error) throw error
    return data
}

/**
 * Subscribe to crowd updates for a bus
 */
export function subscribeToCrowdUpdates(busId, callback) {
    return supabase
        .channel(`crowd:${busId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'bus_crowding',
                filter: `bus_id=eq.${busId}`
            },
            callback
        )
        .subscribe()
}

// ====================================================
// ROUTE & STOPS FUNCTIONS
// ====================================================

/**
 * Get route with all intermediate stops in sequence
 */
export async function getRouteWithStops(routeId) {
    const { data, error } = await supabase
        .from('route_details')
        .select('*')
        .eq('route_id', routeId)
        .order('sequence_number', { ascending: true })

    if (error) throw error
    return data
}

/**
 * Get all active routes
 */
export async function getActiveRoutes() {
    const { data, error } = await supabase
        .from('routes')
        .select(`
      *,
      source_stop:stops!routes_source_stop_id_fkey(name, latitude, longitude),
      destination_stop:stops!routes_destination_stop_id_fkey(name, latitude, longitude),
      operator:operators(name)
    `)
        .eq('is_active', true)

    if (error) throw error
    return data
}

/**
 * Calculate ETA to a specific stop using route_stops data
 */
export async function calculateETAToStop(tripId, targetStopId) {
    // Get current bus location
    const trip = await supabase
        .from('trips')
        .select('bus_id, route_id, actual_start_time')
        .eq('trip_id', tripId)
        .single()

    const currentLocation = await getLatestBusLocation(trip.data.bus_id)

    // Get target stop details from route_stops
    const { data: targetStop } = await supabase
        .from('route_stops')
        .select('sequence_number, distance_from_start_km, scheduled_arrival_offset_min, stop:stops(*)')
        .eq('route_id', trip.data.route_id)
        .eq('stop_id', targetStopId)
        .single()

    // Calculate distance from current location to target stop
    const distanceToStop = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        targetStop.stop.latitude,
        targetStop.stop.longitude
    )

    // Estimate time based on average speed (assume 30 km/h in city)
    const avgSpeed = 30 // km/h
    const timeInHours = distanceToStop / avgSpeed
    const etaMinutes = Math.round(timeInHours * 60)

    return {
        stop: targetStop.stop,
        distanceKm: distanceToStop.toFixed(2),
        etaMinutes,
        etaText: `${etaMinutes} min`
    }
}

// Helper: Haversine formula for distance
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371 // Earth radius in km
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg) {
    return deg * (Math.PI / 180)
}

// ====================================================
// TRIP MANAGEMENT
// ====================================================

/**
 * Get active trips with real-time data
 */
export async function getActiveTrips() {
    const { data, error } = await supabase
        .from('active_trips_with_crowd')
        .select('*')

    if (error) throw error
    return data
}

/**
 * Start a trip
 */
export async function startTrip(tripId) {
    const { data, error } = await supabase
        .from('trips')
        .update({
            actual_start_time: new Date().toTimeString().split(' ')[0],
            status: 'IN_PROGRESS'
        })
        .eq('trip_id', tripId)
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * End a trip
 */
export async function endTrip(tripId) {
    const { data, error } = await supabase
        .from('trips')
        .update({
            actual_end_time: new Date().toTimeString().split(' ')[0],
            status: 'COMPLETED'
        })
        .eq('trip_id', tripId)
        .select()
        .single()

    if (error) throw error
    return data
}

// ====================================================
// TICKET & PAYMENT FUNCTIONS
// ====================================================

/**
 * Book a ticket
 */
export async function bookTicket(userId, tripId, fromStopId, toStopId, passengerCount) {
    const fare = await calculateFare(tripId, fromStopId, toStopId, passengerCount)

    const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
            user_id: userId,
            trip_id: tripId,
            from_stop_id: fromStopId,
            to_stop_id: toStopId,
            passenger_count: passengerCount,
            fare_amount: fare,
            qr_code: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            status: 'VALID',
            valid_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
        })
        .select()
        .single()

    if (ticketError) throw ticketError
    return ticket
}

/**
 * Process payment
 */
export async function processPayment(userId, ticketId, amount, paymentMethod) {
    const { data, error } = await supabase
        .from('payments')
        .insert({
            user_id: userId,
            ticket_id: ticketId,
            amount,
            payment_method: paymentMethod,
            payment_status: 'SUCCESS', // In production, wait for gateway response
            transaction_id: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        })
        .select()
        .single()

    if (error) throw error
    return data
}

// ====================================================
// HELPER FUNCTIONS
// ====================================================

async function getBusCapacity(busId) {
    const { data } = await supabase
        .from('buses')
        .select('capacity')
        .eq('bus_id', busId)
        .single()
    return data.capacity
}

async function calculateFare(tripId, fromStopId, toStopId, passengerCount) {
    // Get route_id from trip
    const { data: trip } = await supabase
        .from('trips')
        .select('route_id')
        .eq('trip_id', tripId)
        .single()

    // Get stops distance difference
    const { data: fromStop } = await supabase
        .from('route_stops')
        .select('distance_from_start_km')
        .eq('route_id', trip.route_id)
        .eq('stop_id', fromStopId)
        .single()

    const { data: toStop } = await supabase
        .from('route_stops')
        .select('distance_from_start_km')
        .eq('route_id', trip.route_id)
        .eq('stop_id', toStopId)
        .single()

    const distance = Math.abs(toStop.distance_from_start_km - fromStop.distance_from_start_km)
    const baseFare = 10 // ₹10 base fare
    const perKmFare = 5 // ₹5 per km

    return (baseFare + (distance * perKmFare)) * passengerCount
}

// ====================================================
// NOTIFICATIONS
// ====================================================

/**
 * Send notification to user
 */
export async function sendNotification(userId, title, message, type = 'SYSTEM', metadata = {}) {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: userId,
            title,
            message,
            type,
            metadata
        })
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * Subscribe to user notifications
 */
export function subscribeToNotifications(userId, callback) {
    return supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${userId}`
            },
            callback
        )
        .subscribe()
}

export default supabase
