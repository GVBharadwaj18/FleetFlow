import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Car, User, FileText, CheckCircle, ChevronRight, ChevronLeft, Zap } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import toast from 'react-hot-toast';

const STEPS = [
  { id: 1, label: 'Personal Info',  icon: User     },
  { id: 2, label: 'Vehicle',        icon: Car      },
  { id: 3, label: 'Appointment',    icon: Calendar },
  { id: 4, label: 'Review',         icon: CheckCircle },
];

const SERVICE_TYPES = [
  { id: 'Oil Change',         desc: 'Full synthetic oil & filter replacement',  time: '45 min',  color: 'text-warning-500 bg-warning-100 dark:bg-warning-500/10' },
  { id: 'Brake Inspection',   desc: 'Comprehensive brake system check & service', time: '60 min', color: 'text-danger-500 bg-danger-100 dark:bg-danger-500/10' },
  { id: 'Engine Diagnostics', desc: 'OBD-II scan & performance analysis',        time: '90 min',  color: 'text-brand-500 bg-brand-100 dark:bg-brand-500/10' },
  { id: 'Tire Rotation',      desc: 'Balance & rotate all four tires',           time: '30 min',  color: 'text-accent-600 bg-accent-100 dark:bg-accent-500/10' },
  { id: 'General Maintenance', desc: 'Comprehensive vehicle health check',       time: '120 min', color: 'text-success-600 bg-success-100 dark:bg-success-500/10' },
];

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];

const FIELD_LABEL = ({ icon: Icon, children }) => (
  <label className="flex items-center gap-1.5 input-label">
    <Icon className="w-3.5 h-3.5" /> {children}
  </label>
);

