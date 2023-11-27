import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Course, Professor } from 'src/app/shared/interfaces/psql.interface';
import { AddCourseComponent } from './add-course/add-course.component';
import { DeleteCourseComponent } from './delete-course/delete-course.component';
import { ProfessorService } from 'src/app/services/professor.service';
import { SupabaseService } from 'src/app/services/auth.service';
import { Session, User } from '@supabase/supabase-js';
import { SharedService } from 'src/app/services/shared.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
})
export class CoursesComponent {
  course: Course;
  session: Session;
  user: User;
  professor: Professor;
  professorCourses!: Course[];
  fetchedCourses = false;
  fetchedCourse = false;
  currentCourseID = -1;
  currentCourse: Course;

  constructor(
    private dialog: MatDialog,
    private professorService: ProfessorService,
    private sharedService: SharedService,
    private authService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.session = (await this.authService.getSession()) as Session;
      this.user = this.session.user;
      this.professor = {
        id: this.user.id,
        first_name: this.user.user_metadata['first_name'],
        last_name: this.user.user_metadata['last_name'],
        email: this.user.user_metadata['email'],
      };
      this.professorCourses = await this.professorService.fetchProfessorCourses(
        this.professor.id
      );
      this.fetchedCourses = true;
      this.handleCourseUpdates();
    } catch (err) {
      console.log(err);
    }
  }

  handleCourseUpdates(): void {
    this.sharedService
      .getTableChanges(
        'ProfessorCourse',
        'professor-course-channel',
        `professor_id=eq.${this.professor.id}`
      )
      .subscribe(async (update: any) => {
        const record = update.new?.course_id ? update.new : update.old;
        const event = update.eventType;
        if (!record) return;
        // if new course inserted
        if (event === 'INSERT') {
          const { course_id } = record;
          const newCourse = await this.sharedService.getCourse(course_id);
          // show new assignment
          this.professorCourses = [...this.professorCourses, newCourse];
        }
        // if course deleted
        else if (event === 'DELETE') {
          const { course_id } = record;
          // remove course from UI
          this.professorCourses = this.professorCourses.filter(
            (course) => course.id !== course_id
          );
        }
      });
  }

  /**
   * Formats course name information like shown in Moodle
   * @param course Course object containing course information
   * @returns formatted string of course (moodle format)
   */
  formatCourse(course: Course): string {
    return course.section
      ? `${course.year - 2000}${course.semester} ${course.prefix}-${
          course.code
        }-${course.section} - ${course.name}`
      : `${course.year - 2000}${course.semester} ${course.prefix}-${
          course.code
        } - ${course.name}`;
  }

  onViewRoster(course: Course) {
    console.log({ course });
    this.router.navigateByUrl(
      `professor/roster/${course.id}`
    );
  }

  onViewAssignments(course: Course) {
    console.log({ course });
    this.router.navigateByUrl(
      `professor/assignments/${course.id}`
    );
  }


  // async swapView(page: string, courseID: number, course: Course) {
  //   this.currentPage = page;
  //   this.currentCourseID = courseID;
  //   this.currentCourse = course;
  //   this.router.navigateByUrl(
  //     `professor/roster/${courseID}`
  //   );
  // }

  /**
   * Goes to AddCourse pop up component
   */
  async addCoursePopUp(): Promise<void> {
    const dialogRef = this.dialog.open(AddCourseComponent, {
      width: '80%',
      height: '80%',
      data: {},
    });
  }

  /**
   * Goes to DeleteCourse pop up component
   */
  async deleteCoursePopUp(event: Event, course: Course): Promise<void> {
    /* prevent navigation to different view */
    event.stopPropagation();
    const dialogRef = this.dialog.open(DeleteCourseComponent, {
      width: '50%',
      height: '55%',
      data: { cid: course.id, pid: this.professor.id },
    });
  }
}
