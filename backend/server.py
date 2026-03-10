from fastapi import FastAPI, APIRouter, HTTPException, File, UploadFile, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get("MONGO_URL")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME")]

app = FastAPI()
api_router = APIRouter(prefix="/api")

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

# Simple hardcoded credentials (can be moved to env vars)
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "ghiras123")

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(data: LoginRequest):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        token = str(uuid.uuid4())
        return {"token": token, "username": data.username}
    raise HTTPException(status_code=401, detail="اسم المستخدم أو كلمة المرور غير صحيحة")

# ==================== Pydantic Models ====================

class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    points: int = 0
    phone: Optional[str] = None
    supervisor: Optional[str] = None
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    supervisor: Optional[str] = None

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    supervisor: Optional[str] = None

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

class TaskCreate(BaseModel):
    group: str
    description: str
    points: int = 0

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
    week: int
    reason: str = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class LeagueStarCreate(BaseModel):
    student_id: str
    student_name: str
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

# ==================== Student Endpoints ====================

@api_router.get("/students", response_model=List[Student])
async def get_students():
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for s in students:
        if isinstance(s.get("created_at"), str):
            s["created_at"] = datetime.fromisoformat(s["created_at"])
    students.sort(key=lambda x: x["points"], reverse=True)
    return students

@api_router.post("/students", response_model=Student)
async def create_student(data: StudentCreate):
    student = Student(**data.model_dump())
    doc = student.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.students.insert_one(doc)
    return student

@api_router.get("/students/{student_id}/profile")
async def get_student_profile(student_id: str):
    # Get all students to calculate rank
    all_students = await db.students.find({}, {"_id": 0}).to_list(1000)
    all_students.sort(key=lambda x: x.get("points", 0), reverse=True)
    
    # Find student
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="غير موجود")
    
    # Calculate rank (1-based index)
    rank = None
    for i, s in enumerate(all_students):
        if s.get("id") == student_id:
            rank = i + 1
            break
    
    return {
        "student": student,
        "rank": rank,
        "total_students": len(all_students)
    }

@api_router.put("/students/{student_id}")
async def update_student(student_id: str, data: StudentUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.students.update_one({"id": student_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"success": True}

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
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

@api_router.put("/students/bulk-points")
async def bulk_add_points(data: BulkPointsUpdate):
    students = await db.students.find({"supervisor": data.group}, {"_id": 0}).to_list(1000)
    
    for student in students:
        await db.students.update_one({"id": student["id"]}, {"$inc": {"points": data.points}})
        log_entry = {
            "id": str(uuid.uuid4()),
            "student_id": student["id"],
            "points": data.points,
            "reason": data.reason,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.points_log.insert_one(log_entry)
    
    return {"success": True, "count": len(students)}

@api_router.post("/students/{student_id}/upload-image")
async def upload_image(student_id: str, file: UploadFile = File(...)):
    content = await file.read()
    image_base64 = base64.b64encode(content).decode()
    
    await db.students.update_one({"id": student_id}, {"$set": {"image_url": f"data:image/{file.content_type};base64,{image_base64}"}})
    return {"success": True}

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
    await db.groups.update_one({"id": group_id}, {"$set": {"name": data.name}})
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
    for t in tasks:
        if isinstance(t.get("created_at"), str):
            t["created_at"] = datetime.fromisoformat(t["created_at"])
        # Migrate old tasks: populate claimed_by from claims array if missing
        if not t.get("claimed_by") and t.get("claims"):
            claims = t["claims"]
            if len(claims) > 0:
                last_claimer = claims[-1]
                t["claimed_by"] = last_claimer
                # Get student name
                student = await db.students.find_one({"id": last_claimer})
                t["claimed_by_name"] = student.get("name", "Unknown") if student else "Unknown"
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
                    "claimed_by_name": student_name
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
    star = LeagueStar(**data.model_dump(), week=week)
    doc = star.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.league_star.insert_one(doc)
    return star

@api_router.delete("/league-star/{star_id}")
async def delete_league_star(star_id: str):
    result = await db.league_star.delete_one({"id": star_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="غير موجود")
    return {"deleted": True}

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

# ==================== Health Check ====================

@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

# ==================== App Setup ===== ===============

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)

@app.on_event("shutdown")
async def shutdown():
    client.close()
