// Server component for Navbar with SSR data fetching
import React from 'react';
import { fetchCVDataSSR } from '../../lib/server-api';
import NavbarClient from './NavbarClient';

const Navbar = async () => {
  // Fetch CV data on server side
  const cvData = await fetchCVDataSSR();
  const headerText = cvData?.personalInfo?.headerText || 'Portfolio';

  return <NavbarClient initialHeaderText={headerText} />;
};

export default Navbar;