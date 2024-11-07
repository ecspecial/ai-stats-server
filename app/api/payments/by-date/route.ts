import { NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Payment from '@/app/lib/mongodb/models/payment';
import User from '@/app/lib/mongodb/models/user';
import { PaymentDocument } from "@/app/lib/mongodb/models/payment";

export async function POST(req: Request) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const { startDate, endDate, filterOption } = body;

    let payments: PaymentDocument[] = [];

    if (filterOption === 'Active') {
      // Get all users with subscription 'Free' or 'Pro'
      const users = await User.find({
        subscription: { $in: ['Free', 'Pro'] },
      }).select('subscriptionId');

      // Collect subscriptionIds
      const subscriptionIds = users
        .map(user => user.subscriptionId)
        .filter((id): id is string => !!id); // Filter out undefined

      if (subscriptionIds.length === 0) {
        // No subscriptionIds found
        return NextResponse.json({ payments: [] }, { status: 200 });
      }

      // Build query to find payments where payment._id in subscriptionIds
      const query: any = {
        _id: { $in: subscriptionIds },
      };

      // Apply date filters if provided
      if (startDate) {
        query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
      }
      if (endDate) {
        query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
      }

      payments = await Payment.find(query);

    } else {
      // 'All' filter: Fetch payments based on date filters
      const query: any = {};

      if (startDate) {
        query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
      }

      if (endDate) {
        query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
      }

      payments = await Payment.find(query);
    }

    return NextResponse.json({ payments }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching payments by date:', error);
    return NextResponse.json(
      { message: 'Error fetching payments by date', error: error.message },
      { status: 500 }
    );
  }
}