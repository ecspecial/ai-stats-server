import { NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';

export async function GET() {
    try {
        await connectMongoDB();
        const users = await User.find({});

        return NextResponse.json(users, { status: 200 });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ message: 'Error fetching users', error: error.message }, { status: 500 });
    }
}