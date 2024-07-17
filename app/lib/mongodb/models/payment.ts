import { Schema, model, models, Types } from "mongoose";

export interface PaymentDocument {
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: Types.ObjectId;
    paymentMethod: string;
    state: string;
    amount: number;
    currency: string;
    annual: boolean;
    firstTimeDeposit: boolean;
    paymentId?: string;
    subscriptionType?: string;
    endDate?: Date;
}

const PaymentSchema = new Schema<PaymentDocument>({
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paymentMethod: { type: String, required: true },
    state: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    annual: { type: Boolean, required: true },
    firstTimeDeposit: { type: Boolean, required: true, default: true },
    paymentId: { type: String, default: null },
    subscriptionType: { type: String, default: null },
    endDate: { type: Date, default: null },
}, {
    timestamps: true
});

const Payment = models.Payment || model('Payment', PaymentSchema);

export default Payment;