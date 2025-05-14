// frontend/frontend/src/components/UI/LoadingButton.jsx
import React from 'react';
import { motion } from 'framer-motion';
import Spinner from './Spinner';

const LoadingButton = ({
  children,
  isLoading,
  disabled,
  className = '',
  type = 'button',
  onClick,
  loadingText = 'Processing...',
  spinnerColor = 'text-white',
  spinnerSize = 'h-5 w-5',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`btn ${className}`}
      disabled={isLoading || disabled}
      onClick={onClick}
      {...props}
    >
      <motion.div
        initial={false}
        animate={{ width: isLoading ? 'auto' : '100%' }}
        className="flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <Spinner size={spinnerSize} color={spinnerColor} />
            {loadingText && <span className="ml-2">{loadingText}</span>}
          </>
        ) : (
          children
        )}
      </motion.div>
    </button>
  );
};

export default LoadingButton;