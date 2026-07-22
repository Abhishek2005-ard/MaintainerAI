import mongoose from 'mongoose';
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    githubId: Number,
    githubUsername: String,
    githubAccessToken: String,
    role: { type: String, default: 'maintainer' },
    createdAt: { type: Date, default: Date.now }
});
export const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
