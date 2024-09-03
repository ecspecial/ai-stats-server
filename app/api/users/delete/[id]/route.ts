import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';
import Payment from "@/app/lib/mongodb/models/payment";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = params.id;

        if (!userId) {
            return new NextResponse(JSON.stringify({ message: 'User ID is required' }), { status: 400 });
        }

        await connectMongoDB();

        const user = await User.findById(userId);

        if (!user) {
            return new NextResponse(JSON.stringify({ message: 'User not found' }), { status: 404 });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        return new NextResponse(JSON.stringify({ message: 'User deleted successfully' }), { status: 200 });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        return new NextResponse(JSON.stringify({ message: 'Error deleting user', error: error.message }), { status: 500 });
    }
}