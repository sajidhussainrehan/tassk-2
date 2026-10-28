from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Query, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
import base64
import io
from pathlib import Path
from PIL import Image
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from pymongo.errors import DuplicateKeyError
import re
import uuid
from datetime import datetime, timezone, date, timedelta

# Riyadh timezone (UTC+3) - ensures date matching works correctly for Saudi Arabia
RIYADH_TZ = timezone(timedelta(hours=3))

def get_today_riyadh():
    """Get today's date in Riyadh timezone"""
    return datetime.now(RIYADH_TZ).date().isoformat()

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME")]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== Images ====================
# Images live in their own `images` collection and are served by URL
# (/api/images/{id}). They must NOT be embedded as base64 in student/team
# documents: list endpoints would then ship every photo inline on every request.

MAX_IMAGE_DIMENSION = 800
IMAGE_JPEG_QUALITY = 78
IMAGE_URL_PREFIX = "/api/images/"

def _compress_image(raw: bytes, fallback_type: Optional[str]):
    try:
        img = Image.open(io.BytesIO(raw))
        img = img.convert("RGB")
        img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=IMAGE_JPEG_QUALITY, optimize=True)
        return buffer.getvalue(), "image/jpeg"
    except Exception:
        # Not a decodable image - keep the original bytes
        return raw, fallback_type or "application/octet-stream"

