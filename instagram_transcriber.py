import os
import sys
import webbrowser
from threading import Timer

# Set up automatic browser opening
def open_browser():
    webbrowser.open("http://localhost:7860")

# Check imports before setting up
missing_deps = []
try:
    import yt_dlp
except ImportError:
    missing_deps.append("yt-dlp")
try:
    import whisper
except ImportError:
    missing_deps.append("openai-whisper")
try:
    import gradio as gr
except ImportError:
    print("Error: Gradio is not installed. Please run: pip install gradio")
    sys.exit(1)

# Main transcription function
def transcribe_instagram(url, model_name, language):
    if missing_deps:
        return (
            f"❌ Missing Dependencies: {', '.join(missing_deps)}\n\n"
            f"Please run the following command in your terminal to install them:\n"
            f"pip install {' '.join(missing_deps)}\n\n"
            f"Note: You may also need to install ffmpeg on your system (e.g. winget install ffmpeg)."
        )
    
    try:
        if not url or not url.strip():
            return "Please enter a valid Instagram URL."
        
        url_stripped = url.strip()
        # Create temp download folder inside workspace
        script_dir = os.path.dirname(os.path.abspath(__file__))
        temp_dir = os.path.join(script_dir, "backend", "data", "temp_downloads")
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
        
        print(f"Downloading audio from Instagram URL: {url_stripped}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url_stripped, download=True)
            video_id = info.get('id')
            audio_path = os.path.join(temp_dir, f"{video_id}.mp3")
            
        if not os.path.exists(audio_path):
            return "Error: Downloaded audio file not found. Please ensure the post is public and active."
            
        print(f"Loading Whisper model '{model_name}' (this might take a minute on first run)...")
        model = whisper.load_model(model_name)
        
        print("Transcribing audio...")
        transcribe_opts = {}
        if language and language != "Auto-detect":
            # Map standard display names to Whisper language codes
            lang_mapping = {
                "English": "en", "Spanish": "es", "French": "fr", "German": "de", 
                "Hindi": "hi", "Portuguese": "pt", "Italian": "it", "Japanese": "ja", 
                "Korean": "ko", "Arabic": "ar", "Chinese": "zh", "Russian": "ru",
                "Tamil": "ta", "Telugu": "te", "Kannada": "kn", "Marathi": "mr",
                "Bengali": "bn", "Gujarati": "gu"
            }
            lang_code = lang_mapping.get(language)
            if lang_code:
                transcribe_opts['language'] = lang_code
            
        result = model.transcribe(audio_path, **transcribe_opts)
        transcript = result.get("text", "").strip()
        
        # Cleanup
        try:
            os.remove(audio_path)
        except Exception:
            pass
            
        return transcript
        
    except Exception as e:
        return f"Error: {str(e)}\n\n(Tip: Ensure ffmpeg is installed and added to your system PATH. For private videos you follow, see the troubleshooting section.)"

# Setup Gradio GUI
def build_ui():
    custom_css = """
    .container { max-width: 900px; margin: auto; padding-top: 2rem; }
    .header-box { text-align: center; margin-bottom: 2rem; }
    """
    
    with gr.Blocks(css=custom_css, title="Instagram Transcript Generator") as demo:
        with gr.Div(elem_classes="container"):
            gr.Markdown(
                """
                # 🎥 Instagram Transcript Generator
                ### 100% Free · No API Keys · No Token Limits · Runs Locally on Your Machine
                """
            )
            
            if missing_deps:
                gr.Markdown(
                    f"⚠️ **Warning**: Missing libraries: `{', '.join(missing_deps)}`. "
                    f"Please install them via: `pip install {' '.join(missing_deps)}` and make sure `ffmpeg` is installed on your system."
                )
            
            with gr.Row():
                with gr.Column(scale=1):
                    url_input = gr.Textbox(
                        label="Instagram Post / Reel / IGTV URL",
                        placeholder="https://www.instagram.com/reel/C8..."
                    )
                    model_dropdown = gr.Dropdown(
                        choices=["tiny", "base", "small", "medium", "large"],
                        value="small",
                        label="Whisper Model (small is recommended)"
                    )
                    lang_dropdown = gr.Dropdown(
                        choices=["Auto-detect", "English", "Hindi", "Spanish", "French", "German", "Portuguese", "Italian", "Japanese", "Korean", "Arabic", "Chinese", "Tamil", "Telugu", "Kannada", "Marathi", "Bengali", "Gujarati"],
                        value="Auto-detect",
                        label="Speech Language"
                    )
                    submit_btn = gr.Button("🚀 Generate Transcript", variant="primary")
                    
                with gr.Column(scale=1):
                    output_box = gr.Textbox(
                        label="Transcript Output",
                        placeholder="Your transcript text will display here...",
                        lines=15,
                        show_copy_button=True
                    )
            
            with gr.Accordion("🛠️ Technical Details & Setup Guide", open=False):
                gr.Markdown(
                    """
                    ### 💻 Requirements Setup
                    Ensure the following are installed for local execution:
                    
                    1. **Python**: Version 3.9+ from [python.org](https://python.org).
                    2. **ffmpeg**: Must be installed and present in your system's environment variables/PATH.
                       - **Windows**: `winget install ffmpeg`
                       - **macOS**: `brew install ffmpeg`
                    3. **Python Libraries**:
                       `pip install yt-dlp openai-whisper gradio`
                    
                    ### 🔒 Private / Restricted Posts
                    If you follow a private account, public downloads will fail. You can authenticate yt-dlp with browser cookies:
                    - Run: `yt-dlp --cookies-from-browser chrome "URL"`
                    """
                )
                
            submit_btn.click(
                fn=transcribe_instagram,
                inputs=[url_input, model_dropdown, lang_dropdown],
                outputs=output_box
            )
            
    return demo

if __name__ == "__main__":
    demo = build_ui()
    Timer(1.5, open_browser).start()
    demo.launch(server_name="127.0.0.1", server_port=7860)
