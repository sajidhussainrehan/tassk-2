"""
Backend API tests for Ghiras Club Student Points Management System
Tests for: Students CRUD, Points management, Ramadan Quiz, Challenges, Supervisors
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data constants
TEST_STUDENT_ID = "6cdb4968-edea-4c14-b4ce-b5189df6360c"
TEST_PREFIX = "TEST_"


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestRootAPI:
    """API root endpoint test"""
    
    def test_api_root(self, api_client):
        """Test API root returns welcome message"""
        response = api_client.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "نادي غِراس" in data["message"]
        print(f"✓ API root accessible: {data['message']}")


class TestStudentsAPI:
    """Students CRUD operations"""
    
    def test_get_all_students(self, api_client):
        """Test getting all students"""
        response = api_client.get(f"{BASE_URL}/api/students")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0  # Should have students in DB
        
        # Verify sorted by points descending
        for i in range(len(data) - 1):
            assert data[i]["points"] >= data[i + 1]["points"]
        print(f"✓ Got {len(data)} students sorted by points")
    
    def test_get_students_lite_mode(self, api_client):
        """Test lite mode excludes image_url for performance"""
        response = api_client.get(f"{BASE_URL}/api/students?lite=true")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # In lite mode, image_url should be null
        for student in data:
            assert student.get("image_url") is None
        print(f"✓ Lite mode working - no image_url in response")
    
    def test_get_student_profile(self, api_client):
        """Test getting specific student profile with rank"""
        response = api_client.get(f"{BASE_URL}/api/students/{TEST_STUDENT_ID}/profile")
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile structure
        assert "student" in data
        assert "rank" in data
        assert "total_students" in data
        
        student = data["student"]
        assert student["id"] == TEST_STUDENT_ID
        assert "name" in student
        assert "points" in student
        print(f"✓ Student profile: {student['name']}, Rank: {data['rank']}/{data['total_students']}")
    
    def test_get_nonexistent_student(self, api_client):
        """Test getting non-existent student returns 404"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/students/{fake_id}/profile")
        assert response.status_code == 404
        print("✓ Non-existent student returns 404")
    
    def test_create_student(self, api_client):
        """Test creating a new student"""
        test_name = f"{TEST_PREFIX}Student_{uuid.uuid4().hex[:8]}"
        payload = {
            "name": test_name,
            "phone": "0500000000",
            "supervisor": "Test Supervisor"
        }
        
        response = api_client.post(f"{BASE_URL}/api/students", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["name"] == test_name
        assert data["points"] == 0
        assert "id" in data
        
        # Cleanup - delete test student
        cleanup_response = api_client.delete(f"{BASE_URL}/api/students/{data['id']}")
        assert cleanup_response.status_code == 200
        print(f"✓ Created and cleaned up test student: {test_name}")
    
    def test_update_student(self, api_client):
        """Test updating student information"""
        # First create a test student
        test_name = f"{TEST_PREFIX}Update_{uuid.uuid4().hex[:8]}"
        create_response = api_client.post(f"{BASE_URL}/api/students", json={
            "name": test_name,
            "phone": "0501111111"
        })
        assert create_response.status_code == 200
        student_id = create_response.json()["id"]
        
        # Update the student
        new_name = f"{TEST_PREFIX}Updated_{uuid.uuid4().hex[:8]}"
        update_response = api_client.put(f"{BASE_URL}/api/students/{student_id}", json={
            "name": new_name,
            "phone": "0502222222"
        })
        assert update_response.status_code == 200
        
        # Verify update persisted
        verify_response = api_client.get(f"{BASE_URL}/api/students/{student_id}/profile")
        assert verify_response.status_code == 200
        assert verify_response.json()["student"]["name"] == new_name
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/students/{student_id}")
        print(f"✓ Student update working")
    
    def test_delete_student(self, api_client):
        """Test deleting a student"""
        # Create test student
        create_response = api_client.post(f"{BASE_URL}/api/students", json={
            "name": f"{TEST_PREFIX}Delete_{uuid.uuid4().hex[:8]}"
        })
        student_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/students/{student_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        verify_response = api_client.get(f"{BASE_URL}/api/students/{student_id}/profile")
        assert verify_response.status_code == 404
        print("✓ Student deletion working")


class TestPointsAPI:
    """Points management tests"""
    
    def test_update_points_positive(self, api_client):
        """Test adding positive points"""
        # Create test student
        create_response = api_client.post(f"{BASE_URL}/api/students", json={
            "name": f"{TEST_PREFIX}Points_{uuid.uuid4().hex[:8]}"
        })
        student_id = create_response.json()["id"]
        initial_points = 0
        
        # Add points
        points_response = api_client.put(f"{BASE_URL}/api/students/{student_id}/points", json={
            "points": 10,
            "reason": "حضور"
        })
        assert points_response.status_code == 200
        assert points_response.json()["points"] == initial_points + 10
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/students/{student_id}")
        print("✓ Positive points update working")
    
    def test_update_points_negative(self, api_client):
        """Test deducting points"""
        # Create test student with some points
        create_response = api_client.post(f"{BASE_URL}/api/students", json={
            "name": f"{TEST_PREFIX}Deduct_{uuid.uuid4().hex[:8]}"
        })
        student_id = create_response.json()["id"]
        
        # Add initial points
        api_client.put(f"{BASE_URL}/api/students/{student_id}/points", json={
            "points": 50,
            "reason": "Initial"
        })
        
        # Deduct points
        points_response = api_client.put(f"{BASE_URL}/api/students/{student_id}/points", json={
            "points": -5,
            "reason": "تأخير"
        })
        assert points_response.status_code == 200
        assert points_response.json()["points"] == 45
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/students/{student_id}")
        print("✓ Negative points deduction working")
    
    def test_mark_attendance(self, api_client):
        """Test attendance marking adds 10 points"""
        # Create test student
        create_response = api_client.post(f"{BASE_URL}/api/students", json={
            "name": f"{TEST_PREFIX}Attendance_{uuid.uuid4().hex[:8]}"
        })
        student_id = create_response.json()["id"]
        
        # Mark attendance
        attendance_response = api_client.put(f"{BASE_URL}/api/students/{student_id}/attendance")
        assert attendance_response.status_code == 200
        assert attendance_response.json()["points"] == 10
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/students/{student_id}")
        print("✓ Attendance marking adds 10 points")


class TestRamadanQuizAPI:
    """Ramadan Quiz API tests"""
    
    def test_get_today_quiz(self, api_client):
        """Test getting today's Ramadan quiz status"""
        response = api_client.get(f"{BASE_URL}/api/ramadan-quiz/today")
        assert response.status_code == 200
        data = response.json()
        
        # Should have status field
        assert "status" in data
        assert data["status"] in ["not_started", "active", "ended", "completed"]
        print(f"✓ Ramadan quiz status: {data['status']}")
    
    def test_get_quiz_status_for_student(self, api_client):
        """Test getting quiz status for specific student"""
        response = api_client.get(f"{BASE_URL}/api/ramadan-quiz/status/{TEST_STUDENT_ID}")
        assert response.status_code == 200
        data = response.json()
        
        assert "status" in data
        assert "total_answered" in data
        print(f"✓ Student quiz status: answered {data['total_answered']} questions")
    
    def test_quiz_status_nonexistent_student(self, api_client):
        """Test quiz status for non-existent student returns 404"""
        fake_id = str(uuid.uuid4())
        response = api_client.get(f"{BASE_URL}/api/ramadan-quiz/status/{fake_id}")
        assert response.status_code == 404
        print("✓ Quiz status for non-existent student returns 404")


class TestChallengesAPI:
    """Challenges API tests"""
    
    def test_get_all_challenges(self, api_client):
        """Test getting all challenges"""
        response = api_client.get(f"{BASE_URL}/api/challenges")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} challenges")
    
    def test_get_active_challenges(self, api_client):
        """Test getting only active challenges"""
        response = api_client.get(f"{BASE_URL}/api/challenges/active")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
        # All returned challenges should be active
        for challenge in data:
            assert challenge["active"] == True
        print(f"✓ Got {len(data)} active challenges")
    
    def test_create_challenge(self, api_client):
        """Test creating a new challenge"""
        payload = {
            "question": f"{TEST_PREFIX}ما هو السؤال الاختباري؟",
            "options": ["خيار 1", "خيار 2", "خيار 3", "خيار 4"],
            "correct_answer": 0,
            "points": 15
        }
        
        response = api_client.post(f"{BASE_URL}/api/challenges", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["question"] == payload["question"]
        assert data["points"] == 15
        assert "id" in data
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/challenges/{data['id']}")
        print("✓ Challenge creation working")
    
    def test_toggle_challenge(self, api_client):
        """Test toggling challenge active status"""
        # Create test challenge
        create_response = api_client.post(f"{BASE_URL}/api/challenges", json={
            "question": f"{TEST_PREFIX}Toggle test",
            "options": ["A", "B", "C", "D"],
            "correct_answer": 1,
            "points": 10
        })
        challenge_id = create_response.json()["id"]
        
        # Toggle (should become inactive)
        toggle_response = api_client.put(f"{BASE_URL}/api/challenges/{challenge_id}/toggle")
        assert toggle_response.status_code == 200
        assert toggle_response.json()["active"] == False
        
        # Toggle again (should become active)
        toggle_response2 = api_client.put(f"{BASE_URL}/api/challenges/{challenge_id}/toggle")
        assert toggle_response2.status_code == 200
        assert toggle_response2.json()["active"] == True
        
        # Cleanup
        api_client.delete(f"{BASE_URL}/api/challenges/{challenge_id}")
        print("✓ Challenge toggle working")
    
    def test_delete_challenge(self, api_client):
        """Test deleting a challenge"""
        # Create test challenge
        create_response = api_client.post(f"{BASE_URL}/api/challenges", json={
            "question": f"{TEST_PREFIX}Delete test",
            "options": ["A", "B", "C", "D"],
            "correct_answer": 2,
            "points": 5
        })
        challenge_id = create_response.json()["id"]
        
        # Delete
        delete_response = api_client.delete(f"{BASE_URL}/api/challenges/{challenge_id}")
        assert delete_response.status_code == 200
        
        # Verify deleted
        get_response = api_client.get(f"{BASE_URL}/api/challenges")
        challenge_ids = [c["id"] for c in get_response.json()]
        assert challenge_id not in challenge_ids
        print("✓ Challenge deletion working")


class TestSupervisorsAPI:
    """Supervisors API tests"""
    
    def test_get_supervisors(self, api_client):
        """Test getting list of supervisors"""
        response = api_client.get(f"{BASE_URL}/api/supervisors")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0  # Should have supervisors
        print(f"✓ Got {len(data)} supervisors: {data}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
