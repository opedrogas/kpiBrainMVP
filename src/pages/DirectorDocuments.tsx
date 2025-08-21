import React, { useState, useEffect } from 'react';
import { 
  Download, 
  File,
  Calendar,
  AlertCircle,
  Filter
} from 'lucide-react';
import { DocumentService, DocumentMetadata } from '../services/documentService';
import { useAuth } from '../contexts/AuthContext';
import MonthYearPicker from '../components/UI/MonthYearPicker';

const DirectorDocuments: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helper functions
  const getMonthName = (monthNumber: number): string => {
    return months[monthNumber - 1];
  };

  const getMonthNumber = (monthName: string): number => {
    return months.indexOf(monthName) + 1;
  };

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string | ''>('');
  const [filterYear, setFilterYear] = useState<number | ''>('');
  const [filterPickerOpen, setFilterPickerOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    if (user?.id) {
      fetchDocuments();
    }
  }, [user?.id]);

  useEffect(() => {
    filterDocuments();
  }, [documents, filterMonth, filterYear]);

  const fetchDocuments = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    try {
      const documentsData = await DocumentService.getDocumentsForDirector(user.id);
      setDocuments(documentsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documents;

    // Filter by month and year
    if (filterMonth !== '' || filterYear !== '') {
      console.log('DirectorDocuments Filter Debug:', {
        filterMonth,
        filterYear,
        expectedMonthNumber: filterMonth !== '' ? getMonthNumber(filterMonth) : 'none'
      });

      filtered = filtered.filter(document => {
        if (!document.date) return false;
        
        const documentDate = new Date(document.date);
        // Use UTC methods to avoid timezone issues
        const documentMonth = documentDate.getUTCMonth() + 1;
        const documentYear = documentDate.getUTCFullYear();

        const monthMatch = filterMonth === '' || documentMonth === getMonthNumber(filterMonth);
        const yearMatch = filterYear === '' || documentYear === filterYear;

        console.log('Document filter check:', {
          fileName: document.file_name,
          storedDate: document.date,
          parsedUTCMonth: documentMonth,
          parsedUTCYear: documentYear,
          monthMatch,
          yearMatch,
          included: monthMatch && yearMatch
        });

        return monthMatch && yearMatch;
      });
    }

    console.log('Filtered documents count:', filtered.length);
    setFilteredDocuments(filtered);
  };

  const handleDownload = (document: DocumentMetadata) => {
    if (document.file_url) {
      window.open(DocumentService.getDownloadUrl(document.file_url), '_blank');
    }
  };

  const getDocumentsByMonth = () => {
    const documentsByMonth = new Map<string, DocumentMetadata[]>();
    
    filteredDocuments.forEach(document => {
      if (document.date) {
        // Parse date in a timezone-safe way
        const documentDate = new Date(document.date);
        // Use UTC methods to avoid timezone issues
        const year = documentDate.getUTCFullYear();
        const month = documentDate.getUTCMonth() + 1;
        const monthKey = `${year}-${month}`;
        
        if (!documentsByMonth.has(monthKey)) {
          documentsByMonth.set(monthKey, []);
        }
        documentsByMonth.get(monthKey)!.push(document);
      }
    });

    // Sort by month/year (newest first)
    return Array.from(documentsByMonth.entries())
      .sort((a, b) => {
        const [yearA, monthA] = a[0].split('-').map(Number);
        const [yearB, monthB] = b[0].split('-').map(Number);
        
        if (yearA !== yearB) return yearB - yearA;
        return monthB - monthA;
      })
      .map(([key, docs]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          key,
          title: `${months[month - 1]} ${year}`,
          documents: docs
        };
      });
  };

  const clearFilters = () => {
    setFilterMonth('');
    setFilterYear('');
  };

  const hasActiveFilters = filterMonth !== '' || filterYear !== '';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Documents</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter Documents
            </h2>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Clear filters
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month & Year</label>
              {filterMonth !== '' && filterYear !== '' ? (
                <MonthYearPicker
                  selectedMonth={filterMonth as string}
                  selectedYear={filterYear as number}
                  onSelect={(month, year) => {
                    setFilterMonth(month);
                    setFilterYear(year);
                    setFilterPickerOpen(false);
                  }}
                  isOpen={filterPickerOpen}
                  onToggle={() => setFilterPickerOpen(!filterPickerOpen)}
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">No filter selected</p>
                  <button
                    onClick={() => {
                      const currentMonth = getMonthName(new Date().getMonth() + 1);
                      const currentYear = new Date().getFullYear();
                      setFilterMonth(currentMonth);
                      setFilterYear(currentYear);
                    }}
                    className="px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                  >
                    Select Month & Year
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {!loading && (
          <div className="mb-4 text-sm text-gray-600">
            {hasActiveFilters ? (
              <span>
                Showing {filteredDocuments.length} of {documents.length} documents
                {filterMonth !== '' && ` in ${filterMonth}`}
                {filterYear !== '' && ` ${filterYear}`}
              </span>
            ) : (
              <span>Showing all {documents.length} documents</span>
            )}
          </div>
        )}

        {/* Documents List */}
        <div>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              {hasActiveFilters ? (
                <p>No documents found matching your criteria</p>
              ) : (
                <p>No documents available for download</p>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {getDocumentsByMonth().map(({ key, title, documents: monthDocuments }) => (
                <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {title}
                      <span className="text-sm font-normal text-gray-600">
                        ({monthDocuments.length} document{monthDocuments.length !== 1 ? 's' : ''})
                      </span>
                    </h3>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {monthDocuments.map((document) => (
                      <div key={document.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <File className="w-8 h-8 text-red-600 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <h4 className="font-medium text-gray-900 truncate">
                                {document.file_name || 'Unnamed Document'}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {document.date ? (() => {
                                  const date = new Date(document.date);
                                  // Use UTC date to avoid timezone shifts for consistency
                                  return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}`;
                                })() : 'No date available'}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleDownload(document)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Download document"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorDocuments;