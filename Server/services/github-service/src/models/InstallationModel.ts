import mongoose from 'mongoose';

const InstallationSchema = new mongoose.Schema({
  installationId: { type: Number, required: true, unique: true },
  accountName: { type: String, required: true },
  accountId: { type: Number, required: true },
  accountType: { type: String, required: true },
  avatarUrl: String,
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: { type: String, default: 'active' }
}, { timestamps: true });

export const InstallationModel = mongoose.models.Installation || mongoose.model('Installation', InstallationSchema);
