import { NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';

export async function GET() {
  try {
    await connectMongoDB();

    // Find users with subscriptions 'Free', 'Pro', or 'Max'
    const users = await User.find({
      subscription: { $in: ['Free', 'Pro', 'Max'] },
    }).select('email name subscription subscriptionEndDate');

    // Optionally, filter for active subscriptions (e.g., subscriptionEndDate in the future)
    const activeUsers = users.filter(user => !user.subscriptionEndDate || user.subscriptionEndDate >= new Date());

    return NextResponse.json({ activeUsers }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users with subscriptions:', error);
    return NextResponse.json(
      { message: 'Error fetching users with subscriptions', error: error.message },
      { status: 500 }
    );
  }
}