// Mock Database - Route Stops Data (simulating database structure)
const routesDatabase = [
    {
        id: '12A',
        name: 'Central Station - Tech Park',
        stops: [
            { name: 'Central Station', sequence: 1, distance: 0, time: 0, isSource: true },
            { name: 'Broadway', sequence: 2, distance: 3.2, time: 8 },
            { name: 'Anna Nagar', sequence: 3, distance: 7.5, time: 18 },
            { name: 'Koyambedu', sequence: 4, distance: 12.0, time: 28 },
            { name: 'Guindy', sequence: 5, distance: 15.5, time: 38 },
            { name: 'Tech Park', sequence: 6, distance: 18.5, time: 45, isDestination: true }
        ]
    },
    {
        id: '45C',
        name: 'Koyambedu - Airport',
        stops: [
            { name: 'Koyambedu', sequence: 1, distance: 0, time: 0, isSource: true },
            { name: 'Anna Nagar', sequence: 2, distance: 4.0, time: 10 },
            { name: 'Airport', sequence: 3, distance: 12.0, time: 30, isDestination: true }
        ]
    },
    {
        id: '21G',
        name: 'Broadway - Tambaram',
        stops: [
            { name: 'Broadway', sequence: 1, distance: 0, time: 0, isSource: true },
            { name: 'Central Station', sequence: 2, distance: 1.5, time: 5 },
            { name: 'Guindy', sequence: 3, distance: 8.0, time: 20 },
            { name: 'Adyar Signal', sequence: 4, distance: 14.0, time: 35 },
            { name: 'Tambaram', sequence: 5, distance: 22.0, time: 55, isDestination: true }
        ]
    },
    {
        id: '570',
        name: 'CMBT - Siruseri',
        stops: [
            { name: 'CMBT Bus Stand', sequence: 1, distance: 0, time: 0, isSource: true },
            { name: 'Guindy', sequence: 2, distance: 8.5, time: 20 },
            { name: 'Adyar Signal', sequence: 3, distance: 14.2, time: 35 },
            { name: 'Tech Park', sequence: 4, distance: 20.5, time: 50 },
            { name: 'Siruseri', sequence: 5, distance: 28.0, time: 70, isDestination: true }
        ]
    },
    {
        id: '5B',
        name: 'Adyar - T.Nagar',
        stops: [
            { name: 'Adyar Signal', sequence: 1, distance: 0, time: 0, isSource: true },
            { name: 'Guindy', sequence: 2, distance: 6.2, time: 15 },
            { name: 'Anna Nagar', sequence: 3, distance: 14.8, time: 35 },
            { name: 'T.Nagar', sequence: 4, distance: 18.5, time: 45, isDestination: true }
        ]
    },
    {
        id: 'A1',
        name: 'Central - Airport',
        stops: [
            { name: 'Central Station', sequence: 1, distance: 0, time: 0, isSource: true },
            { name: 'Anna Nagar', sequence: 2, distance: 5.0, time: 12 },
            { name: 'Koyambedu', sequence: 3, distance: 9.0, time: 22 },
            { name: 'Airport', sequence: 4, distance: 21.0, time: 50, isDestination: true }
        ]
    }
];

module.exports = routesDatabase;
