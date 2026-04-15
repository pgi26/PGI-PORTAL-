from flask import Flask, render_template, request, jsonify, session
import os
import bcrypt
import secrets
import smtplib
from email.mime.text import MIMEText
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
from werkzeug.utils import secure_filename
from supabase import create_client
import time

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY")

app.config['SESSION_COOKIE_SAMESITE'] = "Lax"
app.config['SESSION_COOKIE_SECURE'] = True

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

# ------------------ SUPABASE CONFIG ------------------ #

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ------------------------------------------------------ #

# Test DB connection
try:
    connection = engine.connect()
    print("✅ Database connected successfully!")
except Exception as e:
    print("❌ Database connection failed:", e)


# ------------------ PAGE ROUTES ------------------ #

@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')


@app.route('/student_dashboard.html')
def student_dashboard():
    return render_template('student_dashboard.html')


@app.route('/company_dashboard.html')
def company_dashboard():
    return render_template('company_dashboard.html')


@app.route('/domain.html')
def domain():
    return render_template('domain.html')


@app.route('/assessment.html')
def assessment():
    return render_template('assessment.html')

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({"status": "success"})


@app.route('/reset_password/<token>')
def reset_password_page(token):
    return render_template("reset_password.html", token=token)


# ------------------ STUDENT REGISTER ------------------ #

@app.route('/api/student/register', methods=['POST'])
def student_register():

    data = request.json

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    hashed_password = bcrypt.hashpw(
        password.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

    try:
        with engine.connect() as conn:
            conn.execute(
                text("""
                INSERT INTO students (name,email,password)
                VALUES (:name,:email,:password)
                """),
                {
                    "name": name,
                    "email": email,
                    "password": hashed_password
                }
            )
            conn.commit()

        return jsonify({"status": "success", "message": "Student registered successfully"})

    except Exception as e:
        print("Register error:", e)
        return jsonify({"status": "error", "message": "Registration failed"})


# ------------------ STUDENT LOGIN ------------------ #

@app.route('/api/student/login', methods=['POST'])
def student_login():

    data = request.json

    email = data.get("email")
    password = data.get("password")

    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM students WHERE email=:email"),
            {"email": email}
        )

        student = result.fetchone()

    if student and bcrypt.checkpw(password.encode(), student.password.encode()):
        session["student"] = email
        session.permanent = True

        return jsonify({
            "status": "success",
            "message": "Login successful"
        })

    return jsonify({
        "status": "error",
        "message": "Invalid credentials"
    })


# ------------------ COMPANY LOGIN ------------------ #

@app.route('/api/company/login', methods=['POST'])
def company_login():

    data = request.json

    email = data.get("email")
    password = data.get("password")

    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT * FROM companies WHERE email=:email"),
            {"email": email}
        )

        company = result.fetchone()

    if company and password == company.password:
        session["company"] = email

        return jsonify({
            "status": "success",
            "message": "Company login successful"
        })

    return jsonify({
        "status": "error",
        "message": "Invalid credentials"
    })


# ------------------ PROFILE UPDATE API ------------------ #

@app.route('/api/update_profile', methods=['POST'])
def update_profile():

    try:

        email = session.get("student")

        if not email:
            return jsonify({"status": "error", "message": "User not logged in"})

        full_name = request.form.get("full_name")
        mobile = request.form.get("mobile")
        college_name = request.form.get("college_name")
        degree = request.form.get("degree")
        age = request.form.get("age")

        resume = request.files.get("resume")
        photo = request.files.get("photo")

        # Get student id
        with engine.connect() as conn:

            student = conn.execute(
                text("SELECT id FROM students WHERE email=:email"),
                {"email": email}
            ).fetchone()

            if not student:
                return jsonify({"status": "error", "message": "Student not found"})

            student_id = student.id

        resume_url = None
        photo_url = None

        # Upload Resume
        if resume and resume.filename != "":

            resume_filename = f"{student_id}_resume.pdf"

            supabase.storage.from_("Resumes").upload(
                resume_filename,
                resume.read(),
                file_options={"content-type": "application/pdf", "upsert": "true"}
            )

            resume_url = f"{SUPABASE_URL}/storage/v1/object/public/Resumes/{resume_filename}"

        # Upload Photo
        if photo and photo.filename != "":

            photo_filename = f"{student_id}_photo_{int(time.time())}_{secure_filename(photo.filename)}"

            supabase.storage.from_("Photos").upload(
                photo_filename,
                photo.read()
            )

            photo_url = f"{SUPABASE_URL}/storage/v1/object/public/Photos/{photo_filename}"

        with engine.connect() as conn:

            existing_profile = conn.execute(
                text("""
                SELECT id FROM student_profiles
                WHERE student_id=:student_id
                """),
                {"student_id": student_id}
            ).fetchone()

            if existing_profile:

                conn.execute(
                    text("""
                    UPDATE student_profiles
                    SET
                        full_name=:full_name,
                        mobile=:mobile,
                        college_name=:college_name,
                        degree=:degree,
                        age=:age,
                        resume_url=COALESCE(:resume_url, resume_url),
                        photo_url=COALESCE(:photo_url, photo_url)
                    WHERE student_id=:student_id
                    """),
                    {
                        "student_id": student_id,
                        "full_name": full_name,
                        "mobile": mobile,
                        "college_name": college_name,
                        "degree": degree,
                        "age": age,
                        "resume_url": resume_url,
                        "photo_url": photo_url
                    }
                )

            else:

                conn.execute(
                    text("""
                    INSERT INTO student_profiles
                    (student_id, full_name, mobile, college_name, degree, age, resume_url, photo_url)
                    VALUES
                    (:student_id, :full_name, :mobile, :college_name, :degree, :age, :resume_url, :photo_url)
                    """),
                    {
                        "student_id": student_id,
                        "full_name": full_name,
                        "mobile": mobile,
                        "college_name": college_name,
                        "degree": degree,
                        "age": age,
                        "resume_url": resume_url,
                        "photo_url": photo_url
                    }
                )

            conn.commit()

        return jsonify({
            "status": "success",
            "message": "Profile updated successfully"
        })

    except Exception as e:

        print("Profile update error:", e)

        return jsonify({
            "status": "error",
            "message": "Profile update failed"
        })
