import mongoose from 'mongoose';

const roadsideRequestSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  address: {
    type: String,
    required: false
  },
  issueDescription: {
    type: String,
    enum: ['Flat Tire', 'Battery Problem', 'Engine Issue', 'Lockout', 'Out of Gas', 'Unknown Issue', 'Other'],
    required: true,
    default: 'Unknown Issue'
  },
  customDescription: {
    type: String,
    required: false
  },
  imageUrl: {
    type: String, // base64 string or url
    required: false
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Mechanic Assigned', 'On The Way', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  assignedMechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

const RoadsideRequest = mongoose.model('RoadsideRequest', roadsideRequestSchema);

export default RoadsideRequest;
