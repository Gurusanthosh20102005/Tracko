# Tracko Supabase Database Setup Guide

This guide will walk you through setting up the Supabase database for Tracko.

## Prerequisites

- Supabase account (created at https://supabase.com)
- Supabase Project URL: `https://egccnktderbphdvqfnth.supabase.co`
- Supabase API Key: Already configured in `.env`

## Step 1: Access Your Supabase Project

1. Go to https://supabase.com and sign in
2. Open your project: `egccnktderbphdvqfnth`
3. Navigate to the **SQL Editor** in the left sidebar

## Step 2: Run the Database Schema

1. In the SQL Editor, click **New Query**
2. Copy and paste the entire contents of `database/schema.sql` into the editor
3. Click **Run** to execute the schema
4. You should see a success message indicating all tables, views, and indexes were created

**What this creates:**
- 15 tables (users, buses, routes, stops, trips, tickets, payments, etc.)
- Views for common queries
- Indexes for performance
- Row Level Security policies
- Triggers for automatic updates

## Step 3: Insert Sample Data

1. Click **New Query** again
2. Copy and paste the entire contents of `database/sample_data.sql` into the editor
3. Click **Run** to insert the sample data
4. You should see success messages for all INSERT statements

**What this adds:**
- 5 sample users
- 3 bus operators
- 5 buses (12A, 45C, 21G, 570, A1)
- 10 bus stops across Chennai
- 3 routes with intermediate stops
- 2 trips (1 completed, 1 in progress)
- GPS location data
- Crowd detection data
- 2 tickets and 1 pass
- Notifications and feedback

## Step 4: Verify the Data

Run these queries to verify your data:

```sql
-- Check buses
SELECT * FROM buses;

-- Check routes with stops
SELECT * FROM route_details ORDER BY route_id, sequence_number;

-- Check active trips
SELECT * FROM active_trips_with_crowd;

-- Check crowd data
SELECT * FROM bus_crowding ORDER BY timestamp DESC LIMIT 10;
```

## Step 5: Test the Application

1. Make sure the server is running:
   ```bash
   cd server
   node server.js
   ```

2. Test the API endpoints:
   ```bash
   # Get all routes
   curl http://localhost:3000/api/routes

   # Get all buses
   curl http://localhost:3000/api/buses

   # Get route stops for bus 12A
   curl http://localhost:3000/api/routes/12A/stops

   # Get crowd status for bus 12A
   curl http://localhost:3000/api/crowd/status?id=12A
   ```

3. Open the web app:
   - Navigate to http://localhost:3000
   - You should see buses loaded from the database
   - The bus list should show buses with crowd levels

## Step 6: Test Crowd Detection

1. Run the crowd detection script:
   ```bash
   python crowd_detection.py --vehicle-id 12A --video-source 0 --interval 2
   ```

2. The script will:
   - Detect people in the camera feed
   - Send updates to the server
   - Store crowd data in Supabase

3. Check the database:
   ```sql
   SELECT * FROM bus_crowding 
   WHERE bus_id = (SELECT bus_id FROM buses WHERE bus_number = '12A')
   ORDER BY timestamp DESC
   LIMIT 5;
   ```

## Troubleshooting

### Issue: No buses showing up

**Solution:** Make sure you have active trips in the database. Check:
```sql
SELECT * FROM trips WHERE status = 'IN_PROGRESS';
```

If no trips exist, the `/api/buses` endpoint will return an empty array. You can:
1. Rerun the sample_data.sql script
2. OR manually insert a trip:
```sql
INSERT INTO trips (route_id, bus_id, driver_id, trip_date, scheduled_start_time, actual_start_time, status)
VALUES (
    (SELECT route_id FROM routes LIMIT 1),
    (SELECT bus_id FROM buses WHERE bus_number = '12A'),
    (SELECT driver_id FROM drivers LIMIT 1),
    CURRENT_DATE,
    '09:00:00',
    '09:01:00',
    'IN_PROGRESS'
);
```

### Issue: "Route not found" errors

**Solution:** Make sure route_stops data exists:
```sql
SELECT r.name, COUNT(rs.route_stop_id) as stop_count
FROM routes r
LEFT JOIN route_stops rs ON r.route_id = rs.route_id
GROUP BY r.route_id, r.name;
```

Each route should have multiple stops. If not, rerun sample_data.sql.

### Issue: Crowd detection not updating

**Solution:**
1. Check that the bus exists in the database
2. Verify the server is receiving updates (check server logs)
3. Run this query to see recent crowd updates:
```sql
SELECT b.bus_number, bc.passenger_count, bc.timestamp
FROM bus_crowding bc
JOIN buses b ON bc.bus_id = b.bus_id
ORDER BY bc.timestamp DESC
LIMIT 10;
```

## Environment Variables

Make sure your `server/.env` file has:
```
SUPABASE_URL=https://egccnktderbphdvqfnth.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Next Steps

- Add more buses and routes in Supabase
- Configure RLS policies for user authentication
- Set up real-time subscriptions for live updates
- Deploy to production

## Database Structure Overview

```
users → tickets/passes → payments
buses → trips → live_location, bus_crowding
routes → route_stops → stops
operators → buses, routes
drivers → trips
```

## Support

If you encounter issues:
1. Check the browser console for errors
2. Check the server logs
3. Verify Supabase credentials
4. Ensure the database schema is properly set up
