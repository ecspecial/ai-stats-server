import { NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Payment from '@/app/lib/mongodb/models/payment';

export async function POST(request: Request) {
  try {
    await connectMongoDB();

    const body = await request.json();
    const { startDate, endDate, filterOption } = body;

    // Build query based on provided parameters
    const query: any = {};

    // Filter by date range if provided
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) };
    }
    if (endDate) {
      query.createdAt = { 
        ...(query.createdAt || {}),
        $lte: new Date(endDate),
      };
    }

    // Filter by state if the filterOption is "Active"
    if (filterOption === "Active") {
      query.state = { $in: ["COMPLETED", "completed"] };
    }

    // 1. Number of payments documents matching the query
    const totalPayments = await Payment.countDocuments(query);

    // 2. Number of payments by state
    const paymentsByState = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$state",
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Number of completed payments by category (paymentMethod)
    const completedPaymentsByMethod = await Payment.aggregate([
      {
        $match: {
          ...query,
          state: { $in: ["COMPLETED", "completed"] },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
        },
      },
    ]);

    // 4. Sum of payments (amount) where state is 'COMPLETED' or 'completed'
    const totalCompletedPaymentsAmountResult = await Payment.aggregate([
      {
        $match: {
          ...query,
          state: { $in: ["COMPLETED", "completed"] },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
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
    console.error("Error fetching payments data:", error);
    return NextResponse.json(
      { message: "Error fetching payments data", error: error.message },
      { status: 500 }
    );
  }
}