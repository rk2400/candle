import mongoose, { Schema, Document, Model } from 'mongoose';

export type EmailTemplateType = 'ORDER_CREATED' | 'ORDER_PACKED' | 'ORDER_SHIPPED' | 'ORDER_DELIVERED';

export interface IEmailTemplate extends Document {
  type: EmailTemplateType;
  subject: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmailTemplateSchema: Schema = new Schema(
  {
    type: {
      type: String,
      enum: ['ORDER_CREATED', 'ORDER_PACKED', 'ORDER_SHIPPED', 'ORDER_DELIVERED'],
      required: true,
      unique: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmailTemplate: Model<IEmailTemplate> =
  mongoose.models.EmailTemplate || mongoose.model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplate;


