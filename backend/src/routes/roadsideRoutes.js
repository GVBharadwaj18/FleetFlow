import express from 'express';
import {
    createRequest,
    getRequests,
    getRequestById,
    updateStatus,
    assignMechanic,
    deleteRequest
} from '../controllers/roadsideController.js';
import { roleMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Customers, Mechanics, Admins can get all (filtered by logic in controller)
router.get('/', getRequests);

// Customers can create a request
router.post('/', roleMiddleware(['user', 'admin']), createRequest);

// Anyone involved can get by ID
router.get('/:id', getRequestById);

// Admin and Mechanic can update status
router.patch('/:id/status', roleMiddleware(['admin', 'mechanic']), updateStatus);

// Only Admin can assign mechanic
router.patch('/:id/assign', roleMiddleware(['admin']), assignMechanic);

// Only Admin can delete
router.delete('/:id', roleMiddleware(['admin']), deleteRequest);

export default router;
