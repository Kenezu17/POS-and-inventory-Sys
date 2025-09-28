import sounddevice as sd
from scipy.io.wavfile import write

def record_voice(filename="voice_sample.wav", duration=5, fs=44100):
    print("🎤 Recording voice... Please speak now.")
    audio = sd.rec(int(duration * fs), samplerate=fs, channels=1)
    sd.wait()
    write(filename, fs, audio)
    print(f"✅ Voice sample saved as {filename}")

# Run registration
record_voice("user1_voice.wav")
