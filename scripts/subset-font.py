"""Regenerate the app's local Pretendard subset: pip install 'fonttools[woff]'."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / 'src/assets/fonts'
source = FONTS / 'PretendardVariable.woff2'
with TTFont(source, recalcTimestamp=False) as original:
    available = set(original.getBestCmap())
characters = set(range(0x20, 0x100))
for path in (ROOT / 'src').rglob('*'):
    if path.suffix in {'.ts', '.tsx'}:
        characters.update(map(ord, path.read_text()))
core = characters & available

# Policy text is downloaded with the app, but its extra font glyphs are only
# needed when a legal dialog opens. Keep them out of the critical-path subset.
legal_characters = set()
for path in (ROOT / 'src/data/legal').glob('*.md'):
    legal_characters.update(map(ord, path.read_text()))
legal = (legal_characters & available) - core

def save_subset(filename, codes):
    font = TTFont(source, recalcTimestamp=False)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=codes)
    subsetter.subset(font)
    # The subset has its own name; the typeface remains Pretendard.
    for record in font['name'].names:
        if record.nameID in {1, 4, 6, 16}:
            record.string = ('CapsuleUI' if record.nameID == 6 else 'Capsule UI').encode(record.getEncoding())
    font.save(FONTS / filename)
    font.close()

save_subset('capsule-ui.woff2', core)
save_subset('capsule-legal.woff2', legal)

def ranges(codes):
    groups = []
    start = end = None
    for code in sorted(codes):
        if start is None:
            start = end = code
        elif code == end + 1:
            end = code
        else:
            groups.append(f'U+{start:X}' if start == end else f'U+{start:X}-{end:X}')
            start = end = code
    if start is not None:
        groups.append(f'U+{start:X}' if start == end else f'U+{start:X}-{end:X}')
    return ','.join(groups)

faces = []
for filename, codes in [('capsule-ui.woff2', core), ('capsule-legal.woff2', legal), ('PretendardVariable.woff2', available - core - legal)]:
    faces.append('@font-face {\n  font-family: "Capsule UI";\n  font-style: normal;\n'
                 '  font-weight: 45 920;\n  font-display: swap;\n'
                 f'  src: url("./assets/fonts/{filename}") format("woff2");\n'
                 f'  unicode-range: {ranges(codes)};\n}}\n')
(ROOT / 'src/font.css').write_text('\n'.join(faces))
print(f'{len(core)} UI codepoints; {len(legal)} legal codepoints; {len(available - core - legal)} fallback codepoints')
print(f'Initial subset: {(FONTS / "capsule-ui.woff2").stat().st_size:,} B')
print(f'Legal subset: {(FONTS / "capsule-legal.woff2").stat().st_size:,} B (on demand)')
