import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Image from '@/app/lib/mongodb/models/image';

export async function POST(req: NextRequest) {
  try {
    // Connect to the database
    await connectMongoDB();

    // Extract imageId from the request body
    const { imageId, imageCategory } = await req.json();

    // Find the image by its ID and update the 'shared_gallery' field to true
    const image = await Image.findById(imageId);
    if (!image) {
      return NextResponse.json({ message: 'Image not found' }, { status: 404 });
    }

    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      { category: imageCategory, shared_gallery: true },
      { new: true }
    );

    // image.shared_gallery = true; // Set the field to true
    // await image.save();

    if (!updatedImage) {
      return NextResponse.json({ message: "Failed to add image to shared gallery" }, { status: 404 });
    }

    return NextResponse.json({ message: 'Image added to shared gallery successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error adding image to shared gallery:', error);
    return NextResponse.json({ message: 'Failed to add image to shared gallery', error: error.message }, { status: 500 });
  }
}