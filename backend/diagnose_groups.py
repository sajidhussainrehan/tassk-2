"""
Diagnostic script: finds students whose `supervisor` value no longer matches
any current group name (i.e. orphaned after a group rename that didn't
cascade to student records).

Run this ON THE SERVER from the backend directory with the venv active:
    cd /home/ghiras/task3/backend
    source venv/bin/activate
    python diagnose_groups.py

It only reads data — it makes no changes.
"""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    groups = await db.groups.find({}, {"_id": 0, "name": 1}).to_list(1000)
    group_names = sorted(g["name"] for g in groups)

    print("=== Current groups ===")
    for name in group_names:
        print(f"  {name!r}")

    pipeline = [{"$group": {"_id": "$supervisor", "count": {"$sum": 1}}}]
    sup_counts = await db.students.aggregate(pipeline).to_list(1000)
    sup_counts.sort(key=lambda x: (x["_id"] is None, str(x["_id"])))

    print("\n=== Distinct student.supervisor values ===")
    group_name_set = set(group_names)
    orphans = []
    for s in sup_counts:
        value = s["_id"]
        count = s["count"]
        is_orphan = value is not None and value not in group_name_set
        marker = "  <-- ORPHAN (no matching group; likely a renamed group)" if is_orphan else ""
        print(f"  {value!r}: {count} student(s){marker}")
        if is_orphan:
            orphans.append((value, count))

    if orphans:
        print("\n=== Summary ===")
        print("These student.supervisor values don't match any current group name.")
        print("These students are 'invisible' in the dashboard right now:")
        for value, count in orphans:
            print(f"  - {count} student(s) still tagged with old group name {value!r}")
        print("\nTell me which current group each orphaned name used to be, e.g.:")
        print("  'فريق أ' (12 students) is now called 'فريق النخبة'")
        print("and I'll give you the exact fix command.")
    else:
        print("\nNo orphaned supervisor values found — every student's group matches a real group.")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
