import { Injectable } from '@angular/core';
import {
  AuthChangeEvent,
  AuthSession,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from 'src/environments/secret_env';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private supabase: SupabaseClient;
  private $currentUser: BehaviorSubject<User | boolean | null> =
    new BehaviorSubject<User | boolean | null>(null);

  _session: AuthSession | null;
  _user: User | null;

  // Code referred from: https://supabase.com/blog/authentication-in-ionic-angular#creating-the-ionic-angular-app
  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.serviceRoleKey
    );

    // create auth user subscription
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        this.$currentUser.next(session.user);
      } else {
        this.$currentUser.next(false);
      }
    });

    // Trigger initial session load
    this.loadUser();
  }

  async loadUser() {
    if (this.$currentUser.value) {
      // User is already set, no need to do anything else
      return;
    }
    const user = await this.supabase.auth.getUser();

    if (user.data.user) {
      this.$currentUser.next(user.data.user);
    } else {
      this.$currentUser.next(false);
    }
  }

  getCurrentUser(): Observable<User | boolean | null> {
    return this.$currentUser.asObservable();
  }

  // getter for supabase client in child classes
  get client() {
    return this.supabase;
  }

  get session() {
    this.supabase.auth.getSession().then(({ data }) => {
      this._session = data.session;
    });
    return this._session;
  }

  async isLoggedIn(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();
    if (error) {
      console.log({ error });
      throw new Error('Error getting user');
    }
    return user;
  }

  authChanges(
    callback: (event: AuthChangeEvent, session: Session | null) => void
  ) {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Register new user (only for professors)
   * @param email firstName.lastName@calvin.edu
   * @param password user-defined password
   * @returns
   */
  async signUp(
    first_name: string,
    last_name: string,
    email: string,
    password: string
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
        },
      },
    });
    if (error) {
      console.log({ error });
      throw new Error('signUp');
    }
    console.log({ data });
    return data;
  }

  async createStudentUser(
    first_name: string,
    last_name: string,
    email: string,
    cid: number
  ) {
    const { data, error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: 'https://example.com/welcome',
        data: {
          first_name,
          last_name,
        },
      },
    });

    if (error) {
      console.log({ error });
      throw new Error('createStudentUser: ');
    }
  }

  /**
   * Log in an existing user
   * @param email student or professor @calvin.edu email
   * @param password password
   * @returns
   */
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.log(error);
      throw new Error('signIn');
    }

    return data;
  }

  /**
   * Sign out corrent user
   * @returns
   */
  signOut() {
    return this.supabase.auth.signOut();
  }

  /**
   * Insert new user as a student
   * @param firstName
   * @param lastName
   * @param email
   * @returns trigger insert student
   */
  async insertStudent(firstName: string, lastName: string, email: string) {
    const type = 'student';
    let { data, error } = await this.supabase.rpc('insert_user', {
      type,
      firstName,
      lastName,
      email,
    });

    if (error) {
      console.log(error);
      throw new Error('insert student: ');
    }
    return data;
  }

  async getRole(email: string | null | undefined): Promise<string> {
    if (!email) {
      throw new Error('Nonetype Email');
    }

    let { data, error } = await this.supabase.rpc('get_role', {
      auth_email: email,
    });

    if (error) {
      console.log(error);
      throw new Error('Get auth user role: ');
    }
    return data;
  }

  /**
   * Insert new user as a professor
   * @param firstName
   * @param lastName
   * @param email
   * @returns trigger insert professor
   */
  async insertProfessor(firstName: string, lastName: string, email: string) {
    const type = 'professor';
    let { data, error } = await this.supabase.rpc('insert_user', {
      type,
      firstName,
      lastName,
      email,
    });

    if (error) {
      console.log(error);
      throw new Error('insert professor: ');
    }
    return data;
  }

  /**
   * Writes student appeal to database
   * @param type student or professor
   * @param first_name first name
   * @param last_name last name
   * @param email user's email prefix (no @calvin.edu)
   */
  async insertUser(
    type: string,
    first_name: string,
    last_name: string,
    email: string
  ): Promise<void> {
    const { data, error } = await this.supabase.rpc('insert_user', {
      type,
      first_name,
      last_name,
      email,
    });

    if (error) {
      console.log(error);
      throw new Error('insertUser');
    }
    console.log({ data });
  }
}
