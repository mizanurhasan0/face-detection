import mongoose from 'mongoose';

const FaceSchema = new mongoose.Schema({
    descriptor: [Number],
    image: String,
    ip: String,
    device: String,
    location: Object,
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Face', FaceSchema);
