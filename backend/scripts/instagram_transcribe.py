import os
import sys
import json
import argparse
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

def print_status(status_msg):
    # Print status message clearly prefixed so Node.js can read it in real-time
    print(f"[STATUS] {status_msg}", flush=True)

def run_transcription(url, model_name="small", language=None):
    try:
        # Check dependencies first
        print_status("Checking system dependencies...")
        try:
            import yt_dlp
        except ImportError:
            return {"success": False, "error_code": "YT_DLP_MISSING", "error": "yt-dlp package is not installed."}
            
        try:
            import whisper
        except ImportError:
            return {"success": False, "error_code": "WHISPER_MISSING", "error": "openai-whisper package is not installed."}

        # Check ffmpeg availability
        import shutil
        if not shutil.which("ffmpeg"):
            return {"success": False, "error_code": "FFMPEG_MISSING", "error": "ffmpeg was not found in the system PATH."}

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
                'preferredquality': '192',
            }],
            'quiet': True,
            'no_warnings': True,
        }

        print_status("Downloading video audio track via yt-dlp...")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            video_id = info.get('id')
            audio_path = os.path.join(temp_dir, f"{video_id}.mp3")

        if not os.path.exists(audio_path):
            return {"success": False, "error_code": "DOWNLOAD_FAILED", "error": "Audio extraction failed. Verify that the URL is a public Instagram post."}

        print_status(f"Loading local OpenAI Whisper model '{model_name}' (this may take a few minutes on first load)...")
        model = whisper.load_model(model_name)

        print_status("Transcribing speech to text...")
        transcribe_opts = {}
        if language and language != "auto":
            transcribe_opts['language'] = language

        result = model.transcribe(audio_path, **transcribe_opts)
        
        # Clean up downloaded file
        try:
            os.remove(audio_path)
        except Exception:
            pass

        return {
            "success": True,
            "transcript": result.get("text", "").strip(),
            "language": result.get("language", ""),
            "duration": info.get("duration", 0),
            "title": info.get("title", "")
        }

    except Exception as e:
        return {
            "success": False,
            "error_code": "TRANSCRIPTION_FAILED",
            "error": str(e)
        }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Instagram Transcribe CLI")
    parser.add_argument("url", help="Instagram URL")
    parser.add_argument("--model", default="small", help="Whisper model name")
    parser.add_argument("--language", default=None, help="Spoken language")

    args = parser.parse_args()
    
    # Run transcription
    res = run_transcription(args.url, args.model, args.language)
    
    # Print the JSON result at the very end
    print(f"[RESULT] {json.dumps(res)}", flush=True)
