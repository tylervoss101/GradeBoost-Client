import { Component } from '@angular/core';
import { SupabaseService } from 'src/app/services/supabase.service';
import { StudentCourse } from 'src/app/shared/student.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss'],

})


export class StudentDashboardComponent {
  studentCourses!: StudentCourse[];
  course_string: string;
  constructor(private readonly supabase: SupabaseService, private router: Router) {}
  async ngOnInit(): Promise<void> {
    this.studentCourses = await this.supabase.fetchStudentCourses(1);
    console.log(this.studentCourses);
  }
  onNewAppeal(course: StudentCourse){
    this.course_string  = course.course_prefix + course.course_code + "-" + course.course_section + " - " + course.professor_name; 
    this.router.navigateByUrl(`/new-appeal?course_name=${this.course_string}`)
  }

}


