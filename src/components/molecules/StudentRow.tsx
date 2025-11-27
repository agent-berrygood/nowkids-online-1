import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Stack from '@mui/material/Stack';
import { Student, AttendanceStatus } from '@/types';
import AttendanceButton from '@/components/atoms/AttendanceButton';
import StatusChip from '@/components/atoms/StatusChip';
import TypographyAtom from '@/components/atoms/TypographyAtom';

interface StudentRowProps {
    student: Student;
    currentStatus: AttendanceStatus;
    onStatusChange: (studentId: string, newStatus: AttendanceStatus) => void;
}

const STATUS_OPTIONS: AttendanceStatus[] = ['출석', '지각', '결석', '조퇴', '기타'];

export default function StudentRow({ student, currentStatus, onStatusChange }: StudentRowProps) {
    return (
        <TableRow hover>
            <TableCell align="center" sx={{ width: 80 }}>
                <TypographyAtom variant="body1" fontWeight="bold">
                    {student.number}
                </TypographyAtom>
            </TableCell>
            <TableCell sx={{ width: 150 }}>
                <TypographyAtom variant="body1">{student.name}</TypographyAtom>
                <TypographyAtom variant="caption" color="text.secondary">
                    {student.gender === 'M' ? '남' : '여'}
                </TypographyAtom>
            </TableCell>
            <TableCell align="center" sx={{ width: 100 }}>
                <StatusChip status={currentStatus} />
            </TableCell>
            <TableCell>
                <Stack direction="row" spacing={1} justifyContent="center">
                    {STATUS_OPTIONS.map((status) => (
                        <AttendanceButton
                            key={status}
                            status={status}
                            currentStatus={currentStatus}
                            onClick={(newStatus) => onStatusChange(student.id, newStatus)}
                        />
                    ))}
                </Stack>
            </TableCell>
        </TableRow>
    );
}
