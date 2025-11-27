'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useGrades() {
    const [grades, setGrades] = useState<string[]>([]);
    const [classes, setClasses] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGradeClassList = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.getGradeClassList();
                // API에서 받은 grades가 숫자일 수도 있으므로 문자열로 변환
                const stringGrades = data.grades.map(String);
                setGrades(stringGrades);
                setClasses(data.classes);
            } catch (err) {
                console.error('Failed to fetch grade/class list:', err);
                // 디버깅을 위해 상세 에러 메시지 표시
                setError(`목록 로딩 실패: ${err instanceof Error ? err.message : String(err)}`);
                // Fallback: 기본값 설정
                setGrades(['1', '2', '3']);
                setClasses([1, 2, 3, 4, 5]);
            } finally {
                setLoading(false);
            }
        };

        fetchGradeClassList();
    }, []);

    return { grades, classes, loading, error };
}
