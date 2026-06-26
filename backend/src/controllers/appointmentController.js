import Appointment from '../models/Appointment.js';

// GET /api/appointments
// Admins and Mechanics see all. Users see their own.
export const getAppointments = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'user') {
      filter.userId = req.user.id;
    }

    const appointments = await Appointment.find(filter).sort({ appointmentDate: 1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching appointments', error: err.message });
  }
};

// POST /api/appointments
export const createAppointment = async (req, res) => {
  try {
    const {
      customerName, contactNumber, vehicleMake, vehicleModel, 
      vehicleYear, serviceType, appointmentDate, timeSlot, notes
    } = req.body;

    // Validate required fields
    if (!customerName || !contactNumber || !vehicleMake || !vehicleModel || !vehicleYear || !serviceType || !appointmentDate || !timeSlot) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Check for double booking at the exact same date and time slot
    const existingBooking = await Appointment.findOne({ appointmentDate, timeSlot });
    if (existingBooking) {
      return res.status(400).json({ message: 'This time slot is already booked. Please choose another.' });
    }

    const newAppointment = new Appointment({
      userId: req.user.id,
      customerName,
      contactNumber,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      serviceType,
      appointmentDate,
      timeSlot,
      notes
    });

    await newAppointment.save();
    res.status(201).json(newAppointment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to book appointment', error: err.message });
  }
};

// PUT /api/appointments/:id/status
// Only admins/mechanics can change status
export const updateAppointmentStatus = async (req, res) => {
  try {
    if (req.user.role === 'user' && req.body.status !== 'Cancelled') {
      return res.status(403).json({ message: 'Users can only cancel their appointments' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Users can only cancel their OWN appointments
    if (req.user.role === 'user' && appointment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    appointment.status = req.body.status || appointment.status;
    await appointment.save();

    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update status', error: err.message });
  }
};

// DELETE /api/appointments/:id
export const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (req.user.role === 'user' && appointment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete appointment', error: err.message });
  }
};
