// backend/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";

import User from "./src/models/User.js";
import Customer from "./src/models/Customer.js";
import VehicleCategory from "./src/models/VehicleCategory.js";
import Vehicle from "./src/models/Vehicle.js";
import MaintenanceRecord from "./src/models/MaintenanceRecord.js";
import Bill from "./src/models/Bill.js";
import Part from "./src/models/Part.js";
import Invoice from "./src/models/Invoice.js";
import RoadsideRequest from "./src/models/RoadsideRequest.js";
import Appointment from "./src/models/Appointment.js";

dotenv.config();

async function seed() {
    try {
        const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/fleetflow";
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB for seeding...");

        // Clear existing collections
        await Promise.all([
            User.deleteMany(),
            Customer.deleteMany(),
            VehicleCategory.deleteMany(),
            Vehicle.deleteMany(),
            MaintenanceRecord.deleteMany(),
            Bill.deleteMany(),
            Part.deleteMany(),
            Invoice.deleteMany(),
            RoadsideRequest.deleteMany(),
            Appointment.deleteMany()
        ]);
        console.log("✔ Old data cleared.");

        // 1. Seed Demo Users
        const adminUser = await User.create({
            username: "admin",
            email: "admin@fleetflow.com",
            passwordHash: "admin123",
            role: "admin"
        });

        const mechanicUser = await User.create({
            username: "mechanic_rajesh",
            email: "mechanic@fleetflow.com",
            passwordHash: "mechanic123",
            role: "mechanic"
        });

        const driverUser = await User.create({
            username: "driver_aarav",
            email: "driver@fleetflow.com",
            passwordHash: "driver123",
            role: "user"
        });

        console.log("✔ Created demo users (Admin, Mechanic, Driver)");

        // 2. Seed Customers (Bengaluru Fleet Owners)
        const customerProfiles = [
            { firstName: "Mahindra Fleet Logistics", lastName: "Pvt Ltd", phone: "+91 98450 44102", email: "contact@mahindrafleet.in", address: "100 MG Road, Central Business District, Bengaluru, KA 560001" },
            { firstName: "Priya", lastName: "Sharma", phone: "+91 98450 11928", email: "priya.sharma@example.com", address: "45 100ft Road, Indiranagar, Bengaluru, KA 560038" },
            { firstName: "Silicon Freight Lines", lastName: "India", phone: "+91 98860 88234", email: "dispatch@siliconfreight.in", address: "88 Industrial Park, Koramangala 5th Block, Bengaluru, KA 560095" },
            { firstName: "Deccan Logistics", lastName: "Services", phone: "+91 98490 33412", email: "fleet@deccantrans.com", address: "350 ITPL Main Road, Whitefield, Bengaluru, KA 560066" },
            { firstName: "SwiftRelocate Express", lastName: "India", phone: "+91 98220 55190", email: "ops@swiftrelocate.in", address: "12 Tech Park Avenue, Electronic City Phase 1, Bengaluru, KA 560100" }
        ];
        const customers = await Customer.insertMany(customerProfiles);
        console.log(`✔ Created ${customers.length} customer organizations/owners`);

        // 3. Seed Vehicle Categories
        const categories = await VehicleCategory.insertMany([
            { name: "Heavy Heavy-Duty Commercial Truck" },
            { name: "Electric Vehicle (EV)" },
            { name: "Commercial Cargo Van" },
            { name: "Executive Fleet Sedan" },
            { name: "Hybrid Cargo SUV" }
        ]);

        // 4. Seed Vehicles (Bengaluru KA Registered Fleet)
        const vehiclesData = [
            { plateNumber: "KA-01-MH-8842", brand: "Tata", model: "Prima 5530.S Heavy Hauler", year: 2023, categoryId: categories[0]._id, ownerId: customers[0]._id },
            { plateNumber: "KA-03-EQ-4491", brand: "Tata", model: "Nexon EV Fleet Edition", year: 2024, categoryId: categories[1]._id, ownerId: customers[1]._id },
            { plateNumber: "KA-05-AB-1209", brand: "Mahindra", model: "Bolero Maxi Truck HD", year: 2022, categoryId: categories[2]._id, ownerId: customers[2]._id },
            { plateNumber: "KA-51-EX-5521", brand: "Ashok Leyland", model: "AVTR 2820 Rigid Truck", year: 2023, categoryId: categories[0]._id, ownerId: customers[3]._id },
            { plateNumber: "KA-04-KB-7733", brand: "Hyundai", model: "Tucson Plug-in Hybrid", year: 2023, categoryId: categories[4]._id, ownerId: customers[4]._id },
            { plateNumber: "KA-02-DN-3310", brand: "Eicher", model: "Pro 3019 Commercial Van", year: 2024, categoryId: categories[2]._id, ownerId: customers[0]._id }
        ];
        const vehicles = await Vehicle.insertMany(vehiclesData);
        console.log(`✔ Created ${vehicles.length} fleet vehicles`);

        // 5. Seed Inventory Spare Parts
        const parts = await Part.insertMany([
            { name: "Tata Heavy Duty Ceramic Brake Pads", quantity: 45, price: 3500 },
            { name: "Synthetic Motor Oil (5W-30 5L)", quantity: 120, price: 2800 },
            { name: "High-Efficiency Air Filter Engine", quantity: 8, price: 850 }, // low stock trigger
            { name: "Bosch Iridium Spark Plugs (Set of 4)", quantity: 60, price: 1400 },
            { name: "Exide Commercial 12V Battery", quantity: 14, price: 8500 },
            { name: "Tata EV HEPA Cabin Filter", quantity: 30, price: 1200 }
        ]);
        console.log(`✔ Created ${parts.length} inventory parts with low-stock warnings`);

        // 6. Seed Maintenance Records, Bills & Invoices
        for (let i = 0; i < vehicles.length; i++) {
            const v = vehicles[i];
            const cust = customers[i % customers.length];
            const serviceCost = 2500 + (i * 1200);

            const services = [
                { description: "Full Diagnostic Scan & Sensor Calibration", cost: 1500 },
                { description: "Preventative Brake Pad & Rotor Inspection", cost: serviceCost }
            ];

            const maintenance = await MaintenanceRecord.create({
                vehicleId: v._id,
                serviceDate: new Date(Date.now() - (i + 1) * 86400000 * 3),
                services,
                partsUsed: [parts[i % parts.length]._id]
            });

            const totalPrice = services.reduce((acc, s) => acc + s.cost, 0);

            await Bill.create({
                vehicle: v._id,
                customer: cust._id,
                maintenanceId: maintenance._id,
                services: services.map(s => ({ description: s.description, price: s.cost })),
                totalPrice,
                date: new Date(Date.now() - (i + 1) * 86400000 * 3)
            });

            await Invoice.create({
                customerId: cust._id,
                vehicleId: v._id,
                date: new Date(Date.now() - (i + 1) * 86400000 * 3),
                total: totalPrice,
                services
            });
        }
        console.log("✔ Created maintenance records, bills, and invoices");

        // 7. Seed Active Roadside Assistance Dispatches (Bengaluru Locations)
        await RoadsideRequest.create({
            vehicleId: vehicles[2]._id,
            driverId: driverUser._id,
            location: { latitude: 12.9784, longitude: 77.6408, address: "100ft Road, Indiranagar, Bengaluru, Karnataka 560038" },
            issueType: "Engine Misfire / Mechanical Breakdown",
            status: "assigned",
            assignedMechanicId: mechanicUser._id,
            notes: "Driver reported sudden loss of engine power near Indiranagar Metro Station."
        });

        await RoadsideRequest.create({
            vehicleId: vehicles[4]._id,
            driverId: driverUser._id,
            location: { latitude: 12.9698, longitude: 77.7499, address: "ITPL Main Road, Whitefield, Bengaluru, Karnataka 560066" },
            issueType: "Tire Blowout",
            status: "pending",
            notes: "Rear passenger side tire failure near ITPL Tech Park main gate."
        });

        console.log("✔ Created active roadside assistance dispatches");

        console.log("\n🎉 FleetFlow Database Seeded Successfully!");
        console.log("-----------------------------------------");
        console.log("Demo Credentials:");
        console.log("  Admin:    admin@fleetflow.com / admin123");
        console.log("  Mechanic: mechanic@fleetflow.com / mechanic123");
        console.log("  Driver:   driver@fleetflow.com / driver123");
        console.log("-----------------------------------------\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding Error:", error);
        process.exit(1);
    }
}

seed();
