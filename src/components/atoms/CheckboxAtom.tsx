import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import { CheckboxProps } from '@mui/material/Checkbox';

export type CheckboxAtomProps = Omit<CheckboxProps, 'checked'> & {
    checked: boolean;
};

const CheckboxAtom: React.FC<CheckboxAtomProps> = ({ checked, ...props }) => {
    return <Checkbox checked={checked} {...props} />;
};

export default CheckboxAtom;
