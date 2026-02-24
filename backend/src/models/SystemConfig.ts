import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document {
    key: string;
    value: any;
}

const SystemConfigSchema: Schema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true }
});

const SystemConfig = mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);
export default SystemConfig;
