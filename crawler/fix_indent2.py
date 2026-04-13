with open("scrape_detail_to_db.py", "r") as f:
    lines = f.readlines()

for i in range(263, 275):
    if lines[i].strip():
        lines[i] = "    " + lines[i]

with open("scrape_detail_to_db.py", "w") as f:
    f.writelines(lines)
