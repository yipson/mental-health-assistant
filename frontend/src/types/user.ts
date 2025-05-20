export enum UserRole {
    PSYCHOLOGIST = 'psychologist',
    ADMIN = 'admin'
  }
  
export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}