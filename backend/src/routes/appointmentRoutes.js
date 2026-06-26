import express from 'express';
import {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  deleteAppointment
} from '../controllers/appointmentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(authMiddleware, getAppointments)
  .post(authMiddleware, createAppointment);

router.route('/:id/status')
  .put(authMiddleware, updateAppointmentStatus);

router.route('/:id')
  .delete(authMiddleware, deleteAppointment);

export default router;
