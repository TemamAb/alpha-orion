import React from 'react';
import WalletManagement from './components/WalletManagement';
// Other dashboard components would be imported here
// import ProfitOverview from './components/ProfitOverview';
// import SystemHealth from './components/SystemHealth';

function App() {
  return (
    <div className="bg-gray-900 min-h-screen text-gray-200 font-sans">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-3xl font-bold text-white">Alpha-Orion Institutional Control Center</h1>
      </header>
      
      <main className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-3">
          {/* The new WalletManagement component is integrated here */}
          <WalletManagement />
        </div>
        
        {/* Other dashboard sections would go here */}
        
      </main>
    </div>
  );
}

export default App;