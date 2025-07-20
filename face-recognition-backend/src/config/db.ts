import mongoose from 'mongoose';

export default () =>
    mongoose
        .connect(process.env.MONGO_URI as string)
        .then(() => console.log('✅ MongoDB connected'))
        .catch((err) => console.error('❌ DB Error:', err));
