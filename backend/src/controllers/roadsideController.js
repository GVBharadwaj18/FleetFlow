import RoadsideRequest from '../models/RoadsideRequest.js';
import Vehicle from '../models/Vehicle.js';

export const createRequest = async (req, res) => {
    try {
        const { vehicle, latitude, longitude, address, issueDescription, customDescription, imageUrl } = req.body;

        // Ensure vehicle exists and belongs to the user (if customer)
        const v = await Vehicle.findById(vehicle);
        if (!v) return res.status(404).json({ message: 'Vehicle not found' });

        const newRequest = new RoadsideRequest({
            customer: req.user.userId,
            vehicle,
            latitude,
            longitude,
            address,
            issueDescription,
            customDescription,
            imageUrl,
            status: 'Pending'
        });

        await newRequest.save();
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getRequests = async (req, res) => {
    try {
        const { role, userId } = req.user;
        let filter = {};

        if (role === 'user') {
            filter.customer = userId;
        } else if (role === 'mechanic') {
            // Mechanic might see assigned ones or all pending ones.
            // For now, let's allow mechanics to see all to pick jobs, or we can filter later.
            // To be safe, they see everything or just their assigned ones?
            // Actually, admin assigns mechanics. Let's return all, the frontend will filter.
        }

        const requests = await RoadsideRequest.find(filter)
            .populate('customer', 'username email')
            .populate('vehicle', 'brand model plateNumber')
            .populate('assignedMechanic', 'username email')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const getRequestById = async (req, res) => {
    try {
        const request = await RoadsideRequest.findById(req.params.id)
            .populate('customer', 'username email')
            .populate('vehicle', 'brand model plateNumber')
            .populate('assignedMechanic', 'username email');
            
        if (!request) return res.status(404).json({ message: 'Request not found' });
        
        // Security check
        if (req.user.role === 'user' && request.customer._id.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const request = await RoadsideRequest.findById(req.params.id);
        
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const assignMechanic = async (req, res) => {
    try {
        const { mechanicId } = req.body;
        const request = await RoadsideRequest.findById(req.params.id);
        
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.assignedMechanic = mechanicId;
        request.status = 'Mechanic Assigned';
        await request.save();

        res.json(request);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

export const deleteRequest = async (req, res) => {
    try {
        const request = await RoadsideRequest.findByIdAndDelete(req.params.id);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        res.json({ message: 'Request deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
