import mongoose from 'mongoose';
const IssueSchema = new mongoose.Schema({
    issueId: { type: Number, required: true, unique: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    body: String,
    state: { type: String, enum: ['open', 'closed'], required: true },
    labels: [{ type: String }],
    owner: { type: String, required: true },
    repoName: { type: String, required: true },
    author: { type: String, required: true },
    htmlUrl: { type: String, required: true },
    githubCreatedAt: { type: Date, required: true },
    githubUpdatedAt: { type: Date, required: true }
}, { timestamps: true });
export const IssueModel = mongoose.models.Issue || mongoose.model('Issue', IssueSchema);
