import React from 'react';
import { Loader2 } from 'lucide-react';

const Spinner = ({ size = "h-8 w-8", color = "text-primary" }) => {
  return (
    <Loader2 className={`animate-spin ${size} ${color}`} />
  );
};

export default Spinner;