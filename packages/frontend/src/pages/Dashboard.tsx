import React from 'react';
import { Navbar } from '../../components/layout';
import { CompanyInfo } from '../../components/sections';

const Dashboard: React.FC = () => {
  return (
    // Full-height container with dark background
    <div className="min-h-screen bg-[#0a1628] flex flex-col text-white">

      {/* Navbar at the top */}
      <Navbar />

      {/* Main content area - takes remaining height */}
      <main className="flex-1 flex justify-center px-8 py-8">

        {/* Container with max-width constraint, centered on page */}
        <div className="w-full max-w-[1400px] flex gap-6">

          {/* Left section - 1/3 of the space */}
          <aside className="w-1/3">
            <CompanyInfo
              name="Apple Inc."
              ticker="AAPL"
              branch="Technology"
              ceo="Tim Cook"
              website="apple.com"
              description="Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company is known for its innovative products including iPhone, Mac, iPad, and Apple Watch."
              logoIcon={
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              }
            />
          </aside>

          {/* Right section - 2/3 of the space */}
          <section className="w-2/3 bg-bg-input rounded-component p-6">
            <h2 className="text-xl font-semibold mb-4">Main Content</h2>
            <p className="text-gray-300">
              This section takes up 2/3 of the available space.
            </p>
            {/* Add your main content here */}
          </section>

        </div>

      </main>

    </div>
  );
};

export default Dashboard;