# ------------------ FORGOT PASSWORD ------------------ #

@app.route('/api/forgot_password', methods=['POST'])
def forgot_password():

    data = request.json
    email = data.get("email")

    token = secrets.token_urlsafe(32)

    try:
        with engine.connect() as conn:

            student = conn.execute(
                text("SELECT * FROM students WHERE email=:email"),
                {"email": email}
            ).fetchone()

            if not student:
                return jsonify({"status": "error", "message": "Email not found"})

            conn.execute(
                text("""
                UPDATE students
                SET reset_token=:token,
                    token_created_at=NOW()
                WHERE email=:email
                """),
                {"token": token, "email": email}
            )

            conn.commit()

        reset_link = f"http://localhost:5000/reset_password/{token}"

        send_reset_email(email, reset_link)

        return jsonify({
            "status": "success",
            "message": "Reset email sent"
        })

    except Exception as e:
        print("Forgot password error:", e)
        return jsonify({"status": "error"})


# ------------------ RESET PASSWORD ------------------ #

@app.route('/api/reset_password', methods=['POST'])
def reset_password():

    data = request.json
    token = data.get("token")
    new_password = data.get("password")

    hashed_password = bcrypt.hashpw(
        new_password.encode(),
        bcrypt.gensalt()
    ).decode()

    try:
        with engine.connect() as conn:

            student = conn.execute(
                text("""
                SELECT * FROM students
                WHERE reset_token=:token
                AND token_created_at > NOW() - INTERVAL '15 minutes'
                """),
                {"token": token}
            ).fetchone()

            if not student:
                return jsonify({"status": "error", "message": "Token expired"})

            conn.execute(
                text("""
                UPDATE students
                SET password=:password,
                    reset_token=NULL
                WHERE reset_token=:token
                """),
                {"password": hashed_password, "token": token}
            )

            conn.commit()

        return jsonify({"status": "success"})

    except Exception as e:
        print("Reset error:", e)
        return jsonify({"status": "error"})


# ------------------ EMAIL FUNCTION ------------------ #

def send_reset_email(email, reset_link):

    sender_email = os.getenv("EMAIL_USER")
    sender_password = os.getenv("EMAIL_PASS")

    msg = MIMEText(f"""
Hello,

Click the link below to reset your password.

{reset_link}

This link expires in 15 minutes.
""")

    msg['Subject'] = "PGI Job Portal Password Reset"
    msg['From'] = sender_email
    msg['To'] = email

    try:

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()

        print("✅ Reset email sent")

    except Exception as e:
        print("❌ Email sending failed:", e)


# ------------------ ASSESSMENT API ------------------ #

