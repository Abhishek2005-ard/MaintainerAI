import mongoose, { Schema } from 'mongoose';

// ─── Schema ──────────────────────────────────────────────────────────────────

const ReportSchema = new Schema(
  {
    issue: {
      issueId:  { type: String, required: true },
      number:   { type: Number, required: true },
      title:    { type: String, required: true },
      body:     { type: String, default: '' },
      author:   { type: String, required: true },
      owner:    { type: String, required: true },
      repoName: { type: String, required: true },
    },

    isDuplicate:       { type: Boolean, default: false },
    duplicateOfNumber: { type: Number,  default: null },

    analysis: {
      category:    { type: String,  default: null },
      priority:    { type: String,  default: null },
      burnoutRisk: { type: Boolean, default: false },
      reasoning:   { type: String,  default: null },
    },

    predictedLabels:   [{ type: String }],
    predictedPriority: { type: String, default: 'low' },
    executionLogs:     [{ type: String }],
    triageCompletedAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// ─── Model ───────────────────────────────────────────────────────────────────

// Guard against model re-registration in watch/hot-reload environments.
export const ReportModel =
  mongoose.models.Report || mongoose.model('Report', ReportSchema);
