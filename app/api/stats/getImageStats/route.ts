import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';
import Image from '@/app/lib/mongodb/models/image';
import { ObjectId } from 'mongodb';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        await connectMongoDB();

        // Get the total count of images
        const totalImages = await Image.countDocuments();

        // Get the date range for the last 7 days
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setUTCHours(0, 0, 0, 0);

        // Fetch images within the date range
        const images = await Image.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: 1 }).exec();

        // Create a map to hold the data by date
        const dateMap = new Map();

        for (const image of images) {
            const date = image.createdAt.toISOString().split('T')[0];

            if (!dateMap.has(date)) {
                dateMap.set(date, {
                    date: date,
                    dayImageCount: 0,
                    imageTimeData: []
                });
            }

            const user = await User.findById(image.userId);

            const timeGeneratedAt = image.createdAt;
            const timeGeneration = (image.updatedAt.getTime() - image.createdAt.getTime()) / 1000; // Convert to seconds

            dateMap.get(date).dayImageCount += 1;
            dateMap.get(date).imageTimeData.push({
                timeGeneratedAt: timeGeneratedAt,
                timeGeneration: timeGeneration,
                subscriptionType: user.subscription
            });
        }

        // Convert the map to an array and sort it by date
        const imageGenerationData = Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Return the result
        return NextResponse.json({
            totalImages: totalImages,
            imageGenerationData: imageGenerationData
        }, { status: 200 });
    } catch (error) {
        console.error('Error fetching image data:', error);

        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = (error as { message: string }).message;
        }

        return NextResponse.json({ message: 'Error fetching image data', error: errorMessage }, { status: 500 });
    }
}