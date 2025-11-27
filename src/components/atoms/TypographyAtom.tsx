import React from 'react';
import Typography, { TypographyProps } from '@mui/material/Typography';

export type TypographyAtomProps = TypographyProps;

const TypographyAtom: React.FC<TypographyAtomProps> = (props) => {
    return <Typography {...props} />;
};

export default TypographyAtom;
