import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

interface YouTubeVideo {
  url: string;
  title: string;
  videoId: string;
}

const getYouTubeVideoId = (url: string): string | null => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { urls }: { urls: string[] } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "유효한 URL 배열이 필요합니다." },
        { status: 400 }
      );
    }

    const videos: YouTubeVideo[] = [];
    for (const url of urls) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        try {
          const response = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos`,
            {
              params: {
                id: videoId,
                key: process.env.YOUTUBE_API_KEY,
                part: "snippet",
              },
            }
          );
          const title =
            response.data.items[0]?.snippet?.title ||
            `YouTube URL ${videos.length + 1}`;
          videos.push({ url, title, videoId });
        } catch (error) {
          console.error(`Failed to fetch title for video ${videoId}:`, error);
          videos.push({
            url,
            title: `YouTube URL ${videos.length + 1}`,
            videoId,
          });
        }
      }
    }

    return NextResponse.json({ videos }, { status: 200 });
  } catch (error) {
    console.error("Error fetching YouTube titles:", error);
    return NextResponse.json(
      { error: "YouTube 타이틀을 가져오지 못했습니다." },
      { status: 500 }
    );
  }
}
