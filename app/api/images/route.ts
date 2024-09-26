import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Image from '@/app/lib/mongodb/models/image';

interface RequestBody {
    page?: number;
    promptSearch?: string;
}

export async function POST(req: NextRequest, res: NextResponse) {
    try {
        // Connect to MongoDB
        await connectMongoDB();

        // Extract the page and prompt search from the request body
        const { page = 1, promptSearch = '' }: RequestBody = await req.json();

        // Define how many images to return per page
        const pageSize = 100;
        const skip = (page - 1) * pageSize;

        // Build the query object with filters
        const query: any = {
            type_gen: 'txt2img',
            facelock_type: 'None'
        };

        // If prompt search is provided, add it to the query
        if (promptSearch) {
            query.prompt = { $regex: promptSearch, $options: 'i' };  // Case-insensitive search
        }

        // Fetch images with pagination, sorted by creation date
        const images = await Image.find(query)
            .sort({ createdAt: -1 })  // Sort by createdAt, descending
            .skip(skip)               // Skip the first `skip` results
            .limit(pageSize);         // Limit results to `pageSize`

        const totalImages = await Image.countDocuments(query);  // Count total images for pagination

        return NextResponse.json({
            message: 'Images fetched successfully',
            images: images,
            totalImages: totalImages
        }, { status: 200 });

    } catch (error: unknown) {
        console.error('Error fetching images:', error);

        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = (error as { message: string }).message;
        }

        return NextResponse.json({
            message: 'Error fetching images',
            error: errorMessage
        }, { status: 500 });
    }
}