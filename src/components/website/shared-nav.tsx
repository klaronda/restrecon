import { Link } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SharedNavProps {
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

export function SharedNav({ isLoggedIn = false, onLogout }: SharedNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img 
            src="https://eqqbsiuqjnqpiiuumanu.supabase.co/storage/v1/object/public/site_assets/temp/Rover.svg" 
            alt="Rover" 
            className="w-8 h-8"
            width="32"
            height="32"
            fetchPriority="high"
          />
          <span className="text-gray-900 text-xl">NestRecon</span>
        </Link>
        
        {/* Desktop Navigation - visible on screens 768px and larger */}
        {isDesktop && (
          <div className="flex items-center gap-6 lg:gap-8">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <Link to="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link to="/faq" className="text-gray-600 hover:text-gray-900 transition-colors">FAQ</Link>
            {isLoggedIn ? (
              <>
                <Link to="/account" className="text-gray-600 hover:text-gray-900 transition-colors">My Account</Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('[SharedNav] Logout button clicked');
                    if (onLogout) {
                      onLogout();
                    } else {
                      console.error('[SharedNav] onLogout handler not provided');
                    }
                  }}
                  className="text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
                  aria-label="Log out of your account"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Log Out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900 transition-colors">Log In</Link>
                <Link 
                  to="/signup" 
                  className="bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        )}

        {/* Mobile Menu Button - only visible on small screens */}
        {!isDesktop && (
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-gray-900"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        )}
      </div>

      {/* Mobile Menu Overlay */}
      {!isDesktop && mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              <div className="flex items-center p-6 border-b border-gray-200">
                <span className="text-gray-900 text-xl font-semibold">Menu</span>
              </div>
              <nav className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-col gap-6">
                  <a 
                    href="#how-it-works" 
                    className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    How It Works
                  </a>
                  <Link 
                    to="/pricing" 
                    className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Pricing
                  </Link>
                  <Link 
                    to="/faq" 
                    className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                    onClick={closeMobileMenu}
                  >
                    FAQ
                  </Link>
                  {isLoggedIn ? (
                    <>
                      <Link 
                        to="/account" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        My Account
                      </Link>
                      <button
                        onClick={() => {
                          closeMobileMenu();
                          onLogout?.();
                        }}
                        className="text-left text-gray-900 text-lg hover:text-[#556B2F] transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-5 h-5" />
                        <span>Log Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/login" 
                        className="text-gray-900 text-lg hover:text-[#556B2F] transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Log In
                      </Link>
                      <Link 
                        to="/signup" 
                        className="bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors text-center"
                        onClick={closeMobileMenu}
                      >
                        Start Free Trial
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
