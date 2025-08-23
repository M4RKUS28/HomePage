import React from 'react';
import Navbar from '../components/Core/Navbar';
import Footer from '../components/Core/Footer';

const MainLayout = ({ children, headerText, socialLinks, ownerName }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar initialHeaderText={headerText} />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <Footer 
        headerText={headerText}
        socialLinks={socialLinks}
        ownerName={ownerName}
      />
    </div>
  );
};

export default MainLayout;