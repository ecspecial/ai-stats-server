import { NextRequest, NextResponse } from "next/server";
import { connectMongoDB } from "@/app/lib/mongodb/mongodb";
import Image from "@/app/lib/mongodb/models/image";

export async function POST(req: NextRequest, res: NextResponse) {
  try {
    await connectMongoDB();
    const { page = 1, promptSearch = "" } = await req.json();
    const pageSize = 100;
    const skip = (page - 1) * pageSize;

    const query: any = {
      type_gen: 'txt2img',
      facelock_type: 'None',
      shared_gallery: false,
      // user_shared_settings: true,
    };

    if (promptSearch) {
      query.prompt = { $regex: promptSearch, $options: "i" };
    }

    const images = await Image.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize);
    const totalImages = await Image.countDocuments(query);

    return NextResponse.json({ images, totalImages });
  } catch (error) {
    return NextResponse.json({ message: "Error fetching images", error }, { status: 500 });
  }
}