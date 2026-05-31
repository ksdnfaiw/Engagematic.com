import os
import sys
import json
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

def download_audio(url):
    try:
        import yt_dlp
    except ImportError:
        return {"success": False, "error_code": "YT_DLP_MISSING", "error": "yt-dlp python package is not installed."}

    try:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        temp_dir = os.path.abspath(os.path.join(script_dir, "..", "data", "temp_downloads"))
        if not os.path.exists(temp_dir):
            os.makedirs(temp_dir, exist_ok=True)

        output_template = os.path.join(temp_dir, "%(id)s.%(ext)s")
        
        ydl_opts = {
            'format': 'bestaudio/best',
            'outtmpl': output_template,
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '128', # 128kbps is plenty for transcription and reduces file size
            }],
            'quiet': True,
            'no_warnings': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info.get('id')
            audio_path = os.path.join(temp_dir, f"{video_id}.mp3")

        if not os.path.exists(audio_path):
            return {"success": False, "error": "Audio extraction failed. Verify that the URL is a public Instagram post."}

        return {
            "success": True,
            "audio_path": audio_path,
            "duration": info.get("duration", 0),
            "title": info.get("title", "")
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "Instagram URL is required"}))
        sys.exit(1)
        
    url_arg = sys.argv[1]
    res = download_audio(url_arg)
    print(json.dumps(res))
