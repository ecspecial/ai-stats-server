import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/app/lib/mongodb/mongodb";
import Image from "@/app/lib/mongodb/models/image";

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();

    const { imageId, likes, category } = await req.json();

    const updatedImage = await Image.findByIdAndUpdate(
      imageId,
      { gallery_image_likes: likes, category },
      { new: true }
    );

    if (!updatedImage) {
      return NextResponse.json({ message: "Image not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Image updated successfully" }, { status: 200 });
  } catch (error: unknown) {
    console.error("Error updating image:", error);
    return NextResponse.json({ message: "Error updating image" }, { status: 500 });
  }
}