import json, os

data = {}
filepath = r"D:\AIProjects\physics-lab\apps\desktop\src\renderer\locales\zh-CN.json"

# Read existing good Chinese chars from en-US (we'll map them)
with open(r"D:\AIProjects\physics-lab\apps\desktop\src\renderer\locales\en-US.json", "r", encoding="utf-8") as f:
    en = json.load(f)

# Check what Chinese is still good in current zh-CN
with open(filepath, "r", encoding="utf-8") as f:
    raw = f.read()
    old = json.loads(raw)

# Find keys where Chinese still works (no ? clusters)
good_keys = []
for k, v in old.items():
    if isinstance(v, str) and v.count("?") <= 2:
        good_keys.append(k)
        
print(f"Keys with intact Chinese: {len(good_keys)}/{len(old)}")
for k in sorted(good_keys)[:20]:
    print(f"  {k}: {old[k]}")
