import Button, { ButtonProps } from '@mui/material/Button';
import React from 'react';

export type ButtonAtomProps = Omit<ButtonProps, 'children'> & {
    label: string;
};

const ButtonAtom: React.FC<ButtonAtomProps> = ({ label, ...props }) => {
    return <Button {...props}>{label}</Button>;
};

export default ButtonAtom;
