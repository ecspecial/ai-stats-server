import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Image from '@/app/lib/mongodb/models/image';

interface RequestBody {
  userId: string;
}

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Extract the user ID from the request body
    const { userId }: RequestBody = await req.json();

    // Check if the userId is provided
    if (!userId) {
      return NextResponse.json({
        message: 'User ID is required',
        error: 'User ID not provided'
      }, { status: 400 });
    }

    // Fetch all images from MongoDB for the given user
    const images = await Image.find({ userId })
      .sort({ createdAt: -1 });

    // Check if any images are found
    if (images.length === 0) {
      return NextResponse.json({
        message: 'No images found for the provided user ID',
        userId: userId
      }, { status: 404 });
    }

    // Return the list of images
    return NextResponse.json({
      message: 'Images found successfully',
      images: images
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