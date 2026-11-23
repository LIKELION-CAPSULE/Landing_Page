"""Build the OFL Capsule Story subset, without retaining the full source font.

Requires: pip install 'fonttools[woff]'
Usage: python scripts/subset-story-font.py [path/to/HahmletVariable.ttf]
Default source: sibling Front_Web's official Google Fonts Hahmlet variable font.
Approved current/future story accents: scripts/story-font-text.txt.
"""
from pathlib import Path
import sys
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / 'Front_Web/src/assets/brand/HahmletVariable.ttf'
text = (ROOT / 'scripts/story-font-text.txt').read_text().replace('\n', '')
font = TTFont(source, recalcTimestamp=False)
options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
options.name_IDs = ['*']  # retain copyright, OFL license and attribution
options.name_legacy = True
options.name_languages = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
# OFL: a modified subset has its own family/unique/PostScript/variation names.
# Preserve license/copyright fields and the original authors' attribution.
for record in font['name'].names:
    if record.nameID not in {0, 7, 8, 9, 10, 11, 12, 13, 14}:
        family = 'CapsuleStory' if record.nameID in {6, 25} or record.nameID >= 256 else 'Capsule Story'
        name = record.toUnicode().replace('Hahmlet', family).replace('함렡', family)
        if record.nameID in {1, 16}:
            name = 'Capsule Story'
        record.string = name.encode(record.getEncoding())
font.flavor = 'woff2'
output = ROOT / 'src/assets/fonts/capsule-story.woff2'
font.save(output)
font.close()
size = output.stat().st_size
if size > 50_000:
    raise SystemExit(f'Subset exceeds 50KB: {size:,} B')
print(f'{output.name}: {size:,} B; {len(set(text))} characters; family Capsule Story; SIL OFL 1.1')
