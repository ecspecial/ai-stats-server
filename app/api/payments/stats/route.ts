import { NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Payment from '@/app/lib/mongodb/models/payment';

export async function GET() {
  try {
    await connectMongoDB();

    // 1. Number of payments documents in the collection
    const totalPayments = await Payment.countDocuments();

    // 2. Number of payments by each state
    const paymentsByState = await Payment.aggregate([
      {
        $group: {
          _id: '$state',
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Number of completed payments by category (paymentMethod)
    const completedPaymentsByMethod = await Payment.aggregate([
      {
        $match: { state: { $in: ['COMPLETED', 'completed'] } },
      },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Sum of payments (amount) where state is 'COMPLETED' or 'completed'
    const totalCompletedPaymentsAmountResult = await Payment.aggregate([
      {
        $match: { state: { $in: ['COMPLETED', 'completed'] } },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
        },
      },
    ]);

    const totalCompletedPaymentsAmount =
      totalCompletedPaymentsAmountResult.length > 0
        ? totalCompletedPaymentsAmountResult[0].totalAmount
        : 0;

    // Prepare the response data
    const responseData = {
      totalPayments,
      paymentsByState,
      completedPaymentsByMethod,
      totalCompletedPaymentsAmount,
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching payments data:', error);
    return NextResponse.json(
      { message: 'Error fetching payments data', error: error.message },
      { status: 500 }
    );
  }
}