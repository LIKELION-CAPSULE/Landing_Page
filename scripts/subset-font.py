"""Regenerate the app's local Pretendard subset: pip install 'fonttools[woff]'."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / 'src/assets/fonts'
source = FONTS / 'PretendardVariable.woff2'
font = TTFont(source, recalcTimestamp=False)
available = set(font.getBestCmap())
characters = set(range(0x20, 0x100))
for path in (ROOT / 'src').rglob('*'):
    if path.suffix in {'.ts', '.tsx'}:
        characters.update(map(ord, path.read_text()))
core = characters & available

options = subset.Options()
options.flavor = 'woff2'
options.layout_features = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(unicodes=core)
subsetter.subset(font)
# The subset is distributed under its own name; the typeface remains Pretendard.
for record in font['name'].names:
    if record.nameID in {1, 4, 6, 16}:
        record.string = ('CapsuleUI' if record.nameID == 6 else 'Capsule UI').encode(record.getEncoding())
font.save(FONTS / 'capsule-ui.woff2')

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
for filename, codes in [('capsule-ui.woff2', core), ('PretendardVariable.woff2', available - core)]:
    faces.append('@font-face {\n  font-family: "Capsule UI";\n  font-style: normal;\n'
                 '  font-weight: 45 920;\n  font-display: swap;\n'
                 f'  src: url("./assets/fonts/{filename}") format("woff2");\n'
                 f'  unicode-range: {ranges(codes)};\n}}\n')
(ROOT / 'src/font.css').write_text('\n'.join(faces))
print(f'{len(core)} glyph codepoints; {len(available - core)} additional codepoints load on demand')
print(f'Initial subset: {(FONTS / "capsule-ui.woff2").stat().st_size:,} B')
