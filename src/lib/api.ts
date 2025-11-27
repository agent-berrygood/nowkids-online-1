import { Student, AttendanceRecord, ApiResponse } from '@/types';

// Google Apps Script Web App URL (나중에 환경변수로 분리)
const GAS_API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface GetStudentsParams {
    grade: number;
    classNum: number;
}

interface GetAttendanceParams {
    date: string;
    grade: number;
    classNum: number;
}

interface SubmitAttendanceParams {
    date: string;
    records: Omit<AttendanceRecord, 'id' | 'timestamp'>[];
}

class ApiClient {
    private baseUrl: string;

    constructor(url: string) {
        this.baseUrl = url;
    }

    private async fetch<T>(params: Record<string, string | number>, method: 'GET' | 'POST' = 'GET', body?: any): Promise<T> {
        // Mock 모드이거나 API URL이 없으면 에러 (나중에 Mock 데이터로 대체 가능)
        if (!this.baseUrl) {
            console.warn('API URL not set. Using mock data or failing.');
            throw new Error('API URL is not configured');
        }

        const queryString = new URLSearchParams(
            Object.entries(params).map(([key, value]) => [key, String(value)])
        ).toString();

        const url = `${this.baseUrl}?${queryString}`;

        const options: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (method === 'POST' && body) {
            // Google Apps Script는 POST 요청을 text/plain으로 보내야 CORS 문제를 피하기 쉬운 경우가 있음
            // 하지만 표준 JSON 전송을 시도하고, 필요시 수정
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }
            const result: ApiResponse<T> = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Unknown API error');
            }

            return result.data as T;
        } catch (error) {
            console.error('API Request Failed:', error);
            throw error;
        }
    }

    async getStudents({ grade, classNum }: GetStudentsParams): Promise<Student[]> {
        return this.fetch<Student[]>({ action: 'getStudents', grade, classNum });
    }

    async getAttendance({ date, grade, classNum }: GetAttendanceParams): Promise<AttendanceRecord[]> {
        return this.fetch<AttendanceRecord[]>({ action: 'getAttendance', date, grade, classNum });
    }

    async submitAttendance(params: SubmitAttendanceParams): Promise<boolean> {
        // POST 요청은 action을 query param으로 보내고 데이터는 body로
        return this.fetch<boolean>({ action: 'submitAttendance' }, 'POST', params);
    }

    async getGradeClassList(): Promise<{ grades: number[]; classes: number[] }> {
        // StudentDB에서 유니크한 학년/반 목록을 반환하는 API
        return this.fetch<{ grades: number[]; classes: number[] }>({ action: 'getGradeClassList' });
    }
}

export const api = new ApiClient(GAS_API_URL);
