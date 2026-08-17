export interface UserProfile {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}