@app.route('/api/submit_assessment', methods=['POST'])
def submit_assessment():

    data = request.json
    print("Received data:", data)

    email = session.get("student")
    domain = data.get('domain')
    test_name = data.get('test_name')
    score = data.get('score')
    completed = data.get('completed', True)
    status = data.get('status', 'failed')

    if not email or score is None:
        return jsonify({
            "status": "error",
            "message": "Invalid request data"
        })

    # Validate score
    if score < 0 or score > 100:
        return jsonify({
            "status": "error",
            "message": "Invalid score value"
        })

    try:
        with engine.connect() as conn:

            # Get student id
            student = conn.execute(
                text("SELECT id, name FROM students WHERE email=:email"),
                {"email": email}
            ).fetchone()

            if not student:
                return jsonify({
                    "status": "error",
                    "message": "Student not found"
                })

            student_id = student.id

            # Check if student already completed this test
            existing = conn.execute(
                text("""
                SELECT id
                FROM assessment
                WHERE student_id=:student_id
                AND domain=:domain
                AND test_name=:test_name
                AND completed=true
                """),
                {
                    "student_id": student_id,
                    "domain": domain,
                    "test_name": test_name
                }
            ).fetchone()

            if existing:
                return jsonify({
                    "status": "error",
                    "message": "You have already completed this assessment"
                })

            # Insert assessment result
            print("Saving assessment:", student_id, domain, test_name, score, status)
            conn.execute(
                text("""
                INSERT INTO assessment
                (student_id, student_name, domain, test_name, score, completed, status)
                VALUES
                (:student_id, :student_name, :domain, :test_name, :score, :completed, :status)
                """),
                {
                    "student_id": student_id,
                    "student_name": student.name,
                    "domain": domain,
                    "test_name": test_name,
                    "score": score,
                    "completed": completed,
                    "status": status
                }
            )

            conn.commit()

        print(f"✅ Score stored for {email}: {score}%")

        return jsonify({
            "status": "success",
            "message": "Assessment stored successfully"
        })

    except Exception as e:
        print("❌ Database error:", e)

        return jsonify({
            "status": "error",
            "message": "Failed to store assessment"
        })
# ------------------ CHECK ASSESSMENT STATUS ------------------ #

@app.route('/api/check_assessment_status', methods=['POST'])
def check_assessment_status():

    data = request.json

    email = session.get("student")
    domain = data.get("domain")

    try:

        with engine.connect() as conn:

            student = conn.execute(
                text("SELECT id FROM students WHERE email=:email"),
                {"email": email}
            ).fetchone()

            if not student:
                return jsonify({"completed_tests": []})

            student_id = student.id

            results = conn.execute(
                text("""
                SELECT test_name
                FROM assessment
                WHERE student_id=:student_id
                AND domain=:domain
                AND completed=true
                """),
                {
                    "student_id": student_id,
                    "domain": domain
                }
            ).fetchall()

            completed_tests = [row.test_name for row in results]

        return jsonify({
            "completed_tests": completed_tests
        })

    except Exception as e:

        print("Status check error:", e)

        return jsonify({
            "completed_tests": []
        })

@app.route('/api/check_profile_status', methods=['GET'])
def check_profile_status():

    email = session.get("student")

    if not email:
        return jsonify({"profile_completed": False})

    try:
        with engine.connect() as conn:

            student = conn.execute(
                text("SELECT id FROM students WHERE email=:email"),
                {"email": email}
            ).fetchone()

            if not student:
                return jsonify({"profile_completed": False})

            student_id = student.id

            profile = conn.execute(
                text("""
                SELECT id
                FROM student_profiles
                WHERE student_id=:student_id
                """),
                {"student_id": student_id}
            ).fetchone()

            if profile:
                return jsonify({"profile_completed": True})
            else:
                return jsonify({"profile_completed": False})

    except Exception as e:
        print("Profile check error:", e)
        return jsonify({"profile_completed": False})

# ------------------ COMPANY DASHBOARD APIs ------------------ #

@app.route('/api/company/all_students')
def company_all_students():

    try:

        with engine.connect() as conn:

            result = conn.execute(text("""
                SELECT
                    students.name,
                    students.email,
                    COALESCE(MAX(assessment.score),0) AS score
                FROM students
                LEFT JOIN assessment
                    ON students.id = assessment.student_id
                GROUP BY students.name, students.email
            """)).fetchall()

            students = []

            for row in result:

                students.append({
                    "name": row.name,
                    "email": row.email,
                    "score": row.score
                })

        return jsonify({
            "status": "success",
            "students": students
        })

    except Exception as e:

        print("Company students error:", e)

        return jsonify({
            "status": "error",
            "students": []
        })




@app.route('/api/company/eligible_students')
def company_eligible_students():

    try:

        with engine.connect() as conn:

            result = conn.execute(text("""
                SELECT
                    students.name,
                    students.email,
                    MAX(assessment.score) AS score
                FROM students
                JOIN assessment
                    ON students.id = assessment.student_id
                GROUP BY students.name, students.email
                HAVING MAX(assessment.score) >= 60
            """)).fetchall()

            students = []

            for row in result:

                students.append({
                    "name": row.name,
                    "email": row.email,
                    "score": row.score
                })

        return jsonify({
            "status": "success",
            "students": students
        })

    except Exception as e:

        print("Eligible students error:", e)

        return jsonify({
            "status": "error",
            "students": []
        })

