"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Clearing existing database entries to remove old Karnataka records...');
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.gPSLocation.deleteMany({});
    await prisma.trip.deleteMany({});
    await prisma.schedule.deleteMany({});
    await prisma.routeStop.deleteMany({});
    await prisma.route.deleteMany({});
    await prisma.maintenance.deleteMany({});
    await prisma.fuelLog.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.student.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.passenger.deleteMany({});
    await prisma.driver.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.setting.deleteMany({});
    console.log('Seeding Database...');
    // 1. Seed Roles
    const roles = [
        { name: 'Super Administrator', description: 'Complete administrative access' },
        { name: 'Transport Manager', description: 'Fleet and route planner manager' },
        { name: 'Dispatcher', description: 'Live tracking monitor and dispatcher' },
        { name: 'Scheduler', description: 'Schedule allocator' },
        { name: 'Driver', description: 'Vehicle operator' },
        { name: 'Bus Operator', description: 'Third party bus contractor' },
        { name: 'Maintenance Manager', description: 'Garage and service logger' },
        { name: 'Student/Passenger', description: 'Commuter portal user' },
        { name: 'Faculty/Employee', description: 'Commuter portal user' },
        { name: 'Security Officer', description: 'Gate and parking log monitor' },
        { name: 'Finance Officer', description: 'Fuel and repair billing tracker' },
    ];
    const roleMap = new Map();
    for (const r of roles) {
        const roleRecord = await prisma.role.upsert({
            where: { name: r.name },
            update: {},
            create: { name: r.name, description: r.description },
        });
        roleMap.set(r.name, roleRecord.id);
    }
    console.log('Roles seeded successfully.');
    // 2. Hash default passwords
    const salt = await bcryptjs_1.default.genSalt(10);
    const adminPasswordHash = await bcryptjs_1.default.hash('admin123', salt);
    const driverPasswordHash = await bcryptjs_1.default.hash('driver123', salt);
    const passengerPasswordHash = await bcryptjs_1.default.hash('passenger123', salt);
    // 3. Seed Users
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@transitflow.com' },
        update: {},
        create: {
            email: 'admin@transitflow.com',
            password: adminPasswordHash,
            name: 'Super Admin User',
            roleId: roleMap.get('Super Administrator'),
        },
    });
    const driverUser = await prisma.user.upsert({
        where: { email: 'driver@transitflow.com' },
        update: {},
        create: {
            email: 'driver@transitflow.com',
            password: driverPasswordHash,
            name: 'John Doe (Driver)',
            roleId: roleMap.get('Driver'),
        },
    });
    const passengerUser = await prisma.user.upsert({
        where: { email: 'student@transitflow.com' },
        update: {},
        create: {
            email: 'student@transitflow.com',
            password: passengerPasswordHash,
            name: 'Alice Smith (Student)',
            roleId: roleMap.get('Student/Passenger'),
        },
    });
    console.log('Users seeded successfully.');
    // 4. Seed Drivers
    const driver = await prisma.driver.upsert({
        where: { licenseNumber: 'DL-2026-0001' },
        update: {},
        create: {
            userId: driverUser.id,
            licenseNumber: 'DL-2026-0001',
            licenseExpiry: new Date('2035-12-31'),
            medicalStatus: 'FIT',
            availabilityStatus: 'AVAILABLE',
            performanceScore: 4.8,
        },
    });
    console.log('Driver profiles seeded successfully.');
    // 5. Seed Buses
    const bus1 = await prisma.bus.upsert({
        where: { registrationNumber: 'DL-01-AB-1234' },
        update: {},
        create: {
            registrationNumber: 'DL-01-AB-1234',
            model: 'Volvo B11R',
            capacity: 45,
            status: 'AVAILABLE',
            category: 'AC_SEATER',
        },
    });
    const bus2 = await prisma.bus.upsert({
        where: { registrationNumber: 'DL-01-AB-5678' },
        update: {},
        create: {
            registrationNumber: 'DL-01-AB-5678',
            model: 'Tata LPO 1618',
            capacity: 55,
            status: 'AVAILABLE',
            category: 'NON_AC_SEATER',
        },
    });
    console.log('Bus Fleet seeded successfully.');
    // 6. Seed Routes
    const route1 = await prisma.route.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            name: 'Kashmere Gate to Anand Vihar ISBT',
            startLocation: 'Kashmere Gate ISBT',
            endLocation: 'Anand Vihar ISBT',
            totalDistance: 22.5,
            totalDuration: 45,
        },
    });
    // Seed RouteStops for Route 1
    const stops = [
        { stopName: 'Kashmere Gate ISBT', stopOrder: 1, latitude: 28.667500, longitude: 77.228200, etaOffset: 0 },
        { stopName: 'Connaught Place', stopOrder: 2, latitude: 28.630400, longitude: 77.217700, etaOffset: 10 },
        { stopName: 'Lajpat Nagar', stopOrder: 3, latitude: 28.570800, longitude: 77.242500, etaOffset: 30 },
        { stopName: 'Anand Vihar ISBT', stopOrder: 4, latitude: 28.650200, longitude: 77.302700, etaOffset: 45 },
    ];
    await prisma.routeStop.deleteMany({ where: { routeId: route1.id } });
    for (const s of stops) {
        await prisma.routeStop.create({
            data: {
                routeId: route1.id,
                stopName: s.stopName,
                stopOrder: s.stopOrder,
                latitude: s.latitude,
                longitude: s.longitude,
                etaOffset: s.etaOffset,
            },
        });
    }
    console.log('Routes and Stops seeded successfully.');
    // 7. Seed Passenger profiles
    const passenger = await prisma.passenger.upsert({
        where: { idCardNumber: 'ST-99481' },
        update: {},
        create: {
            userId: passengerUser.id,
            passengerType: 'STUDENT',
            idCardNumber: 'ST-99481',
        },
    });
    await prisma.student.upsert({
        where: { passengerId: passenger.id },
        update: {},
        create: {
            passengerId: passenger.id,
            rollNumber: 'ROLL-1029-A',
            department: 'Computer Science & Engineering',
            batch: 'Class of 2027',
        },
    });
    console.log('Commuter profiles seeded successfully.');
    // 8. Seed Schedules
    await prisma.schedule.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            routeId: route1.id,
            busId: bus1.id,
            driverId: driver.id,
            departureTime: '08:30',
            arrivalTime: '09:15',
            recurrence: 'DAILY',
            status: 'ACTIVE',
        },
    });
    console.log('Schedules seeded successfully.');
    // 9. Seed Settings
    const settings = [
        { key: 'system_brand', value: 'TransitFlow', description: 'Product Brand Name' },
        { key: 'max_speed_limit', value: '70', description: 'Maximum permitted fleet speed (km/h)' },
        { key: 'geofence_radius_meters', value: '150', description: 'Standard arrival detection radius' },
    ];
    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: { key: s.key, value: s.value, description: s.description },
        });
    }
    console.log('Configuration Settings seeded successfully.');
    console.log('Seeding Complete!');
}
main()
    .catch((e) => {
    console.error('Error during seeding', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
