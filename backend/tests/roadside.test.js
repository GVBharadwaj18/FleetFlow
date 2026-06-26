import request from 'supertest';
import app from '../src/app.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Vehicle from '../src/models/Vehicle.js';

let mongoServer;
let tokenAdmin;
let tokenUser;
let createdRequestId;
let fakeVehicleId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    const adminUser = { userId: new mongoose.Types.ObjectId().toString(), role: 'admin' };
    tokenAdmin = jwt.sign(adminUser, process.env.JWT_SECRET || 'your-secret-key');

    const standardUser = { userId: new mongoose.Types.ObjectId().toString(), role: 'user' };
    tokenUser = jwt.sign(standardUser, process.env.JWT_SECRET || 'your-secret-key');

    // Create a mock vehicle
    const vehicle = new Vehicle({
        plateNumber: 'TST-1234',
        brand: 'Toyota',
        model: 'Corolla',
        year: 2020,
        vin: '1234567890ABCDEFG',
        ownerId: standardUser.userId,
        categoryId: new mongoose.Types.ObjectId().toString()
    });
    await vehicle.save();
    fakeVehicleId = vehicle._id.toString();
});

afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
});

describe('Roadside Assistance API', () => {
    it('should create a new roadside request [POST]', async () => {
        const res = await request(app)
            .post('/api/roadside')
            .set('Authorization', `Bearer ${tokenUser}`)
            .send({
                vehicle: fakeVehicleId,
                latitude: 40.7128,
                longitude: -74.0060,
                address: '123 Main St, NY',
                issueDescription: 'Flat Tire',
                customDescription: 'Front right tire is completely flat'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('_id');
        expect(res.body.status).toBe('Pending');
        createdRequestId = res.body._id;
    });

    it('should retrieve roadside requests for user [GET]', async () => {
        const res = await request(app)
            .get('/api/roadside')
            .set('Authorization', `Bearer ${tokenUser}`);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
    });

    it('should allow admin to update status [PATCH]', async () => {
        const res = await request(app)
            .patch(`/api/roadside/${createdRequestId}/status`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ status: 'Accepted' });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('Accepted');
    });

    it('should allow admin to assign mechanic [PATCH]', async () => {
        const fakeMechanicId = new mongoose.Types.ObjectId().toString();
        const res = await request(app)
            .patch(`/api/roadside/${createdRequestId}/assign`)
            .set('Authorization', `Bearer ${tokenAdmin}`)
            .send({ mechanicId: fakeMechanicId });

        expect(res.statusCode).toBe(200);
        expect(res.body.assignedMechanic).toBe(fakeMechanicId);
        expect(res.body.status).toBe('Mechanic Assigned');
    });

    it('should allow admin to delete request [DELETE]', async () => {
        const res = await request(app)
            .delete(`/api/roadside/${createdRequestId}`)
            .set('Authorization', `Bearer ${tokenAdmin}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });
});
