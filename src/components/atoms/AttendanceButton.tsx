import ButtonAtom from './ButtonAtom';
import { AttendanceStatus } from '@/types';

interface AttendanceButtonProps {
    status: AttendanceStatus;
    currentStatus: AttendanceStatus;
    onClick: (status: AttendanceStatus) => void;
}

const getButtonColor = (status: AttendanceStatus): 'success' | 'warning' | 'error' | 'info' | 'inherit' => {
    switch (status) {
        case '출석':
            return 'success';
        case '지각':
            return 'warning';
        case '결석':
            return 'error';
        case '조퇴':
            return 'info';
        default:
            return 'inherit';
    }
};

export default function AttendanceButton({ status, currentStatus, onClick }: AttendanceButtonProps) {
    const isSelected = status === currentStatus;

    return (
        <ButtonAtom
            label={status}
            variant={isSelected ? 'contained' : 'outlined'}
            color={getButtonColor(status)}
            onClick={() => onClick(status)}
            size="small"
            sx={{
                minWidth: 60,
                opacity: isSelected ? 1 : 0.7,
                '&:hover': {
                    opacity: 1,
                },
            }}
        />
    );
}
