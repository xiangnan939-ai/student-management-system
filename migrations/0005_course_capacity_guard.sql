CREATE TRIGGER IF NOT EXISTS prevent_course_over_capacity
BEFORE INSERT ON student_courses
WHEN (
  SELECT COUNT(*)
  FROM student_courses
  WHERE course_id = NEW.course_id
) >= (
  SELECT capacity
  FROM courses
  WHERE id = NEW.course_id
)
BEGIN
  SELECT RAISE(ABORT, 'COURSE_FULL');
END;
