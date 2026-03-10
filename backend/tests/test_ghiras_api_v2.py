"""
Ghiras Club API Tests v2 - Testing Auth, Tasks, League, Star, Viewer Links, Bulk Points, Points Log
Test file for Student Rewards Management System (نادي غِراس)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://ramadan-quiz-13.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "ghiras2026"
ADMIN_PASSWORD = "ghras2026"

# Known test data
TEST_STUDENT_ID = "6cdb4968-edea-4c14-b4ce-b5189df6360c"
TEST_VIEWER_TOKEN = "19ec7fd5"

class TestHealthAndBasics:
    """Basic API health tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ API root returns: {data['message']}")
    
    def test_get_students_public(self):
        """Test public students endpoint (no auth required)"""
        response = requests.get(f"{BASE_URL}/api/students")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} students")
    
    def test_get_supervisors(self):
        """Test public supervisors list"""
        response = requests.get(f"{BASE_URL}/api/supervisors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got supervisors: {data}")


class TestAuthentication:
    """Authentication API tests"""
    
    def test_login_success(self):
        """Test successful login with correct credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["username"] == ADMIN_USERNAME
        assert len(data["token"]) > 0
        print(f"✓ Login successful, got token")
    
    def test_login_wrong_credentials(self):
        """Test login with wrong credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wrong_user",
            "password": "wrong_pass"
        })
        assert response.status_code == 401
        print("✓ Wrong credentials correctly rejected with 401")
    
    def test_verify_token(self):
        """Test token verification endpoint"""
        # First get token
        login_res = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": ADMIN_USERNAME,
            "password": ADMIN_PASSWORD
        })
        token = login_res.json()["token"]
        
        # Verify token
        verify_res = requests.get(f"{BASE_URL}/api/auth/verify", headers={
            "Authorization": f"Bearer {token}"
        })
        assert verify_res.status_code == 200
        data = verify_res.json()
        assert data["valid"] == True
        assert data["username"] == ADMIN_USERNAME
        print("✓ Token verification working")
    
    def test_verify_invalid_token(self):
        """Test invalid token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/verify", headers={
            "Authorization": "Bearer invalid_token_here"
        })
        assert response.status_code == 401
        print("✓ Invalid token correctly rejected")
    
    def test_verify_no_token(self):
        """Test missing token returns 401"""
        response = requests.get(f"{BASE_URL}/api/auth/verify")
        assert response.status_code == 401
        print("✓ Missing token correctly rejected")


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for tests"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": ADMIN_USERNAME,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["token"]
    pytest.skip("Authentication failed")


@pytest.fixture
def headers(auth_token):
    """Get headers with auth token"""
    return {"Authorization": f"Bearer {auth_token}"}


class TestProtectedRoutes:
    """Test that protected routes require authentication"""
    
    def test_create_student_requires_auth(self):
        """POST /api/students requires auth"""
        response = requests.post(f"{BASE_URL}/api/students", json={
            "name": "Test Student",
            "phone": "0500000000",
            "supervisor": "Test"
        })
        assert response.status_code == 401
        print("✓ Create student requires auth")
    
    def test_update_student_requires_auth(self):
        """PUT /api/students/{id} requires auth"""
        response = requests.put(f"{BASE_URL}/api/students/{TEST_STUDENT_ID}", json={
            "name": "Updated Name"
        })
        assert response.status_code == 401
        print("✓ Update student requires auth")
    
    def test_delete_student_requires_auth(self):
        """DELETE /api/students/{id} requires auth"""
        response = requests.delete(f"{BASE_URL}/api/students/some-id")
        assert response.status_code == 401
        print("✓ Delete student requires auth")
    
    def test_update_points_requires_auth(self):
        """PUT /api/students/{id}/points requires auth"""
        response = requests.put(f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/points", json={
            "points": 10,
            "reason": "Test"
        })
        assert response.status_code == 401
        print("✓ Update points requires auth")


class TestStudentsCRUD:
    """Students CRUD operations with auth"""
    
    def test_create_update_delete_student(self, headers):
        """Full CRUD cycle for student"""
        # CREATE
        create_data = {
            "name": "TEST_طالب_اختبار",
            "phone": "0551234567",
            "supervisor": "أبو غيث"
        }
        create_res = requests.post(f"{BASE_URL}/api/students", json=create_data, headers=headers)
        assert create_res.status_code == 200
        student = create_res.json()
        assert student["name"] == create_data["name"]
        assert "id" in student
        student_id = student["id"]
        print(f"✓ Created student: {student['name']} ({student_id})")
        
        # READ/GET - verify persistence
        get_res = requests.get(f"{BASE_URL}/api/students/{student_id}/profile")
        assert get_res.status_code == 200
        profile = get_res.json()
        assert profile["student"]["name"] == create_data["name"]
        print("✓ Student data persisted and retrieved")
        
        # UPDATE
        update_res = requests.put(f"{BASE_URL}/api/students/{student_id}", json={
            "name": "TEST_طالب_محدث"
        }, headers=headers)
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["name"] == "TEST_طالب_محدث"
        print("✓ Student updated")
        
        # DELETE
        delete_res = requests.delete(f"{BASE_URL}/api/students/{student_id}", headers=headers)
        assert delete_res.status_code == 200
        
        # Verify deletion
        verify_res = requests.get(f"{BASE_URL}/api/students/{student_id}/profile")
        assert verify_res.status_code == 404
        print("✓ Student deleted and confirmed removed")


class TestBulkPoints:
    """Bulk points update tests"""
    
    def test_bulk_points_requires_auth(self):
        """Bulk points requires authentication"""
        response = requests.put(f"{BASE_URL}/api/students/bulk-points", json={
            "group": "أبو غيث",
            "points": 10,
            "reason": "Test"
        })
        assert response.status_code == 401
        print("✓ Bulk points requires auth")
    
    def test_bulk_points_invalid_group(self, headers):
        """Bulk points with invalid group returns 404"""
        response = requests.put(f"{BASE_URL}/api/students/bulk-points", json={
            "group": "مجموعة_غير_موجودة_12345",
            "points": 10,
            "reason": "Test"
        }, headers=headers)
        assert response.status_code == 404
        print("✓ Invalid group returns 404")
    
    def test_bulk_points_valid_group(self, headers):
        """Bulk points with valid group works"""
        # Get supervisors
        sup_res = requests.get(f"{BASE_URL}/api/supervisors")
        supervisors = sup_res.json()
        if not supervisors:
            pytest.skip("No supervisors found")
        
        group = supervisors[0]
        response = requests.put(f"{BASE_URL}/api/students/bulk-points", json={
            "group": group,
            "points": 1,  # Small amount
            "reason": "اختبار نقاط جماعية"
        }, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["count"] > 0
        print(f"✓ Bulk points added to {data['count']} students in group '{group}'")


class TestPointsLog:
    """Points log API tests"""
    
    def test_get_points_log_public(self):
        """Points log is publicly accessible"""
        response = requests.get(f"{BASE_URL}/api/points-log/{TEST_STUDENT_ID}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} points log entries")
    
    def test_points_log_after_update(self, headers):
        """Points log is updated after point change"""
        # Add points
        requests.put(f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/points", json={
            "points": 5,
            "reason": "اختبار_سجل_النقاط"
        }, headers=headers)
        
        # Get log
        log_res = requests.get(f"{BASE_URL}/api/points-log/{TEST_STUDENT_ID}")
        assert log_res.status_code == 200
        logs = log_res.json()
        
        # Check latest entry
        assert len(logs) > 0
        latest = logs[0]
        assert latest["reason"] == "اختبار_سجل_النقاط"
        print("✓ Points log updated with new entry")


class TestTasks:
    """Weekly tasks system tests"""
    
    def test_get_tasks_public(self):
        """GET /api/tasks is public"""
        response = requests.get(f"{BASE_URL}/api/tasks")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} tasks")
    
    def test_create_task_requires_auth(self):
        """POST /api/tasks requires auth"""
        response = requests.post(f"{BASE_URL}/api/tasks", json={
            "group": "أبو غيث",
            "description": "مهمة اختبار",
            "points": 10
        })
        assert response.status_code == 401
        print("✓ Create task requires auth")
    
    def test_task_lifecycle(self, headers):
        """Full task lifecycle: create, claim, complete, delete"""
        # Get a valid group
        sup_res = requests.get(f"{BASE_URL}/api/supervisors")
        supervisors = sup_res.json()
        group = supervisors[0] if supervisors else "أبو غيث"
        
        # CREATE task
        task_data = {
            "group": group,
            "description": f"TEST_مهمة_اختبار_{uuid.uuid4().hex[:6]}",
            "points": 15
        }
        create_res = requests.post(f"{BASE_URL}/api/tasks", json=task_data, headers=headers)
        assert create_res.status_code == 200
        task = create_res.json()
        assert task["description"] == task_data["description"]
        assert task["points"] == 15
        assert task["claimed_by"] is None
        task_id = task["id"]
        print(f"✓ Task created: {task_id}")
        
        # GET tasks to verify
        tasks_res = requests.get(f"{BASE_URL}/api/tasks")
        tasks = tasks_res.json()
        task_found = any(t["id"] == task_id for t in tasks)
        assert task_found, "Created task not found in list"
        print("✓ Task appears in task list")
        
        # CLAIM task (by student - no auth required)
        claim_res = requests.post(f"{BASE_URL}/api/tasks/{task_id}/claim/{TEST_STUDENT_ID}")
        assert claim_res.status_code == 200
        print("✓ Task claimed by student")
        
        # Try to claim again (should fail)
        claim_again_res = requests.post(f"{BASE_URL}/api/tasks/{task_id}/claim/{TEST_STUDENT_ID}")
        assert claim_again_res.status_code == 400
        print("✓ Double claim prevented")
        
        # COMPLETE task (requires auth)
        complete_res = requests.post(f"{BASE_URL}/api/tasks/{task_id}/complete", headers=headers)
        assert complete_res.status_code == 200
        print("✓ Task completed, points added")
        
        # Try complete again (should fail)
        complete_again_res = requests.post(f"{BASE_URL}/api/tasks/{task_id}/complete", headers=headers)
        assert complete_again_res.status_code == 400
        print("✓ Double complete prevented")
        
        # DELETE task
        delete_res = requests.delete(f"{BASE_URL}/api/tasks/{task_id}", headers=headers)
        assert delete_res.status_code == 200
        print("✓ Task deleted")
    
    def test_complete_task_requires_auth(self):
        """POST /api/tasks/{id}/complete requires auth"""
        response = requests.post(f"{BASE_URL}/api/tasks/some-task-id/complete")
        assert response.status_code == 401
        print("✓ Complete task requires auth")


class TestFootballLeague:
    """Football league matches and standings tests"""
    
    def test_get_matches_public(self):
        """GET /api/matches is public"""
        response = requests.get(f"{BASE_URL}/api/matches")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} matches")
    
    def test_get_standings_public(self):
        """GET /api/league-standings is public"""
        response = requests.get(f"{BASE_URL}/api/league-standings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got standings for {len(data)} teams")
    
    def test_create_match_requires_auth(self):
        """POST /api/matches requires auth"""
        response = requests.post(f"{BASE_URL}/api/matches", json={
            "team1": "أبو غيث",
            "team2": "أنس السعدي",
            "score1": 1,
            "score2": 0
        })
        assert response.status_code == 401
        print("✓ Create match requires auth")
    
    def test_match_lifecycle(self, headers):
        """Create match, verify standings, delete"""
        # Get teams
        sup_res = requests.get(f"{BASE_URL}/api/supervisors")
        supervisors = sup_res.json()
        if len(supervisors) < 2:
            pytest.skip("Need at least 2 teams")
        
        team1, team2 = supervisors[0], supervisors[1]
        
        # CREATE match
        match_res = requests.post(f"{BASE_URL}/api/matches", json={
            "team1": team1,
            "team2": team2,
            "score1": 2,
            "score2": 1
        }, headers=headers)
        assert match_res.status_code == 200
        match = match_res.json()
        match_id = match["id"]
        print(f"✓ Match created: {team1} 2-1 {team2}")
        
        # Verify standings updated
        standings_res = requests.get(f"{BASE_URL}/api/league-standings")
        standings = standings_res.json()
        team1_standing = next((s for s in standings if s["team"] == team1), None)
        assert team1_standing is not None
        print(f"✓ Standings show {team1}: {team1_standing['points']} pts")
        
        # DELETE match
        delete_res = requests.delete(f"{BASE_URL}/api/matches/{match_id}", headers=headers)
        assert delete_res.status_code == 200
        print("✓ Match deleted")


class TestLeagueStar:
    """League star (player of the week) tests"""
    
    def test_get_league_star_public(self):
        """GET /api/league-star is public"""
        response = requests.get(f"{BASE_URL}/api/league-star")
        assert response.status_code == 200
        # Can be null if no star set
        print("✓ League star endpoint works")
    
    def test_get_all_stars_public(self):
        """GET /api/league-stars is public"""
        response = requests.get(f"{BASE_URL}/api/league-stars")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} league stars history")
    
    def test_create_star_requires_auth(self):
        """POST /api/league-star requires auth"""
        response = requests.post(f"{BASE_URL}/api/league-star", json={
            "student_name": "Test Star",
            "reason": "Test reason"
        })
        assert response.status_code == 401
        print("✓ Create star requires auth")
    
    def test_star_lifecycle(self, headers):
        """Create star, verify, delete"""
        # CREATE star
        star_res = requests.post(f"{BASE_URL}/api/league-star", json={
            "student_name": "TEST_نجم_اختبار",
            "reason": "سبب الاختبار"
        }, headers=headers)
        assert star_res.status_code == 200
        star = star_res.json()
        star_id = star["id"]
        assert star["student_name"] == "TEST_نجم_اختبار"
        print("✓ League star created")
        
        # GET current star
        get_res = requests.get(f"{BASE_URL}/api/league-star")
        assert get_res.status_code == 200
        current = get_res.json()
        assert current["student_name"] == "TEST_نجم_اختبار"
        print("✓ Current star retrieved")
        
        # DELETE star
        delete_res = requests.delete(f"{BASE_URL}/api/league-star/{star_id}", headers=headers)
        assert delete_res.status_code == 200
        print("✓ Star deleted")


class TestViewerLinks:
    """Viewer links for sub-supervisors tests"""
    
    def test_get_viewer_links_requires_auth(self):
        """GET /api/viewer-links requires auth"""
        response = requests.get(f"{BASE_URL}/api/viewer-links")
        assert response.status_code == 401
        print("✓ Get viewer links requires auth")
    
    def test_create_viewer_link_requires_auth(self):
        """POST /api/viewer-links requires auth"""
        response = requests.post(f"{BASE_URL}/api/viewer-links", json={
            "name": "Test Viewer"
        })
        assert response.status_code == 401
        print("✓ Create viewer link requires auth")
    
    def test_viewer_link_lifecycle(self, headers):
        """Create viewer link, verify, delete"""
        # CREATE link
        create_res = requests.post(f"{BASE_URL}/api/viewer-links", json={
            "name": "TEST_مشرف_اختبار"
        }, headers=headers)
        assert create_res.status_code == 200
        link = create_res.json()
        link_id = link["id"]
        link_token = link["token"]
        assert link["name"] == "TEST_مشرف_اختبار"
        assert len(link_token) == 8
        print(f"✓ Viewer link created: {link_token}")
        
        # GET links
        get_res = requests.get(f"{BASE_URL}/api/viewer-links", headers=headers)
        assert get_res.status_code == 200
        links = get_res.json()
        link_found = any(l["token"] == link_token for l in links)
        assert link_found
        print("✓ Link found in list")
        
        # VALIDATE link (public)
        validate_res = requests.get(f"{BASE_URL}/api/viewer/{link_token}")
        assert validate_res.status_code == 200
        validate_data = validate_res.json()
        assert validate_data["valid"] == True
        assert validate_data["name"] == "TEST_مشرف_اختبار"
        print("✓ Link validation works")
        
        # DELETE link
        delete_res = requests.delete(f"{BASE_URL}/api/viewer-links/{link_id}", headers=headers)
        assert delete_res.status_code == 200
        
        # Verify deleted
        validate_gone_res = requests.get(f"{BASE_URL}/api/viewer/{link_token}")
        assert validate_gone_res.status_code == 404
        print("✓ Link deleted and confirmed invalid")
    
    def test_validate_existing_viewer_token(self):
        """Test the pre-created viewer token"""
        response = requests.get(f"{BASE_URL}/api/viewer/{TEST_VIEWER_TOKEN}")
        # If the token exists, it should return 200
        if response.status_code == 200:
            data = response.json()
            assert data["valid"] == True
            print(f"✓ Existing viewer token works: {data['name']}")
        else:
            print(f"⚠ Test viewer token {TEST_VIEWER_TOKEN} not found (may have been deleted)")
    
    def test_invalid_viewer_token(self):
        """Invalid viewer token returns 404"""
        response = requests.get(f"{BASE_URL}/api/viewer/invalid123")
        assert response.status_code == 404
        print("✓ Invalid token correctly returns 404")


class TestChallenges:
    """Challenges API tests"""
    
    def test_get_challenges_public(self):
        """GET /api/challenges is public"""
        response = requests.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} challenges")
    
    def test_get_active_challenges_public(self):
        """GET /api/challenges/active is public"""
        response = requests.get(f"{BASE_URL}/api/challenges/active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} active challenges")


class TestStudentProfile:
    """Student profile and public page tests"""
    
    def test_get_student_profile_public(self):
        """GET /api/students/{id}/profile is public"""
        response = requests.get(f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/profile")
        assert response.status_code == 200
        data = response.json()
        assert "student" in data
        assert "rank" in data
        assert "total_students" in data
        print(f"✓ Student profile: {data['student']['name']}, rank {data['rank']}/{data['total_students']}")
    
    def test_nonexistent_student_profile(self):
        """Non-existent student returns 404"""
        response = requests.get(f"{BASE_URL}/api/students/non-existent-id-12345/profile")
        assert response.status_code == 404
        print("✓ Non-existent student returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
