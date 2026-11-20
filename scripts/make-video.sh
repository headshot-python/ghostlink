#!/usr/bin/env bash
# Ghostlink demo video — assembles demo/shots/*.png into a <3 min captioned
# video (1280x720, H.264 + silent AAC) for the YouTube demo-video requirement.
# Usage: bash scripts/make-video.sh   (run after scripts/shots.js)
set -euo pipefail
cd "$(dirname "$0")/.."

SHOTS=demo/shots
OUT=demo/ghostlink-demo.mp4
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf
[ -f "$FONT" ] || FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
[ -f "$FONT" ] || { echo "no DejaVu font found at $FONT"; exit 1; }

# shot file, duration (s), caption
SEGMENTS=(
  "01-home.png|12|Every year, millions of links die."
  "02-resurrected.png|20|geocities.com, dead since 2009 - resurrected."
  "03-viewer.png|15|The archived page, alive again."
  "04-batch.png|18|Check 50 dead links at once."
  "05-graveyard.png|12|Your graveyard - stored only in your browser."
  "06-mobile.png|12|Works on your phone, too. Free, no account."
)

mkdir -p demo/segments
i=0
for spec in "${SEGMENTS[@]}"; do
  img="${spec%%|*}"; rest="${spec#*|}"
  dur="${rest%%|*}"; caption="${rest#*|}"
  [ -f "$SHOTS/$img" ] || { echo "missing shot: $SHOTS/$img — run scripts/shots.js first"; exit 1; }
  frames=$((dur * 30))
  # escape caption for drawtext
  esc=$(printf '%s' "$caption" | sed "s/'/\\\\'/g; s/:/\\\\:/g")
  ffmpeg -y -v error -loop 1 -i "$SHOTS/$img" -f lavfi -i anullsrc=r=44100:cl=stereo \
    -filter_complex \
    "[0:v]scale=2560:-2,zoompan=z='min(zoom+0.0006,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1280x720:fps=30,drawtext=fontfile=${FONT}:text='${esc}':fontcolor=white:fontsize=30:box=1:boxcolor=black@0.6:boxborderw=12:x=(w-text_w)/2:y=h-90[v]" \
    -map "[v]" -map 1:a -t "$dur" -c:v libx264 -pix_fmt yuv420p -r 30 -c:a aac -shortest \
    "demo/segments/seg${i}.mp4"
  i=$((i + 1))
done

# Concatenate segments
printf "" > demo/segments/list.txt
for j in $(seq 0 $((i - 1))); do echo "file 'seg${j}.mp4'" >> demo/segments/list.txt; done
ffmpeg -y -v error -f concat -safe 0 -i demo/segments/list.txt -c copy "$OUT"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")
echo "built $OUT (${dur}s)"
ls -la "$OUT"