@app.route('/api/company/search_students')
def search_students():

    query = request.args.get("q")

    try:
        with engine.connect() as conn:

            result = conn.execute(text("""
                SELECT
                    students.name,
                    students.email,
                    student_profiles.college_name,
                    student_profiles.degree
                FROM students
                JOIN student_profiles
                    ON students.id = student_profiles.student_id
                WHERE
                    students.name ILIKE :q
                    OR student_profiles.college_name ILIKE :q
                    OR student_profiles.degree ILIKE :q
            """), {"q": f"%{query}%"}).fetchall()

            students = []

            for row in result:
                students.append({
                    "name": row.name,
                    "email": row.email,
                    "college": row.college_name,
                    "degree": row.degree
                })

        return jsonify({"students": students})

    except Exception as e:
        print("Search error:", e)
        return jsonify({"students": []})

# ------------------ COMPANY STUDENT PROFILES ------------------ #

@app.route('/api/company/student_profiles')
def company_student_profiles():

    try:

        with engine.connect() as conn:

            result = conn.execute(text("""
                SELECT
                    students.name,
                    students.email,
                    student_profiles.mobile,
                    student_profiles.college_name,
                    student_profiles.degree,
                    student_profiles.age,
                    student_profiles.resume_url
                FROM students
                JOIN student_profiles
                    ON students.id = student_profiles.student_id
            """)).fetchall()

            profiles = []

            for row in result:

                profiles.append({
                    "name": row.name,
                    "email": row.email,
                    "mobile": row.mobile,
                    "college": row.college_name,
                    "degree": row.degree,
                    "age": row.age,
                    "resume_url": row.resume_url
                })

        return jsonify({
            "status": "success",
            "profiles": profiles
        })

    except Exception as e:

        print("Profile fetch error:", e)

        return jsonify({
            "status": "error",
            "profiles": []
        })

# ------------------ INTERVIEW CANDIDATES ------------------ #

@app.route('/api/company/interview_candidates')
def interview_candidates():

    try:

        with engine.connect() as conn:

            result = conn.execute(text("""
                SELECT
                    students.id,
                    students.name,
                    students.email,
                    MAX(assessment.score) AS score
                FROM students
                JOIN assessment
                    ON students.id = assessment.student_id
                GROUP BY students.id, students.name, students.email
                HAVING MAX(assessment.score) >= 60
            """)).fetchall()

            students = []

            for row in result:

                students.append({
                    "id": row.id,
                    "name": row.name,
                    "email": row.email,
                    "score": row.score
                })

        return jsonify({
            "students": students
        })

    except Exception as e:

        print("Interview candidates error:", e)

        return jsonify({
            "students": []
        })

# ------------------ SCHEDULE INTERVIEW ------------------ #

@app.route('/api/company/schedule_interview', methods=['POST'])
def schedule_interview():

    data = request.json

    student_email = data.get("student_email")
    interview_date = data.get("date")
    interview_time = data.get("time")

    company_email = session.get("company")

    try:

        with engine.connect() as conn:

            # get company name
            company = conn.execute(
                text("SELECT company_name FROM companies WHERE email=:email"),
                {"email": company_email}
            ).fetchone()

            company_name = company.company_name

            # get student id
            student = conn.execute(
                text("SELECT id FROM students WHERE email=:email"),
                {"email": student_email}
            ).fetchone()

            student_id = student.id

            # insert interview
            conn.execute(text("""
                INSERT INTO interviews
                (student_id, student_email, company_email, company_name, interview_date, interview_time, status)
                VALUES
                (:student_id, :student_email, :company_email, :company_name, :date, :time, 'scheduled')
            """),{
                "student_id": student_id,
                "student_email": student_email,
                "company_email": company_email,
                "company_name": company_name,
                "date": interview_date,
                "time": interview_time
            })

            conn.commit()

        return jsonify({"status":"success"})

    except Exception as e:

        print("Interview scheduling error:", e)

        return jsonify({"status":"error"})
# ------------------ GET SCHEDULED INTERVIEWS ------------------ #

@app.route('/api/company/interviews')
def get_company_interviews():

    company_email = session.get("company")

    try:

        with engine.connect() as conn:

            result = conn.execute(text("""
                SELECT
                    student_email,
                    company_name,
                    interview_date,
                    interview_time,
                    status
                FROM interviews
                WHERE company_email=:email
                ORDER BY interview_date
            """),{
                "email": company_email
            }).fetchall()

            interviews = []

            for row in result:

                interviews.append({
                    "student_email": row.student_email,
                    "company_name": row.company_name,
                    "date": str(row.interview_date),
                    "time": str(row.interview_time),
                    "status": row.status
                })

        return jsonify({
            "interviews": interviews
        })

    except Exception as e:

        print("Interview fetch error:", e)

        return jsonify({
            "interviews": []
        })

# ------------------ RUN SERVER ------------------ #

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)