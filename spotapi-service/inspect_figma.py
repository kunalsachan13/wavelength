import re, json

with open(r'C:\Users\kunal\.gemini\antigravity-ide\brain\6815771e-cf2b-48b4-bc0c-67712e9ee431\.system_generated\steps\791\content.md', 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

print("File size:", len(text))
# Check if there are canvas/frame names
names = re.findall(r'"name":"([^"]+)"', text)
print("Found names count:", len(names))
if names:
    print("Sample names:", names[:25])

# Check for keywords like "Spotify", "Redesign", "Home", "Library", etc.
print("Matches for 'Home':", len(re.findall(r'Home', text, re.I)))