async def store_image(raw: bytes, content_type: Optional[str]) -> str:
    """Compress and save an image, returning its URL path."""
    data, ctype = await asyncio.to_thread(_compress_image, raw, content_type)
    image_id = str(uuid.uuid4())
    await db.images.insert_one({
        "id": image_id,
        "data": data,
        "content_type": ctype,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return f"{IMAGE_URL_PREFIX}{image_id}"

async def delete_image_if_unused(url: Optional[str]):
    """Delete a stored image once nothing references its URL any more."""
    if not url or not url.startswith(IMAGE_URL_PREFIX):
        return
    for collection, field in (("students", "image_url"), ("league_star", "image_url"), ("teams", "group_photo")):
        if await db[collection].find_one({field: url}, {"_id": 1}):
            return
    await db.images.delete_one({"id": url[len(IMAGE_URL_PREFIX):]})

def _decode_data_uri(data_uri: str):
    header, b64data = data_uri.split(",", 1)
    content_type = header[len("data:"):].split(";")[0] or None
    return base64.b64decode(b64data), content_type

async def migrate_inline_images(collection_name: str, field: str):
    """One-time move of base64 data URIs out of documents into the images collection."""
    collection = db[collection_name]
    docs = await collection.find({field: {"$regex": "^data:"}}, {"_id": 1}).to_list(None)
    for doc in docs:
        full = await collection.find_one({"_id": doc["_id"]}, {field: 1})
        value = (full or {}).get(field)
        if not isinstance(value, str) or not value.startswith("data:"):
            continue
        try:
            raw, content_type = _decode_data_uri(value)
        except Exception:
            logging.warning("Skipping undecodable image in %s %s", collection_name, doc["_id"])
            continue
        url = await store_image(raw, content_type)
        await collection.update_one({"_id": doc["_id"]}, {"$set": {field: url}})
    if docs:
        logging.info("Migrated %d inline image(s) in %s.%s", len(docs), collection_name, field)

async def migrate_all_inline_images():
    try:
        await migrate_inline_images("students", "image_url")
        await migrate_inline_images("league_star", "image_url")
        await migrate_inline_images("teams", "group_photo")
    except Exception:
        logging.exception("Inline image migration failed")

@api_router.get("/images/{image_id}")
async def get_image(image_id: str):
    image = await db.images.find_one({"id": image_id}, {"_id": 0, "data": 1, "content_type": 1})
    if not image:
        raise HTTPException(status_code=404, detail="غير موجود")
    # Each upload gets a new id, so the URL content never changes and can be cached forever
    return Response(
        content=image["data"],
        media_type=image.get("content_type") or "image/jpeg",
        headers={"Cache-Control": "public, max-age=31536000, immutable"}
    )

# ⭐ هذا المسار مهم ليبقى السيرفر مستيقظ
@app.get("/")
async def home():
    return {"status": "running", "service": "Ghiras Club API"}

# ==================== Authentication ====================

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str

class ViewOnlyLoginRequest(BaseModel):
    password: str

class TeacherLoginRequest(BaseModel):
    username: str
    password: str

class Teacher(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    username: str
    password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TeacherCreate(BaseModel):
    name: str
    username: str
    password: str

class TeacherUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None

# Simple hardcoded credentials (can be moved to env vars)
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "ghiras123")
VIEWONLY_PASSWORD = os.environ.get("VIEWONLY_PASSWORD", "view123")

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        token = str(uuid.uuid4())
        return {"token": token, "username": data.username}
    raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")

@api_router.post("/auth/viewonly-login")
async def viewonly_login(data: ViewOnlyLoginRequest):
    if data.password == VIEWONLY_PASSWORD:
        token = str(uuid.uuid4())
        return {"token": token, "role": "viewonly"}
    raise HTTPException(status_code=401, detail="كلمة المرور غير صحيحة")

@api_router.post("/auth/teacher-login")
async def teacher_login(data: TeacherLoginRequest):
    """Authenticate teacher with username and password from database"""
    teacher = await db.teachers.find_one({"username": data.username, "password": data.password})
    if teacher:
        token = str(uuid.uuid4())
        return {
            "token": token, 
            "role": "teacher", 
            "teacher_id": teacher["id"], 
            "teacher_name": teacher["name"]
        }
    raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")

# ==================== Teachers CRUD Endpoints ====================

@api_router.get("/teachers", response_model=List[Teacher])
async def get_teachers():
    """Get all teachers from the teachers collection"""
    teachers = await db.teachers.find({}, {"_id": 0}).to_list(1000)
    for t in teachers:
        if isinstance(t.get("created_at"), str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
    return sorted(teachers, key=lambda x: x.get("name", ""))

@api_router.post("/teachers", response_model=Teacher)
async def create_teacher(data: TeacherCreate):
    """Create a new teacher with unique username"""
    # Check if username already exists
    existing = await db.teachers.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="اسم المستخدم موجود مسبقاً")
    
    teacher = Teacher(**data.model_dump())
    doc = teacher.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.teachers.insert_one(doc)
    return teacher

@api_router.put("/teachers/{teacher_id}", response_model=Teacher)
async def update_teacher(teacher_id: str, data: TeacherUpdate):
    """Update teacher data"""
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Check if new username already exists (if updating username)
    if "username" in update_data:
        existing = await db.teachers.find_one({
            "username": update_data["username"],
            "id": {"$ne": teacher_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="اسم المستخدم موجود مسبقاً")
    
    result = await db.teachers.update_one({"id": teacher_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="المعلم غير موجود")
    
    updated = await db.teachers.find_one({"id": teacher_id}, {"_id": 0})
    if isinstance(updated.get("created_at"), str):
        updated["created_at"] = datetime.fromisoformat(updated["created_at"])
    return updated

@api_router.delete("/teachers/{teacher_id}")
async def delete_teacher(teacher_id: str):
    """Delete a teacher"""
    result = await db.teachers.delete_one({"id": teacher_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="المعلم غير موجود")
    return {"deleted": True}

@api_router.get("/teachers/list")
async def get_teachers_list():
    """Get list of teacher names for dropdown"""
    teachers = await db.teachers.find({}, {"_id": 0, "name": 1, "id": 1}).to_list(1000)
    return [{"id": t.get("id", ""), "name": t.get("name", "Unknown")} for t in teachers]

# ==================== Pydantic Models ====================

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    points: int = 0
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    teacher: Optional[str] = None  # Teacher assignment (1, 2, or 3)
    barcode: Optional[str] = None  # Custom barcode number for attendance scanning
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    teacher: Optional[str] = None
    barcode: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    teacher: Optional[str] = None  # Allow updating teacher assignment
    barcode: Optional[str] = None

class PointsUpdate(BaseModel):
    points: int
    reason: str = ""

class BulkPointsUpdate(BaseModel):
    group: str
    points: int
    reason: str = ""

class Group(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupCreate(BaseModel):
    name: str

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    group: str
    description: str
    points: int = 0
    status: str = "active"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    claims: List[str] = []
    claimed_by: Optional[str] = None
    claimed_by_name: Optional[str] = None
    template_id: Optional[str] = None  # Set when the task was given out from the task bank

class TaskCreate(BaseModel):
    group: str
    description: str
    points: int = 0

class TaskTemplate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    description: str
    points: int = 10
    assigned_groups: List[str] = []  # Groups that already received this task - never given to them again
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskTemplateCreate(BaseModel):
    description: str
    points: int = 10

class TaskAssign(BaseModel):
    group: str

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    points: int = 10
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ChallengeCreate(BaseModel):
    question: str
    options: List[str]
    correct_answer: int
    points: int = 10

class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team1: str
    team2: str
    score1: Optional[int] = None
    score2: Optional[int] = None
    status: str = "scheduled"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MatchCreate(BaseModel):
    team1: str
    team2: str

class LeagueStar(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    student_name: str
    image_url: Optional[str] = None
    week: int
    reason: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeagueStarCreate(BaseModel):
    student_id: str
    student_name: str
    image_url: Optional[str] = None
    image: Optional[str] = None # Support both names
    reason: str = ""

class PointsLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    points: int
    reason: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ViewerLink(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    token: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ViewerLinkCreate(BaseModel):
    name: str

class RamadanQuizQuestion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    options: List[str]
    correct_answer: int
    date: str
    points: int = 5

class RamadanQuizAnswer(BaseModel):
    student_id: str
    question_id: str
    answer: int
    date: str = Field(default_factory=lambda: date.today().isoformat())

class HalaqaGrade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    student_name: str
    memorization: int = 0
    revision: int = 0
    mutun: int = 0
    notes: str = ""
    total_points: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class HalaqaGradeCreate(BaseModel):
    student_id: str
    student_name: str
    memorization: int = 0
    revision: int = 0
    mutun: int = 0
    notes: str = ""

# ==================== Student Endpoints ====================

@api_router.get("/students", response_model=List[Student])
async def get_students():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for s in students:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    students.sort(key=lambda x: x["points"], reverse=True)
    return students

@api_router.get("/students/by-teacher/{teacher_id}")
async def get_students_by_teacher(teacher_id: str):
    """Get all students assigned to a specific teacher"""
    students = await db.students.find({"teacher": teacher_id}, {"_id": 0}).to_list(1000)
    for s in students:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    students.sort(key=lambda x: x["points"], reverse=True)
    return students

@api_router.get("/teachers/stats")
async def get_teacher_stats():
    """Get count of students assigned to each teacher"""
    pipeline = [
        {"$match": {"teacher": {"$exists": True, "$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$teacher", "count": {"$sum": 1}}}
    ]
    results = await db.students.aggregate(pipeline).to_list(1000)
    stats = {r["_id"]: r["count"] for r in results}
    return stats

@api_router.post("/students", response_model=Student)
async def create_student(data: StudentCreate):
    student = Student(**data.model_dump())
    doc = student.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.students.insert_one(doc)
    return student

@api_router.get("/students/{student_id}/profile")
async def get_student_profile(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="غير موجود")

    # Rank = number of students with more points + 1 (counted in the DB, no full download)
    points = student.get("points", 0)
    rank = await db.students.count_documents({"points": {"$gt": points}}) + 1
    total_students = await db.students.count_documents({})

    group_rank = None
    group_size = 0
    group = student.get("supervisor")
    if group:
        group_rank = await db.students.count_documents({"supervisor": group, "points": {"$gt": points}}) + 1
        group_size = await db.students.count_documents({"supervisor": group})

    return {
        "student": student,
        "rank": rank,
        "total_students": total_students,
        "group_rank": group_rank,
        "group_size": group_size
    }

# These fixed paths must be registered before PUT /students/{student_id},
# otherwise "bulk-points" / "reset-points" get matched as a student id.
@api_router.put("/students/bulk-points")
async def bulk_add_points(data: BulkPointsUpdate):
    students = await db.students.find({"supervisor": data.group}, {"_id": 0, "id": 1}).to_list(1000)
    student_ids = [s["id"] for s in students]
    if not student_ids:
        raise HTTPException(status_code=404, detail="لا يوجد طلاب في هذه المجموعة")

    await db.students.update_many({"id": {"$in": student_ids}}, {"$inc": {"points": data.points}})
    now_iso = datetime.now(timezone.utc).isoformat()
    log_entries = [
        {
            "id": str(uuid.uuid4()),
            "student_id": sid,
            "points": data.points,
            "reason": data.reason,
            "created_at": now_iso
        }
        for sid in student_ids
    ]
    await db.points_log.insert_many(log_entries)

    return {"success": True, "count": len(students)}

@api_router.put("/students/reset-points")
async def reset_all_points():
    students = await db.students.find({}, {"_id": 0, "id": 1, "points": 1}).to_list(10000)

    await db.students.update_many({}, {"$set": {"points": 0}})

    log_entries = [
        {
            "id": str(uuid.uuid4()),
            "student_id": student["id"],
            "points": -student.get("points", 0),
            "reason": "تصفير جميع النقاط",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        for student in students if student.get("points", 0) != 0
    ]
    if log_entries:
        await db.points_log.insert_many(log_entries)

    return {"success": True, "count": len(students)}

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, data: StudentUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.students.update_one({"id": student_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"success": True}

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    student = await db.students.find_one({"id": student_id}, {"_id": 0, "image_url": 1})
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    await delete_image_if_unused((student or {}).get("image_url"))
    return {"deleted": True}

@api_router.put("/students/{student_id}/points")
async def add_points(student_id: str, data: PointsUpdate):
    student = await db.students.find_one({"id": student_id})
    if not student:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    await db.students.update_one({"id": student_id}, {"$inc": {"points": data.points}})
    
    # Log points
    log_entry = {
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "points": data.points,
        "reason": data.reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.points_log.insert_one(log_entry)
    
    return {"success": True}

@api_router.post("/students/{student_id}/upload-image")
async def upload_image(student_id: str, file: UploadFile = File(...)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0, "image_url": 1})
    if not student:
        raise HTTPException(status_code=404, detail="غير موجود")

    image_url = await store_image(await file.read(), file.content_type)
    await db.students.update_one({"id": student_id}, {"$set": {"image_url": image_url}})
    await delete_image_if_unused(student.get("image_url"))
    return {"success": True, "image_url": image_url}

# ==================== Groups Endpoints ====================

@api_router.get("/groups", response_model=List[Group])
async def get_groups():
    groups = await db.groups.find({}, {"_id": 0}).to_list(1000)
    for g in groups:
        if isinstance(g.get("created_at"), str):
            g["created_at"] = datetime.fromisoformat(g["created_at"])
    return groups

@api_router.post("/groups", response_model=Group)
async def create_group(data: GroupCreate):
    group = Group(name=data.name)
    doc = group.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.groups.insert_one(doc)
    return group

@api_router.put("/groups/{group_id}", response_model=Group)
async def update_group(group_id: str, data: GroupCreate):
    existing = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="غير موجود")

    old_name = existing.get("name")
    await db.groups.update_one({"id": group_id}, {"$set": {"name": data.name}})

    if old_name and old_name != data.name:
        await db.students.update_many({"supervisor": old_name}, {"$set": {"supervisor": data.name}})
        # Keep task history attached to the group under its new name
        await db.tasks.update_many({"group": old_name}, {"$set": {"group": data.name}})
        await db.task_templates.update_many({"assigned_groups": old_name}, {"$addToSet": {"assigned_groups": data.name}})
        await db.task_templates.update_many({"assigned_groups": old_name}, {"$pull": {"assigned_groups": old_name}})

    updated = await db.groups.find_one({"id": group_id}, {"_id": 0})
    return updated

@api_router.delete("/groups/{group_id}")
async def delete_group(group_id: str):
    result = await db.groups.delete_one({"id": group_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

# ==================== Tasks Endpoints ====================

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(group: Optional[str] = Query(None)):
    query = {} if group is None else {"group": group}
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(1000)
    # Old tasks only have a claims array: look up all their claimers' names in one query
    legacy_claimers = {t["claims"][-1] for t in tasks if not t.get("claimed_by") and t.get("claims")}
    names = {}
    if legacy_claimers:
        claimers = await db.students.find({"id": {"$in": list(legacy_claimers)}}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
        names = {s["id"]: s.get("name", "Unknown") for s in claimers}
    for t in tasks:
        if isinstance(t.get("created_at"), str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
        if not t.get("claimed_by") and t.get("claims"):
            last_claimer = t["claims"][-1]
            t["claimed_by"] = last_claimer
            t["claimed_by_name"] = names.get(last_claimer, "Unknown")
    return tasks

@api_router.post("/tasks", response_model=Task)
async def create_task(data: TaskCreate):
    task = Task(**data.model_dump())
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    return task

@api_router.post("/tasks/{task_id}/complete")
async def complete_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="مهمة غير موجودة")
    
    # Award points to the student who claimed the task
    claimed_by = task.get("claimed_by")
    if claimed_by:
        student = await db.students.find_one({"id": claimed_by})
        if student:
            await db.students.update_one({"id": claimed_by}, {"$inc": {"points": task["points"]}})
            log_entry = {
                "id": str(uuid.uuid4()),
                "student_id": claimed_by,
                "points": task["points"],
                "reason": f"مهمة: {task['description']}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.points_log.insert_one(log_entry)
    
    await db.tasks.update_one({"id": task_id}, {"$set": {"status": "completed"}})
    return {"success": True}

@api_router.post("/tasks/{task_id}/claim/{student_id}")
async def claim_task(task_id: str, student_id: str):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="مهمة غير موجودة")
    
    claims = task.get("claims", [])
    if student_id not in claims:
        # Get student name for claimed_by_name
        student = await db.students.find_one({"id": student_id})
        student_name = student.get("name", "Unknown") if student else "Unknown"
        
        await db.tasks.update_one(
            {"id": task_id}, 
            {
                "$push": {"claims": student_id},
                "$set": {
                    "claimed_by": student_id,
                    "claimed_by_name": student_name,
                    "status": "awaiting_approval"
                }
            }
        )
    
    return {"success": True}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

# ==================== Task Bank (reusable tasks) ====================
# Tasks are written once and given out to groups. Each template remembers which
# groups received it (assigned_groups) so no group ever gets the same task twice.
# Deleting a given-out task does not erase that history.

async def _require_group(name: str):
    if not await db.groups.find_one({"name": name}, {"_id": 1}):
        raise HTTPException(status_code=404, detail="المجموعة غير موجودة")

async def _assign_template(template: dict, group: str) -> Optional[Task]:
    """Give a template to a group. Returns None if the group already received it."""
    # Atomic check-and-mark: two clicks at once cannot both succeed
    result = await db.task_templates.update_one(
        {"id": template["id"], "assigned_groups": {"$ne": group}},
        {"$addToSet": {"assigned_groups": group}}
    )
    if result.modified_count == 0:
        return None
    task = Task(group=group, description=template["description"], points=template["points"], template_id=template["id"])
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    return task

async def _assign_next_template(group: str) -> Optional[Task]:
    """Give a group the oldest bank task it has not received yet. None when it has received them all."""
    while True:
        template = await db.task_templates.find_one(
            {"assigned_groups": {"$ne": group}}, {"_id": 0}, sort=[("created_at", 1)]
        )
        if not template:
            return None
        task = await _assign_template(template, group)
        if task:
            return task
        # Another request assigned this one first - try the next template

@api_router.get("/task-templates", response_model=List[TaskTemplate])
async def get_task_templates():
    templates = await db.task_templates.find({}, {"_id": 0}).sort("created_at", 1).to_list(1000)
    for t in templates:
        if isinstance(t.get("created_at"), str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
    return templates

@api_router.post("/task-templates", response_model=TaskTemplate)
async def create_task_template(data: TaskTemplateCreate):
    template = TaskTemplate(**data.model_dump())
    doc = template.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.task_templates.insert_one(doc)
    return template

@api_router.post("/task-templates/assign-next")
async def assign_next_task_template(data: TaskAssign):
    await _require_group(data.group)
    task = await _assign_next_template(data.group)
    if not task:
        raise HTTPException(status_code=404, detail="حصلت هذه المجموعة على جميع المهام في البنك")
    return {"success": True, "task": task}

@api_router.post("/task-templates/distribute")
async def distribute_task_templates():
    """Give every group its next bank task it has not received yet."""
    groups = await db.groups.find({}, {"_id": 0, "name": 1}).to_list(1000)
    assigned, finished = [], []
    for g in groups:
        task = await _assign_next_template(g["name"])
        if task:
            assigned.append({"group": g["name"], "description": task.description})
        else:
            finished.append(g["name"])
    return {"assigned": assigned, "finished_groups": finished}

@api_router.post("/task-templates/{template_id}/assign")
async def assign_task_template(template_id: str, data: TaskAssign):
    template = await db.task_templates.find_one({"id": template_id}, {"_id": 0})
    if not template:
        raise HTTPException(status_code=404, detail="مهمة غير موجودة")
    await _require_group(data.group)
    task = await _assign_template(template, data.group)
    if not task:
        raise HTTPException(status_code=400, detail="حصلت هذه المجموعة على هذه المهمة مسبقاً")
    return {"success": True, "task": task}

@api_router.delete("/task-templates/{template_id}/groups/{group}")
async def reset_task_template_group(template_id: str, group: str):
    """Undo: allow a group to receive this task again (does not delete the task already given)."""
    result = await db.task_templates.update_one({"id": template_id}, {"$pull": {"assigned_groups": group}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="مهمة غير موجودة")
    return {"success": True}

@api_router.delete("/task-templates/{template_id}")
async def delete_task_template(template_id: str):
    """Remove from the bank. Tasks already given to groups are kept."""
    result = await db.task_templates.delete_one({"id": template_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

# ==================== Challenges Endpoints ====================

@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges():
    challenges = await db.challenges.find({}, {"_id": 0}).to_list(1000)
    for c in challenges:
        if isinstance(c.get("created_at"), str):
            c["created_at"] = datetime.fromisoformat(c["created_at"])
    return challenges

@api_router.get("/challenges/active", response_model=List[Challenge])
async def get_active_challenges():
    challenges = await db.challenges.find({"is_active": True}, {"_id": 0}).to_list(1000)
    for c in challenges:
        if isinstance(c.get("created_at"), str):
            c["created_at"] = datetime.fromisoformat(c["created_at"])
    return challenges

@api_router.post("/challenges", response_model=Challenge)
async def create_challenge(data: ChallengeCreate):
    challenge = Challenge(**data.model_dump())
    doc = challenge.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.challenges.insert_one(doc)
    return challenge

@api_router.put("/challenges/{challenge_id}/toggle")
async def toggle_challenge(challenge_id: str):
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    await db.challenges.update_one({"id": challenge_id}, {"$set": {"is_active": not challenge["is_active"]}})
    return {"success": True}

@api_router.delete("/challenges/{challenge_id}")
async def delete_challenge(challenge_id: str):
    result = await db.challenges.delete_one({"id": challenge_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

@api_router.post("/challenges/{challenge_id}/answer/{student_id}")
async def answer_challenge(challenge_id: str, student_id: str, data: dict):
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="تحدي غير موجود")
    
    answer = data.get("answer")
    is_correct = answer == challenge["correct_answer"]
    
    if is_correct:
        student = await db.students.find_one({"id": student_id})
        if student:
            await db.students.update_one({"id": student_id}, {"$inc": {"points": challenge["points"]}})
            log_entry = {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "points": challenge["points"],
                "reason": f"إجابة صحيحة: {challenge['question']}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.points_log.insert_one(log_entry)
    
    return {"correct": is_correct, "points": challenge["points"] if is_correct else 0}

# ==================== League Endpoints ====================

@api_router.get("/matches", response_model=List[Match])
async def get_matches():
    matches = await db.matches.find({}, {"_id": 0}).to_list(1000)
    for m in matches:
        if isinstance(m.get("created_at"), str):
            m["created_at"] = datetime.fromisoformat(m["created_at"])
    return matches

@api_router.post("/matches", response_model=Match)
async def create_match(data: MatchCreate):
    match = Match(**data.model_dump())
    doc = match.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.matches.insert_one(doc)
    return match

@api_router.put("/matches/{match_id}/score")
async def set_match_score(match_id: str, data: dict):
    score1 = data.get("score1")
    score2 = data.get("score2")
    
    await db.matches.update_one(
        {"id": match_id},
        {"$set": {"score1": score1, "score2": score2, "status": "completed"}}
    )
    return {"success": True}

@api_router.delete("/matches/{match_id}")
async def delete_match(match_id: str):
    result = await db.matches.delete_one({"id": match_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

@api_router.get("/league-standings")
async def get_league_standings():
    matches = await db.matches.find({"status": "completed"}, {"_id": 0}).to_list(1000)
    standings = {}
    
    for match in matches:
        team1 = match["team1"]
        team2 = match["team2"]
        score1 = match.get("score1", 0)
        score2 = match.get("score2", 0)
        
        if team1 not in standings:
            standings[team1] = {"wins": 0, "losses": 0, "draws": 0, "points": 0}
        if team2 not in standings:
            standings[team2] = {"wins": 0, "losses": 0, "draws": 0, "points": 0}
        
        if score1 > score2:
            standings[team1]["wins"] += 1
            standings[team1]["points"] += 3
            standings[team2]["losses"] += 1
        elif score2 > score1:
            standings[team2]["wins"] += 1
            standings[team2]["points"] += 3
            standings[team1]["losses"] += 1
        else:
            standings[team1]["draws"] += 1
            standings[team1]["points"] += 1
            standings[team2]["draws"] += 1
            standings[team2]["points"] += 1
    
    # Convert to list of objects with team property
    result = []
    for team_name, stats in standings.items():
        stats["team"] = team_name
        stats["played"] = stats.get("wins", 0) + stats.get("draws", 0) + stats.get("losses", 0)
        stats["gf"] = 0  # Goals for - would need match data
        stats["ga"] = 0  # Goals against - would need match data
        stats["gd"] = 0  # Goal difference
        result.append(stats)
    
    return sorted(result, key=lambda x: x["points"], reverse=True)

@api_router.get("/league-star")
async def get_league_star():
    star = await db.league_star.find_one({}, {"_id": 0}, sort=[("created_at", -1)])
    if not star:
        return {"message": "لا يوجد نجم دوري حتى الآن"}
    if isinstance(star.get("created_at"), str):
        star["created_at"] = datetime.fromisoformat(star["created_at"])
    return star

@api_router.get("/league-stars", response_model=List[LeagueStar])
async def get_league_stars():
    stars = await db.league_star.find({}, {"_id": 0}).to_list(1000)
    for s in stars:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    return sorted(stars, key=lambda x: x.get("created_at", datetime.now(timezone.utc)), reverse=True)

@api_router.post("/league-star", response_model=LeagueStar)
async def set_league_star(data: LeagueStarCreate):
    week = datetime.now(timezone.utc).isocalendar()[1]
    star_id = str(uuid.uuid4())
    star_doc = {
        "id": star_id,
        "student_id": data.student_id,
        "student_name": data.student_name,
        "image_url": data.image_url or data.image,
        "reason": data.reason,
        "week": week,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.league_star.insert_one(star_doc)
    return LeagueStar(**star_doc)

@api_router.delete("/league-star/{star_id}")
async def delete_league_star(star_id: str):
    star = await db.league_star.find_one({"id": star_id}, {"_id": 0, "image_url": 1})
    result = await db.league_star.delete_one({"id": star_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    await delete_image_if_unused((star or {}).get("image_url"))
    return {"deleted": True}

# ==================== Teams Endpoints ====================

class TeamPlayer(BaseModel):
    student_id: str
    name: str
    x: float
    y: float

class TeamUpdate(BaseModel):
    name: str
    group_photo: Optional[str] = ""
    lineup: List[TeamPlayer] = []

@api_router.get("/teams")
async def get_all_teams():
    return await db.teams.find({}, {"_id": 0}).to_list(100)

@api_router.get("/teams/{group_name}")
async def get_team(group_name: str):
    team = await db.teams.find_one({"name": group_name}, {"_id": 0})
    if team:
        return team
    return {"name": group_name, "group_photo": "", "lineup": []}

@api_router.post("/teams")
async def save_team(data: TeamUpdate):
    existing = await db.teams.find_one({"name": data.name}, {"_id": 0, "group_photo": 1})
    await db.teams.update_one({"name": data.name}, {"$set": data.model_dump()}, upsert=True)
    old_photo = (existing or {}).get("group_photo")
    if old_photo != data.group_photo:
        await delete_image_if_unused(old_photo)
    return {"success": True}

@api_router.post("/teams/{group_name}/upload-photo")
async def upload_team_photo(group_name: str, file: UploadFile = File(...)):
    existing = await db.teams.find_one({"name": group_name}, {"_id": 0, "group_photo": 1})
    image_url = await store_image(await file.read(), file.content_type)
    await db.teams.update_one({"name": group_name}, {"$set": {"group_photo": image_url}}, upsert=True)
    await delete_image_if_unused((existing or {}).get("group_photo"))
    return {"image_url": image_url}

# ==================== Points Log Endpoints ====================

@api_router.get("/points-log/{student_id}")
async def get_points_log(student_id: str):
    logs = await db.points_log.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    for log in logs:
        if isinstance(log.get("created_at"), str):
            log["created_at"] = datetime.fromisoformat(log["created_at"])
    return sorted(logs, key=lambda x: x.get("created_at", datetime.now(timezone.utc)), reverse=True)

# ==================== Viewer Links Endpoints ====================

@api_router.get("/viewer-links", response_model=List[ViewerLink])
async def get_viewer_links():
    links = await db.viewer_links.find({}, {"_id": 0}).to_list(1000)
    for l in links:
        if isinstance(l.get("created_at"), str):
            l["created_at"] = datetime.fromisoformat(l["created_at"])
    return links

@api_router.post("/viewer-links", response_model=ViewerLink)
async def create_viewer_link(data: ViewerLinkCreate):
    link = ViewerLink(name=data.name)
    doc = link.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.viewer_links.insert_one(doc)
    return link

@api_router.delete("/viewer-links/{link_id}")
async def delete_viewer_link(link_id: str):
    result = await db.viewer_links.delete_one({"id": link_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

@api_router.get("/viewer/{token}")
async def get_viewer_by_token(token: str):
    link = await db.viewer_links.find_one({"token": token}, {"_id": 0})
    if not link:
        raise HTTPException(status_code=404, detail="رابط غير صحيح")
    return link

# ==================== Ramadan Quiz Endpoints ====================

@api_router.get("/ramadan-quiz/today")
async def get_today_quiz_question():
    today = date.today().isoformat()
    question = await db.ramadan_quiz.find_one({"date": today}, {"_id": 0})
    if not question:
        return {"message": "لا توجد أسئلة لهذا اليوم"}
    return question

@api_router.get("/ramadan-quiz/status/{student_id}")
async def get_quiz_status(student_id: str):
    today = date.today().isoformat()
    answer = await db.ramadan_answers.find_one({"student_id": student_id, "date": today}, {"_id": 0})
    return {"answered": answer is not None}

@api_router.post("/ramadan-quiz/answer")
async def submit_quiz_answer(data: RamadanQuizAnswer):
    question = await db.ramadan_quiz.find_one({"id": data.question_id}, {"_id": 0})
    if not question:
        raise HTTPException(status_code=404, detail="سؤال غير موجود")
    
    is_correct = data.answer == question["correct_answer"]
    
    # Store answer
    answer_doc = data.model_dump()
    answer_doc["id"] = str(uuid.uuid4())
    answer_doc["correct"] = is_correct
    answer_doc["timestamp"] = datetime.now(timezone.utc).isoformat()
    await db.ramadan_answers.insert_one(answer_doc)
    
    if is_correct:
        student = await db.students.find_one({"id": data.student_id})
        if student:
            await db.students.update_one({"id": data.student_id}, {"$inc": {"points": question["points"]}})
            log_entry = {
                "id": str(uuid.uuid4()),
                "student_id": data.student_id,
                "points": question["points"],
                "reason": f"مسابقة رمضان: {question['question']}",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.points_log.insert_one(log_entry)
    
    return {"correct": is_correct, "points": question["points"] if is_correct else 0}

# ==================== Halaqa Grades Endpoints ====================

@api_router.get("/halaqa-grades", response_model=List[HalaqaGrade])
async def get_halaqa_grades():
    grades = await db.halaqa_grades.find({}, {"_id": 0}).to_list(1000)
    for g in grades:
        if isinstance(g.get("created_at"), str):
            g["created_at"] = datetime.fromisoformat(g["created_at"])
    return sorted(grades, key=lambda x: x.get("created_at", datetime.now(timezone.utc)), reverse=True)

@api_router.get("/halaqa-grades/{student_id}")
async def get_student_halaqa_grades(student_id: str):
    grades = await db.halaqa_grades.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    for g in grades:
        if isinstance(g.get("created_at"), str):
            g["created_at"] = datetime.fromisoformat(g["created_at"])
    return sorted(grades, key=lambda x: x.get("created_at", datetime.now(timezone.utc)), reverse=True)

@api_router.post("/halaqa-grades", response_model=HalaqaGrade)
async def create_halaqa_grade(data: HalaqaGradeCreate):
    # Calculate total points
    total_points = data.memorization + data.revision + data.mutun
    
    grade = HalaqaGrade(
        student_id=data.student_id,
        student_name=data.student_name,
        memorization=data.memorization,
        revision=data.revision,
        mutun=data.mutun,
        notes=data.notes,
        total_points=total_points
    )
    doc = grade.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.halaqa_grades.insert_one(doc)
    
    # Add points to student
    student = await db.students.find_one({"id": data.student_id})
    if student:
        await db.students.update_one({"id": data.student_id}, {"$inc": {"points": total_points}})
        log_entry = {
            "id": str(uuid.uuid4()),
            "student_id": data.student_id,
            "points": total_points,
            "reason": f"خلقة: حفظ({data.memorization}) + مراجعة({data.revision}) + متون({data.mutun})",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.points_log.insert_one(log_entry)
    
    return grade

@api_router.delete("/halaqa-grades/{grade_id}")
async def delete_halaqa_grade(grade_id: str):
    grade = await db.halaqa_grades.find_one({"id": grade_id})
    if not grade:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    # Subtract points from student
    await db.students.update_one({"id": grade["student_id"]}, {"$inc": {"points": -grade["total_points"]}})
    
    result = await db.halaqa_grades.delete_one({"id": grade_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

# ==================== Qudurat Models ====================

class QuduratItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    video_url: str
    question: str
    options: List[str]
    correct_answer: int
    points_question: int = 10
    points_summary: int = 20
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuduratCreate(BaseModel):
    video_url: str
    question: str
    options: List[str]
    correct_answer: int
    points_question: int = 10
    points_summary: int = 20

class QuduratSubmission(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    qudurat_id: str
    student_id: str
    student_name: str
    answer: int
    is_correct: bool
    summary: str
    points_question: int = 0
    points_summary_awarded: int = 0
    status: str = "pending"  # "pending", "approved", "rejected"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuduratSubmissionCreate(BaseModel):
    student_id: str
    student_name: str
    answer: int
    summary: str

class QuduratReview(BaseModel):
    points: int
    status: str  # "approved", "rejected"

# ==================== Attendance Models ====================
# Works like the Quran site's attendance: every student is listed as "not recorded",
# scanning or tapping a status records them (one record per student per session),
# any status can be corrected later, and closing marks everyone not yet recorded as
# absent. There is no fixed time: the supervisor opens attendance whenever needed,
# decides when the late period starts, and decides when to close.

ATTENDANCE_POINTS = {"present": 20, "late": -10, "absent": -30, "excused": 0}
ATTENDANCE_REASONS = {"present": "حضور", "late": "حضور متأخر", "absent": "غياب", "excused": "غياب بعذر"}
AttendanceStatus = Literal["present", "late", "absent", "excused"]

class AttendanceSession(BaseModel):
    # Field names kept from the old timer-based sessions so their history still reads correctly:
    # is_active=False means the late period has started (ended_at = when), is_finalized = closed.
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str = Field(default_factory=get_today_riyadh)
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    ended_at: Optional[datetime] = None
    is_active: bool = True
    is_finalized: bool = False
    created_by: str = "admin"

class AttendanceScan(BaseModel):
    code: str  # Barcode number, student id, or the student's /public/<id> link from the QR code

class AttendanceStatusUpdate(BaseModel):
    status: AttendanceStatus

class AttendanceLatePeriod(BaseModel):
    enabled: bool

class AttendanceRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    student_id: str
    student_name: str
    status: str  # "present", "late", "absent", "excused" (older records may say "early" = present)
    points: int
    method: str = "manual"  # "scan" or "manual"
    scanned_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_late_period: bool = False

# ==================== Qudurat Endpoints ====================

@api_router.get("/qudurat", response_model=List[QuduratItem])
async def get_qudurat_all():
    items = await db.qudurat.find({}, {"_id": 0}).to_list(1000)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items

@api_router.get("/qudurat/active", response_model=List[QuduratItem])
async def get_qudurat_active():
    items = await db.qudurat.find({"is_active": True}, {"_id": 0}).to_list(1000)
    for it in items:
        if isinstance(it.get("created_at"), str):
            it["created_at"] = datetime.fromisoformat(it["created_at"])
    return items

@api_router.post("/qudurat", response_model=QuduratItem)
async def create_qudurat(data: QuduratCreate):
    item = QuduratItem(**data.model_dump())
    doc = item.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.qudurat.insert_one(doc)
    return item

@api_router.put("/qudurat/{item_id}/toggle")
async def toggle_qudurat(item_id: str):
    item = await db.qudurat.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="غير موجود")
    await db.qudurat.update_one({"id": item_id}, {"$set": {"is_active": not item.get("is_active", True)}})
    return {"success": True}

@api_router.delete("/qudurat/{item_id}")
async def delete_qudurat(item_id: str):
    result = await db.qudurat.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

@api_router.get("/qudurat/{item_id}/submission/{student_id}")
async def get_student_qudurat_submission(item_id: str, student_id: str):
    submission = await db.qudurat_submissions.find_one({"qudurat_id": item_id, "student_id": student_id}, {"_id": 0})
    if not submission:
        return {"submitted": False}
    if isinstance(submission.get("created_at"), str):
        submission["created_at"] = datetime.fromisoformat(submission["created_at"])
    return {"submitted": True, "submission": submission}

@api_router.post("/qudurat/{item_id}/submit")
async def submit_qudurat(item_id: str, data: QuduratSubmissionCreate):
    item = await db.qudurat.find_one({"id": item_id})
    if not item:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    # Check if already submitted
    existing = await db.qudurat_submissions.find_one({"qudurat_id": item_id, "student_id": data.student_id})
    if existing:
        raise HTTPException(status_code=400, detail="تم الرد مسبقاً")

    is_correct = data.answer == item["correct_answer"]
    points_earned = item["points_question"] if is_correct else 0
    
    submission = QuduratSubmission(
        qudurat_id=item_id,
        student_id=data.student_id,
        student_name=data.student_name,
        answer=data.answer,
        is_correct=is_correct,
        summary=data.summary,
        points_question=points_earned,
        points_summary_awarded=0,
        status="pending"
    )
    
    doc = submission.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.qudurat_submissions.insert_one(doc)
    
    # Award points for correct answer immediately
    if points_earned > 0:
        await db.students.update_one({"id": data.student_id}, {"$inc": {"points": points_earned}})
        log_entry = {
            "id": str(uuid.uuid4()),
            "student_id": data.student_id,
            "points": points_earned,
            "reason": f"قدرات - إجابة صحيحة: {item['question']}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.points_log.insert_one(log_entry)
        
    return {"success": True, "is_correct": is_correct, "points_earned": points_earned}

@api_router.get("/qudurat/submissions/pending", response_model=List[QuduratSubmission])
async def get_pending_qudurat_submissions():
    submissions = await db.qudurat_submissions.find({"status": "pending"}, {"_id": 0}).to_list(1000)
    for s in submissions:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    return submissions

@api_router.get("/qudurat/submissions", response_model=List[QuduratSubmission])
async def get_all_qudurat_submissions():
    submissions = await db.qudurat_submissions.find({}, {"_id": 0}).to_list(1000)
    for s in submissions:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    # Sort by created_at descending (newest first)
    return sorted(submissions, key=lambda x: x.get("created_at", datetime.now(timezone.utc)), reverse=True)

@api_router.delete("/qudurat/submissions/{submission_id}")
async def delete_qudurat_submission(submission_id: str):
    result = await db.qudurat_submissions.delete_one({"id": submission_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

@api_router.post("/qudurat/submissions/{submission_id}/review")
async def review_qudurat_submission(submission_id: str, review: QuduratReview):
    sub = await db.qudurat_submissions.find_one({"id": submission_id})
    if not sub:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    if sub.get("status") != "pending":
        raise HTTPException(status_code=400, detail="تمت مراجعة هذا الرد مسبقاً")
        
    # Get qudurat item info
    item = await db.qudurat.find_one({"id": sub["qudurat_id"]})
    video_title = item.get("video_url") if item else "فيديو"
    
    # Update status
    await db.qudurat_submissions.update_one(
        {"id": submission_id}, 
        {"$set": {"status": review.status, "points_summary_awarded": review.points}}
    )
    
    # Award points if approved
    if review.status == "approved" and review.points > 0:
        await db.students.update_one({"id": sub["student_id"]}, {"$inc": {"points": review.points}})
        log_entry = {
            "id": str(uuid.uuid4()),
            "student_id": sub["student_id"],
            "points": review.points,
            "reason": f"قدرات - تلخيص فيديو: {video_title}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.points_log.insert_one(log_entry)
        
    return {"success": True}

# ==================== Attendance Endpoints ====================

ROSTER_STUDENT_FIELDS = {"_id": 0, "id": 1, "name": 1, "supervisor": 1, "image_url": 1}

def _record_status(record: dict) -> str:
    return "present" if record.get("status") == "early" else record.get("status")

async def _get_attendance_session(session_id: str) -> dict:
    session = await db.attendance_sessions.find_one({"id": session_id}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=404, detail="جلسة الحضور غير موجودة")
    return session

async def _award_points(student_id: str, points: int, reason: str):
    if points == 0:
        return
    await db.students.update_one({"id": student_id}, {"$inc": {"points": points}})
    await db.points_log.insert_one({
        "id": str(uuid.uuid4()),
        "student_id": student_id,
        "points": points,
        "reason": reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

async def _create_attendance_record(session_id: str, student: dict, status: str, method: str):
    """Records a student once per session. Returns (record, created)."""
    existing = await db.attendance_records.find_one({"session_id": session_id, "student_id": student["id"]}, {"_id": 0})
    if existing:
        return existing, False
    record = AttendanceRecord(
        session_id=session_id,
        student_id=student["id"],
        student_name=student.get("name", ""),
        status=status,
        points=ATTENDANCE_POINTS[status],
        method=method,
        is_late_period=status == "late"
    )
    doc = record.model_dump()
    doc["scanned_at"] = doc["scanned_at"].isoformat()
    try:
        await db.attendance_records.insert_one(doc)
    except DuplicateKeyError:
        # Recorded at the same moment by another scan/tap - keep that one
        existing = await db.attendance_records.find_one({"session_id": session_id, "student_id": student["id"]}, {"_id": 0})
        return existing, False
    doc.pop("_id", None)
    await _award_points(student["id"], doc["points"], ATTENDANCE_REASONS[status])
    return doc, True

async def _find_student_by_code(code: str) -> Optional[dict]:
    code = code.strip()
    # The QR code on a student card holds their page link: .../public/<student id>
    match = re.search(r"/public/([^/?#]+)/?$", code)
    key = match.group(1) if match else code
    if not key:
        return None
    return await db.students.find_one({"$or": [
        {"id": key},
        {"barcode": key},
        {"barcode": {"$regex": f"^{re.escape(key)}$", "$options": "i"}}
    ]}, ROSTER_STUDENT_FIELDS)

async def _attendance_view(session: dict) -> dict:
    """The session plus every student with their status in it (or "not_recorded")."""
    students = await db.students.find({}, ROSTER_STUDENT_FIELDS).to_list(1000)
    students.sort(key=lambda s: s.get("name", ""))
    records = await db.attendance_records.find({"session_id": session["id"]}, {"_id": 0}).to_list(1000)
    record_by_student = {r["student_id"]: r for r in records}

    roster = []
    counts = {"present": 0, "late": 0, "absent": 0, "excused": 0, "not_recorded": 0}
    for s in students:
        record = record_by_student.get(s["id"])
        status = _record_status(record) if record else "not_recorded"
        counts[status] = counts.get(status, 0) + 1
        roster.append({
            "student_id": s["id"],
            "name": s.get("name", ""),
            "group": s.get("supervisor"),
            "image_url": s.get("image_url"),
            "status": status,
            "points": record.get("points") if record else None,
            "recorded_at": record.get("scanned_at") if record else None,
        })

    return {
        "session": {
            "id": session["id"],
            "date": session.get("date"),
            "opened_at": session.get("started_at"),
            "is_late_period": not session.get("is_active", True),
            "late_since": session.get("ended_at"),
            "is_closed": bool(session.get("is_finalized")),
            "closed_at": session.get("finalized_at"),
        },
        "roster": roster,
        "counts": counts,
    }

@api_router.get("/attendance/current")
async def get_current_attendance():
    """The open attendance session (whenever it was opened), else today's last closed one."""
    session = await db.attendance_sessions.find_one({"is_finalized": {"$ne": True}}, {"_id": 0}, sort=[("started_at", -1)])
    if not session:
        session = await db.attendance_sessions.find_one({"date": get_today_riyadh()}, {"_id": 0}, sort=[("started_at", -1)])
    if not session:
        return {"session": None, "roster": [], "counts": {}}
    return await _attendance_view(session)

@api_router.post("/attendance/open")
async def open_attendance():
    """Open attendance now. If one is already open, that one is returned instead of a second."""
    session = await db.attendance_sessions.find_one({"is_finalized": {"$ne": True}}, {"_id": 0}, sort=[("started_at", -1)])
    if not session:
        doc = AttendanceSession().model_dump()
        doc["started_at"] = doc["started_at"].isoformat()
        await db.attendance_sessions.insert_one(doc)
        session = await db.attendance_sessions.find_one({"id": doc["id"]}, {"_id": 0})
    return await _attendance_view(session)

@api_router.post("/attendance/{session_id}/late-period")
async def set_attendance_late_period(session_id: str, data: AttendanceLatePeriod):
    """Supervisor starts (or cancels) the late period: scans after this count as late."""
    session = await _get_attendance_session(session_id)
    if session.get("is_finalized"):
        raise HTTPException(status_code=400, detail="الحضور مغلق")
    await db.attendance_sessions.update_one({"id": session_id}, {"$set": {
        "is_active": not data.enabled,
        "ended_at": datetime.now(timezone.utc).isoformat() if data.enabled else None
    }})
    return await _attendance_view(await _get_attendance_session(session_id))

@api_router.post("/attendance/{session_id}/scan")
async def scan_attendance(session_id: str, data: AttendanceScan):
    session = await _get_attendance_session(session_id)
    if session.get("is_finalized"):
        raise HTTPException(status_code=400, detail="الحضور مغلق - افتح الحضور أولاً")
    student = await _find_student_by_code(data.code)
    if not student:
        raise HTTPException(status_code=404, detail="لم يتم العثور على طالب بهذا الرمز")

    status = "late" if not session.get("is_active", True) else "present"
    record, created = await _create_attendance_record(session_id, student, status, "scan")
    return {
        "student": student,
        "status": _record_status(record),
        "points": record.get("points"),
        "already_recorded": not created,
    }

@api_router.put("/attendance/{session_id}/students/{student_id}")
async def set_attendance_status(session_id: str, student_id: str, data: AttendanceStatusUpdate):
    """Set or correct one student's status. Changing a status adjusts their points by the difference."""
    await _get_attendance_session(session_id)
    student = await db.students.find_one({"id": student_id}, ROSTER_STUDENT_FIELDS)
    if not student:
        raise HTTPException(status_code=404, detail="الطالب غير موجود")

    record, created = await _create_attendance_record(session_id, student, data.status, "manual")
    if created or _record_status(record) == data.status:
        return {"success": True, "status": data.status}

    new_points = ATTENDANCE_POINTS[data.status]
    # Only applies if nobody changed this record in the meantime, so points are never adjusted twice
    updated = await db.attendance_records.find_one_and_update(
        {"id": record["id"], "status": record["status"]},
        {"$set": {"status": data.status, "points": new_points, "is_late_period": data.status == "late"}}
    )
    if not updated:
        raise HTTPException(status_code=409, detail="تم تعديل هذا الطالب للتو، حدّث الصفحة")
    await _award_points(student_id, new_points - record.get("points", 0), f"تعديل الحضور: {ATTENDANCE_REASONS[data.status]}")
    return {"success": True, "status": data.status}

@api_router.post("/attendance/{session_id}/close")
async def close_attendance(session_id: str):
    """Close attendance: every student not recorded yet is marked absent."""
    session = await _get_attendance_session(session_id)
    if session.get("is_finalized"):
        raise HTTPException(status_code=400, detail="تم إغلاق الحضور مسبقاً")

    students = await db.students.find({}, ROSTER_STUDENT_FIELDS).to_list(1000)
    recorded = {r["student_id"] for r in await db.attendance_records.find({"session_id": session_id}, {"_id": 0, "student_id": 1}).to_list(1000)}
    marked_absent = 0
    for student in students:
        if student["id"] in recorded:
            continue
        _, created = await _create_attendance_record(session_id, student, "absent", "manual")
        if created:
            marked_absent += 1

    await db.attendance_sessions.update_one(
        {"id": session_id},
        {"$set": {"is_finalized": True, "finalized_at": datetime.now(timezone.utc).isoformat()}}
    )
    view = await _attendance_view(await _get_attendance_session(session_id))
    view["marked_absent"] = marked_absent
    return view

# ==================== Health Check ====================

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

# ==================== App Setup ===== ===============

app.include_router(api_router)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

@app.on_event("startup")
async def create_indexes():
    await db.students.create_index("id", unique=True)
    await db.students.create_index("supervisor")
    await db.students.create_index("teacher")
    await db.points_log.create_index("student_id")
    await db.groups.create_index("id", unique=True)
    await db.teachers.create_index("id", unique=True)
    await db.tasks.create_index("group")
    await db.attendance_records.create_index("session_id")
    await db.attendance_sessions.create_index("date")
    try:
        # One record per student per session (old data with duplicates must not block startup)
        await db.attendance_records.create_index([("session_id", 1), ("student_id", 1)], unique=True)
    except Exception:
        logging.warning("Could not create unique attendance index - duplicate records exist")
    await db.halaqa_grades.create_index("student_id")
    await db.images.create_index("id", unique=True)
    await db.teams.create_index("name")
    await db.task_templates.create_index("id", unique=True)
    # Runs in the background so the API starts serving immediately
    asyncio.create_task(migrate_all_inline_images())

@app.on_event("shutdown")
async def shutdown():
    client.close()
