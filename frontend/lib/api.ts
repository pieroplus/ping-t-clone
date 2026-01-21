const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiError extends Error {
  constructor(public status: number, message: string, public errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized - redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/auth/login';
    }
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // Check if it's a validation error (400) with field errors
    if (response.status === 400 && typeof errorData === 'object' && !errorData.detail) {
      throw new ApiError(response.status, 'Validation error', errorData);
    }
    throw new ApiError(response.status, errorData.detail || 'API request failed');
  }

  // Handle 204 No Content or empty responses
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }

  return response.json();
}

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/token/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password2: string;
  image?: File | null;
}

export interface RegisterResponse {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return apiRequest<RegisterResponse>('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

export async function getCurrentUser(): Promise<User> {
  return apiRequest<User>('/api/auth/me/');
}

// Titles
export interface Owner {
  id: number;
  username: string;
  image?: string;
}

export interface Title {
  id: number;
  name: string;
  description?: string;
  status: 'draft' | 'private' | 'public';
  owner: Owner;
  questions_count: number;
  average_rating?: number;
}

export interface TitlesResponse {
  count: number;
  results: Title[];
}

export async function getTitles(page: number = 1, pageSize: number = 20, search?: string): Promise<TitlesResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (search) {
    params.append('search', search);
  }

  return apiRequest<TitlesResponse>(`/api/quiz/titles/?${params.toString()}`);
}

export async function getTitle(id: number): Promise<Title> {
  return apiRequest<Title>(`/api/quiz/titles/${id}/`);
}

// Questions
export interface Choice {
  id: number;
  text: string;
  is_correct?: boolean;
}

export interface Question {
  id: number;
  title_id: number;
  text: string;
  question_type: 'single' | 'multiple';
  choices: Choice[];
  explanation?: string;
}

export async function getTitleQuestions(titleId: number, random: boolean = false): Promise<Question[]> {
  const query = random ? '?random=true' : '';
  return apiRequest<Question[]>(`/api/quiz/titles/${titleId}/questions/${query}`);
}

export interface CheckAnswerRequest {
  selected_choice_ids: number[];
}

export interface CheckAnswerResponse {
  is_correct: boolean;
  explanation?: string;
  correct_choice_ids: number[];
}

export async function checkAnswer(questionId: number, data: CheckAnswerRequest): Promise<CheckAnswerResponse> {
  return apiRequest<CheckAnswerResponse>(`/api/quiz/questions/${questionId}/check/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Title Management
export interface CreateTitleRequest {
  name: string;
  description?: string;
  status: 'draft' | 'private' | 'public';
}

export interface UpdateTitleRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'private' | 'public';
}

export async function createTitle(data: CreateTitleRequest): Promise<Title> {
  return apiRequest<Title>('/api/quiz/titles/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTitle(id: number, data: UpdateTitleRequest): Promise<Title> {
  return apiRequest<Title>(`/api/quiz/titles/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteTitle(id: number): Promise<void> {
  return apiRequest<void>(`/api/quiz/titles/${id}/`, {
    method: 'DELETE',
  });
}

// Question Management
export interface ChoiceInput {
  text: string;
  is_correct: boolean;
  order?: number;
}

export interface CreateQuestionRequest {
  title_id: number;
  text: string;
  question_type: 'single' | 'multiple';
  explanation?: string;
  order?: number;
  choices: ChoiceInput[];
}

export interface UpdateQuestionRequest {
  text?: string;
  question_type?: 'single' | 'multiple';
  explanation?: string;
  order?: number;
  choices?: ChoiceInput[];
}

export async function getQuestion(id: number): Promise<Question> {
  return apiRequest<Question>(`/api/quiz/questions/${id}/`);
}

export async function createQuestion(data: CreateQuestionRequest): Promise<Question> {
  return apiRequest<Question>('/api/quiz/questions/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuestion(id: number, data: UpdateQuestionRequest): Promise<Question> {
  return apiRequest<Question>(`/api/quiz/questions/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteQuestion(id: number): Promise<void> {
  return apiRequest<void>(`/api/quiz/questions/${id}/`, {
    method: 'DELETE',
  });
}

export { ApiError };
