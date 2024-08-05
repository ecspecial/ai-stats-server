import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import User from '@/app/lib/mongodb/models/user';
import Image from '@/app/lib/mongodb/models/image';
import { ObjectId } from 'mongodb';

interface ImageTimeData {
    timeGeneratedAt: Date;
    timeGeneration: number;
    subscriptionType: string;
}

interface DateData {
    date: string;
    dayImageCount: number;
    imageTimeData: ImageTimeData[];
}

interface SubscriptionData {
    date: string;
    imageCount: number;
    totalTime: number;
}

type SubscriptionMap = {
    [key: string]: Map<string, SubscriptionData>;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        await connectMongoDB();

        // Get the total count of images
        const totalImages = await Image.countDocuments();

        // Get the date range for the last 30 days
        const endDate = new Date();
        endDate.setUTCHours(23, 59, 59, 999);
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 30);
        startDate.setUTCHours(0, 0, 0, 0);

        // Fetch images within the date range
        const images = await Image.find({ createdAt: { $gte: startDate, $lte: endDate } }).sort({ createdAt: 1 }).exec();

        // Create a map to hold the data by date
        const dateMap = new Map<string, DateData>();
        const subscriptionMap: SubscriptionMap = {
            Free: new Map(),
            Pro: new Map(),
            Max: new Map()
        };

        for (const image of images) {
            const date = image.createdAt.toISOString().split('T')[0];

            if (!dateMap.has(date)) {
                dateMap.set(date, {
                    date: date,
                    dayImageCount: 0,
                    imageTimeData: []
                });
            }

            let user;
            try {
                user = await User.findById(image.userId);
            } catch (error) {
                console.error(`Error fetching user with ID ${image.userId}:`, error);
                continue; // Skip this image if the user is not found
            }

            if (!user) {
                console.warn(`User with ID ${image.userId} not found, deleting image ID ${image._id}`);
                try {
                    await Image.findByIdAndDelete(image._id);
                } catch (deleteError) {
                    console.error(`Error deleting image with ID ${image._id}:`, deleteError);
                }
                continue; // Skip this image if the user is null
            }

            const timeGeneration = (image.updatedAt.getTime() - image.createdAt.getTime()) / 1000; // Convert to seconds

            // Update dateMap with total time and count
            const dateData = dateMap.get(date)!;
            dateData.dayImageCount += 1;
            dateData.imageTimeData.push({
                timeGeneratedAt: image.createdAt,
                timeGeneration: timeGeneration,
                subscriptionType: user.subscription
            });

            // Initialize subscriptionMap data
            if (!subscriptionMap[user.subscription].has(date)) {
                subscriptionMap[user.subscription].set(date, {
                    date: date,
                    imageCount: 0,
                    totalTime: 0
                });
            }

            // Update subscriptionMap with image count and time
            const subMapData = subscriptionMap[user.subscription].get(date)!;
            subMapData.imageCount += 1;
            subMapData.totalTime += timeGeneration;
        }

        // Convert the map to an array and sort it by date
        const imageGenerationData = Array.from(dateMap.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(dayData => ({
                date: dayData.date,
                averageTime: dayData.dayImageCount > 0 ? (dayData.imageTimeData.reduce((sum, data) => sum + data.timeGeneration, 0) / dayData.dayImageCount).toFixed(2) : '0',
                dayImageCount: dayData.dayImageCount
            }));

        // Convert subscriptionMap to an array and sort it by date
        const subscriptionGenerationData = {
            Free: Array.from(subscriptionMap.Free.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(dayData => ({
                    date: dayData.date,
                    averageTime: dayData.imageCount > 0 ? (dayData.totalTime / dayData.imageCount).toFixed(2) : '0',
                    imageCount: dayData.imageCount
                })),
            Pro: Array.from(subscriptionMap.Pro.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(dayData => ({
                    date: dayData.date,
                    averageTime: dayData.imageCount > 0 ? (dayData.totalTime / dayData.imageCount).toFixed(2) : '0',
                    imageCount: dayData.imageCount
                })),
            Max: Array.from(subscriptionMap.Max.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map(dayData => ({
                    date: dayData.date,
                    averageTime: dayData.imageCount > 0 ? (dayData.totalTime / dayData.imageCount).toFixed(2) : '0',
                    imageCount: dayData.imageCount
                }))
        };

        // Prepare overall time generation data
        const overallTimeGenerationData = Array.from(dateMap.values()).map(dayData => ({
            date: dayData.date,
            totalTime: dayData.dayImageCount > 0 ? (dayData.imageTimeData.reduce((sum, data) => sum + data.timeGeneration, 0) / dayData.dayImageCount).toFixed(2) : '0'
        }));

        // Return the result
        return NextResponse.json({
            totalImages: totalImages,
            imageGenerationData: imageGenerationData,
            subscriptionGenerationData: subscriptionGenerationData,
            overallTimeGenerationData: overallTimeGenerationData
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