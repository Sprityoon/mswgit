import re, glob, os

for p in glob.glob(r"D:/메이플월도/RootDesk/MyDesk/MapObjects/Models/*.model"):
    t = open(p, encoding="utf-8").read()
    idxs = [m.start() for m in re.finditer("BoxSize", t)]
    print(os.path.basename(p), "BoxSize mentions", len(idxs))
    for i in idxs[:4]:
        chunk = t[i : i + 600]
        m = re.search(r'"x"\s*:\s*([0-9.eE+-]+)\s*,\s*"y"\s*:\s*([0-9.eE+-]+)', chunk)
        if m:
            print(" ", m.group(1), m.group(2))
        else:
            print("  FAIL chunk sample:", repr(chunk[100:250]))
