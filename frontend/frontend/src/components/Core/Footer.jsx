import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-center py-6 border-t border-gray-700">
      <p className="text-sm text-gray-400">
        © {new Date().getFullYear()} [Your Name]. All rights reserved.
      </p>
      {/* Add social media links or other info here */}
    </footer>
  );
};

export default Footer;