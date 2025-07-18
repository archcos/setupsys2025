import { Outlet } from 'react-router-dom';

export default function Layout() {
  debugger;
  return (
    <div className="relative h-screen bg-gray-100"> 
      <div className="pb-20 h-full">
        <Outlet />
      </div>

      <footer className="fixed bottom-0 left-0 w-full bg-gray-800 text-white text-center py-4 z-50 shadow-md">
        © {new Date().getFullYear()} DOST Northern Mindanao - SETUP. All rights reserved.
      </footer>
    </div>
  );
}