const Booking = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    customerName: '', contactNumber: '',
    vehicleMake: '', vehicleModel: '', vehicleYear: '',
    serviceType: '', appointmentDate: '', timeSlot: '', notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const setField = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await axiosInstance.post('/api/appointments', formData);
      setSuccess(true);
      toast.success("Appointment booked successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mt-16 px-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-panel p-12 text-center">
          <div className="w-20 h-20 bg-success-100 dark:bg-success-500/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-success-500" />
          </div>
          <h2 className="text-3xl font-display font-bold text-surface-900 dark:text-white mb-3">Booking Confirmed!</h2>
          <p className="text-surface-500 mb-4">
            Your <strong className="text-surface-700 dark:text-surface-300">{formData.serviceType}</strong> appointment has been scheduled for{' '}
            <strong className="text-surface-700 dark:text-surface-300">{formData.appointmentDate}</strong> at <strong className="text-surface-700 dark:text-surface-300">{formData.timeSlot}</strong>.
          </p>
          <p className="text-sm text-surface-400 mb-8">We'll confirm your appointment shortly. Check your dashboard for updates.</p>
          <button onClick={() => { setSuccess(false); setStep(1); setFormData({ customerName: '', contactNumber: '', vehicleMake: '', vehicleModel: '', vehicleYear: '', serviceType: '', appointmentDate: '', timeSlot: '', notes: '' }); }} className="btn-secondary">
            Book Another Service
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shadow-glow-sm">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-surface-900 dark:text-white">Book a Service</h1>
            <p className="text-sm text-surface-500">Complete 4 easy steps to schedule your appointment</p>
          </div>
        </div>
      </motion.div>

      {/* Step Progress */}
      <div className="glass-panel p-5 mb-6">
        <div className="flex items-center gap-0">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <button onClick={() => step > s.id && setStep(s.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${step === s.id ? 'text-brand-600 dark:text-brand-400 font-semibold' : step > s.id ? 'text-success-600 dark:text-success-400 cursor-pointer' : 'text-surface-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${step === s.id ? 'bg-brand-500 text-white shadow-glow-sm' : step > s.id ? 'bg-success-500 text-white' : 'bg-surface-200 dark:bg-surface-700 text-surface-500'}`}>
                  {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
                </div>
                <span className="hidden sm:block text-sm">{s.label}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all ${step > s.id ? 'bg-success-400' : 'bg-surface-200 dark:bg-surface-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="glass-panel p-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-display font-bold text-surface-900 dark:text-white">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FIELD_LABEL icon={User}>Full Name</FIELD_LABEL>
                  <input type="text" name="customerName" required value={formData.customerName} onChange={handleChange} className="input-modern" placeholder="John Doe" />
                </div>
                <div>
                  <FIELD_LABEL icon={FileText}>Contact Number</FIELD_LABEL>
                  <input type="tel" name="contactNumber" required value={formData.contactNumber} onChange={handleChange} className="input-modern" placeholder="+1 234 567 8900" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Vehicle */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-display font-bold text-surface-900 dark:text-white">Vehicle Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <FIELD_LABEL icon={Car}>Make</FIELD_LABEL>
                  <input type="text" name="vehicleMake" required value={formData.vehicleMake} onChange={handleChange} className="input-modern" placeholder="Toyota" />
                </div>
                <div>
                  <FIELD_LABEL icon={Car}>Model</FIELD_LABEL>
                  <input type="text" name="vehicleModel" required value={formData.vehicleModel} onChange={handleChange} className="input-modern" placeholder="Camry" />
                </div>
                <div>
                  <FIELD_LABEL icon={Car}>Year</FIELD_LABEL>
                  <input type="number" name="vehicleYear" required value={formData.vehicleYear} onChange={handleChange} className="input-modern" placeholder="2022" min="1990" max="2026" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Service & Time */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <h2 className="text-lg font-display font-bold text-surface-900 dark:text-white">Service & Schedule</h2>

              {/* Service Type Cards */}
              <div>
                <label className="input-label mb-2 block">Service Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {SERVICE_TYPES.map((svc) => (
                    <button key={svc.id} type="button" onClick={() => setField('serviceType', svc.id)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${formData.serviceType === svc.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-surface-200 dark:border-surface-700 hover:border-brand-300'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${svc.color}`}>
                        <Zap className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold text-sm ${formData.serviceType === svc.id ? 'text-brand-700 dark:text-brand-300' : 'text-surface-800 dark:text-surface-200'}`}>{svc.id}</p>
                        <p className="text-xs text-surface-500 mt-0.5">{svc.desc}</p>
                      </div>
                      <span className="text-xs font-medium text-surface-400 flex-shrink-0">{svc.time}</span>
                      {formData.serviceType === svc.id && <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <FIELD_LABEL icon={Calendar}>Appointment Date</FIELD_LABEL>
                  <input type="date" name="appointmentDate" required value={formData.appointmentDate} onChange={handleChange} className="input-modern" />
                </div>
                <div>
                  <label className="input-label mb-2 block">Time Slot</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button key={slot} type="button" onClick={() => setField('timeSlot', slot)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium text-center transition-all border-2 ${formData.timeSlot === slot ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-300' : 'border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:border-brand-300'}`}
                      >
                        <Clock className="w-3.5 h-3.5 inline mr-1 opacity-60" />{slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <FIELD_LABEL icon={FileText}>Additional Notes (optional)</FIELD_LABEL>
                <textarea name="notes" rows={2} value={formData.notes} onChange={handleChange} className="input-modern resize-none" placeholder="Any specific issues or requests..." />
              </div>
            </motion.div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <h2 className="text-lg font-display font-bold text-surface-900 dark:text-white">Review & Confirm</h2>
              <div className="space-y-3">
                {[
                  { label: 'Name',       value: formData.customerName  },
                  { label: 'Contact',    value: formData.contactNumber },
                  { label: 'Vehicle',    value: `${formData.vehicleMake} ${formData.vehicleModel} (${formData.vehicleYear})` },
                  { label: 'Service',    value: formData.serviceType   },
                  { label: 'Date',       value: formData.appointmentDate },
                  { label: 'Time',       value: formData.timeSlot      },
                  ...(formData.notes ? [{ label: 'Notes', value: formData.notes }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-4 px-4 py-3 bg-surface-50 dark:bg-surface-800/50 rounded-xl">
                    <span className="text-xs font-semibold text-surface-400 uppercase tracking-wider w-20 flex-shrink-0 mt-0.5">{label}</span>
                    <span className="text-sm font-medium text-surface-800 dark:text-surface-200">{value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-200/60 dark:border-surface-700/40">
          <button
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className="btn-secondary disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(s => Math.min(4, s + 1))}
              disabled={
                (step === 1 && (!formData.customerName || !formData.contactNumber)) ||
                (step === 2 && (!formData.vehicleMake || !formData.vehicleModel || !formData.vehicleYear)) ||
                (step === 3 && (!formData.serviceType || !formData.appointmentDate || !formData.timeSlot))
              }
              className="btn-primary disabled:opacity-40"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="btn-primary">
              {loading ? (
                <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> Confirming...</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Confirm Booking</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;
