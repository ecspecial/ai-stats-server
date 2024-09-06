import { NextResponse } from "next/server";
import { connectMongoDB } from '@/app/lib/mongodb/mongodb';
import Image from '@/app/lib/mongodb/models/image'; // Assuming you have an image model

export async function GET() {
  try {
    // Connect to MongoDB
    await connectMongoDB();

    // Fetch all image prompts from the database
    const images = await Image.find({}, { prompt: 1 }); // Only select the 'prompt' field

    if (!images || images.length === 0) {
      return NextResponse.json({ message: "No images found" }, { status: 404 });
    }

    // Combine all prompts into one string
    const allPrompts = images.map(img => img.prompt).join(" ");

    // Tokenize the combined prompts string into words and filter out common stop words
    const words = allPrompts
      .toLowerCase()
      .match(/\b(\w+)\b/g) // Match all words using regex
      ?.filter(word => !commonStopWords.includes(word)); // Exclude common stop words

    // Count the frequency of each word
    const wordFrequency: { [key: string]: number } = {};
    if (words) {
      words.forEach(word => {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      });
    }

    // Sort words by frequency in descending order and get the top 50
    const topWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 100)
      .map(([word, count]) => ({ word, count }));

    return NextResponse.json({ topWords }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching top words:", error);
    return NextResponse.json(
      { message: "Error fetching top words", error: error.message },
      { status: 500 }
    );
  }
}

// A basic list of common stop words to exclude
const commonStopWords = [
  "the", "is", "in", "and", "of", "to", "a", "with", "on", "for", "as", "at",
  "by", "it", "an", "be", "this", "that", "from", "or", "which", "but", "not",
  "are", "was", "were", "has", "have", "had", "all", "their", "your", "more"
];