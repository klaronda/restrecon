import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ExternalLink, Trash2, ChevronLeft, AlertCircle } from 'lucide-react';
import { SharedNav } from './shared-nav';
import { fetchSavedProperties, deleteSavedProperty, SavedProperty } from '../../services/saved-properties';
import { supabase } from '../../lib/supabaseClient';

interface SavedPropertiesPageProps {
  userName: string;
  onLogout: () => void;
}

export function SavedPropertiesPage({ userName, onLogout }: SavedPropertiesPageProps) {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    const loadSavedProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user) {
          setError('Not authenticated');
          return;
        }

        const properties = await fetchSavedProperties(sessionData.session.user.id);
        setSavedProperties(properties);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load saved properties';
        setError(errorMessage);
        if (import.meta.env.DEV) {
          console.error('[SavedPropertiesPage] Error loading properties:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    loadSavedProperties();
  }, []);

  const handleDelete = async (propertyId: string) => {
    try {
      setDeletingId(propertyId);
      await deleteSavedProperty(propertyId);
      setSavedProperties(savedProperties.filter(p => p.id !== propertyId));
      setShowDeleteConfirm(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete property';
      setError(errorMessage);
      if (import.meta.env.DEV) {
        console.error('[SavedPropertiesPage] Error deleting property:', err);
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Extension badge colors (matching panel.css)
  const getBadgeStyle = (label: string | null) => {
    if (!label) return { backgroundColor: '#f3f4f6', color: '#6b7280' };
    if (label.includes('Great')) return { backgroundColor: '#dfe9c7', color: '#2f3c20' };
    if (label.includes('Fair')) return { backgroundColor: '#e9f1d8', color: '#3f4f24' };
    if (label.includes('Poor')) return { backgroundColor: '#fde7c3', color: '#8a5b00' };
    if (label.includes('Not a Match')) return { backgroundColor: '#fbd2d2', color: '#9f1d1d' };
    return { backgroundColor: '#f3f4f6', color: '#6b7280' };
  };

  // Convert stargaze score to label
  const getStargazeLabel = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return String(value);
    // Based on Bortle scale (1-9, lower is better)
    if (numValue <= 2) return 'Excellent';
    if (numValue <= 3) return 'Good';
    if (numValue <= 4) return 'Okay';
    if (numValue <= 5) return 'Not Great';
    return 'Not Good';
  };

  // Format metric for display with proper labels and formatting
  const formatMetric = (key: string, value: unknown): { label: string; displayValue: string } | null => {
    if (value === undefined || value === null) return null;
    
    if (key === 'schoolAvg') {
      const numVal = typeof value === 'number' ? value : parseFloat(String(value));
      return { 
        label: 'School Rating', 
        displayValue: isNaN(numVal) ? String(value) : `${numVal.toFixed(1)}/10` 
      };
    }
    if (key === 'walkability') {
      return { label: 'Walkability', displayValue: `${value}/100` };
    }
    if (key === 'bikeScore') {
      return { label: 'Bike Score', displayValue: `${value}/100` };
    }
    if (key === 'transitScore') {
      return { label: 'Transit Score', displayValue: `${value}/100` };
    }
    if (key === 'noise') {
      return { label: 'Sound Score', displayValue: String(value) };
    }
    if (key === 'airQuality') {
      return { label: 'Air Quality', displayValue: String(value) };
    }
    if (key === 'stargazeScore' || key === 'stargaze') {
      const numVal = typeof value === 'number' ? value : parseFloat(String(value));
      return { 
        label: 'Stargaze Score', 
        displayValue: isNaN(numVal) ? String(value) : getStargazeLabel(numVal)
      };
    }
    
    // Default: capitalize key
    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return { label: formattedKey, displayValue: String(value) };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#D6C9A2]/10">
      <SharedNav isLoggedIn={true} onLogout={onLogout} />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-[#556B2F] hover:underline mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
              <Heart className="w-5 h-5 text-red-600 fill-red-600" />
            </div>
            <h1 className="text-gray-900 text-3xl font-bold">Saved Properties</h1>
            {savedProperties.length > 0 && (
              <span className="text-gray-500 text-lg">({savedProperties.length})</span>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-900 font-semibold mb-1">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <p className="text-gray-500">Loading saved properties...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && savedProperties.length === 0 && (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 text-xl font-semibold mb-2">No saved properties yet</h2>
            <p className="text-gray-600 mb-6">
              Save properties from the Chrome extension to see them here.
            </p>
            <Link
              to="/account"
              className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-6 py-3 rounded-lg hover:bg-[#4a5e28] transition-colors"
            >
              Back to Account
            </Link>
          </div>
        )}

        {/* Properties List */}
        {!loading && savedProperties.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            {savedProperties.map((property) => {
              const metrics = property.summaryMetrics || {};
              const recapText = metrics.recap || metrics.summary || null;
              const metricEntries = Object.entries(metrics).filter(
                ([key]) => key !== 'recap' && key !== 'summary'
              );

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-[#556B2F]/40 transition-colors"
                >
                  {/* Header with Address and Badge */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-lg mb-2">
                        {property.address}
                      </h3>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl font-bold text-[#556B2F]">
                          {property.nestreconScore}
                        </span>
                        <span className="text-gray-500">/ 100</span>
                        {property.matchLabel && (
                          <span
                            className="text-xs font-bold rounded-full px-3 py-1.5"
                            style={getBadgeStyle(property.matchLabel)}
                          >
                            {property.matchLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDeleteConfirm(property.id)}
                      disabled={deletingId === property.id}
                      className="flex-shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      aria-label="Delete property"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Section */}
                  {recapText && (
                    <div className="mb-4 p-4 bg-gradient-to-br from-[#556B2F]/5 to-[#556B2F]/10 rounded-lg border border-[#556B2F]/20">
                      <p className="text-gray-700 text-sm leading-relaxed">{recapText}</p>
                    </div>
                  )}

                  {/* Metrics */}
                  {metricEntries.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-3 uppercase tracking-wide font-medium">Metrics</p>
                      <div className="grid grid-cols-2 gap-2">
                        {metricEntries.map(([key, value]) => {
                          const formatted = formatMetric(key, value);
                          return formatted ? (
                            <div key={key} className="text-sm text-gray-600">
                              <span className="font-semibold text-gray-700">{formatted.label}:</span>{' '}
                              {formatted.displayValue}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 mt-3 border-t border-gray-200" style={{ paddingTop: '16px' }}>
                    <a
                      href={property.zillowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#556B2F] text-white px-4 py-2 rounded-lg hover:bg-[#4a5e28] transition-colors text-sm font-medium"
                    >
                      View on Zillow
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <span className="text-xs text-gray-500">
                      Saved {new Date(property.lastScannedAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Delete Confirmation Modal */}
                  {showDeleteConfirm === property.id && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl p-6 max-w-md mx-4 border-2 border-gray-200">
                        <h3 className="text-gray-900 font-semibold mb-2">Delete Property?</h3>
                        <p className="text-gray-600 text-sm mb-6">
                          Are you sure you want to remove this property from your saved list? This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDelete(property.id)}
                            disabled={deletingId === property.id}
                            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            {deletingId === property.id ? 'Deleting...' : 'Delete'}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(null)}
                            disabled={deletingId === property.id}
                            className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
