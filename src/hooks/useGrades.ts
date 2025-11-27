'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useGrades() {
    const [grades, setGrades] = useState<number[]>([]);
    const [classes, setClasses] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchGradeClassList = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await api.getGradeClassList();
                setGrades(data.grades);
                setClasses(data.classes);
            } catch (err) {
                console.error('Failed to fetch grade/class list:', err);
                setError('학년/반 목록을 불러오는데 실패했습니다.');
                // Fallback: 기본값 설정
                setGrades([1, 2, 3]);
                setClasses([1, 2, 3, 4, 5]);
            } finally {
                setLoading(false);
            }
        };

        fetchGradeClassList();
    }, []);

    return { grades, classes, loading, error };
}
