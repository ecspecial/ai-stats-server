// import { NextResponse } from "next/server";
// import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
// import User from '@/app/lib/mongodb/models/user';

// export async function GET() {
//     try {
//         await connectMongoDB();
//         const users = await User.find({});

//         return NextResponse.json(users, { status: 200 });
//     } catch (error: any) {
//         console.error('Error fetching users:', error);
//         return NextResponse.json({ message: 'Error fetching users', error: error.message }, { status: 500 });
//     }
// }

import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';

export async function POST(req: NextRequest) {
    try {
        await connectMongoDB();
        
        const body = await req.json();

        const { searchEmail, searchId, searchName, subscriptionFilter, activeFilter, sortOption, page = 1, limit = 100 } = body;

        const query: any = {};

        // Apply filters based on query parameters
        if (searchEmail) query.email = { $regex: searchEmail, $options: 'i' };
        if (searchId) query._id = searchId;
        if (searchName) query.name = { $regex: searchName, $options: 'i' };
        if (subscriptionFilter && subscriptionFilter !== 'All') query.subscription = subscriptionFilter;
        if (activeFilter === 'Active') query.subscriptionEndDate = { $gte: new Date() };
        if (activeFilter === 'Overall') query.subscriptionEndDate = { $exists: true };

        // Sort options
        const sort: any = {};
        if (sortOption === 'createdAt') {
            sort.createdAt = -1;
        } else if (sortOption === 'updatedAt') {
            sort.updatedAt = -1;
        } else if (sortOption === 'subscriptionEndDate') {
            sort.subscriptionEndDate = -1;
        }

        // Pagination
        const skip = (Number(page) - 1) * Number(limit);
        const users = await User.find(query).sort(sort).skip(skip).limit(Number(limit));
        const totalUsers = await User.countDocuments(query);

        return NextResponse.json({ users, totalUsers }, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Error fetching users', error: error.message }, { status: 500 });
    }
}