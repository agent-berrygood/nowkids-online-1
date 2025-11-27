import Chip from '@mui/material/Chip';
import { AttendanceStatus } from '@/types';

interface StatusChipProps {
    status: AttendanceStatus;
}

const getStatusColor = (status: AttendanceStatus): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
        case '출석':
            return 'success';
        case '지각':
            return 'warning';
        case '결석':
            return 'error';
        case '조퇴':
            return 'info';
        case '기타':
            return 'default';
        default:
            return 'default';
    }
};

export default function StatusChip({ status }: StatusChipProps) {
    return (
        <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
            variant="filled"
            sx={{ fontWeight: 'bold', minWidth: 60 }}
        />
    );
}
