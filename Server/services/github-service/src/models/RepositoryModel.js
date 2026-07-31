import mongoose from 'mongoose';

const RepositorySchema = new mongoose.Schema({
  installationId: { type: Number, required: true },
  repoId: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  fullName: { type: String, required: true },
  owner: { type: String, required: true },
  private: { type: Boolean, default: false },
  htmlUrl: { type: String, required: true },
  description: String,
  isActive: { type: Boolean, default: true },
  triageRulesActive: { type: Boolean, default: false },
  // Per-repository AI triage customization configured by the maintainer
  triageRules: {
    customLabels:       { type: [String], default: [] },
    customPriorities:   { type: [String], default: [] },
    customPromptHints:  { type: String,   default: '' },
  },
}, { timestamps: true });

export const RepositoryModel = mongoose.models.Repository || mongoose.model('Repository', RepositorySchema);
