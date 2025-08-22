import React, { useEffect, useState } from 'react';
import {
  Download,
  File,
  Calendar,
  AlertCircle,
  Search,
  User
} from 'lucide-react';
import { DocumentService, DocumentMetadata } from '../services/documentService';
import MonthYearPicker from '../components/UI/MonthYearPicker';

const DirectorDocuments: React.FC = () => {
  // Show all documents for the selected month/year (no per-director filtering)
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Helpers
  const getMonthName = (monthNumber: number): string => months[monthNumber - 1];
  const getMonthNumber = (monthName: string): number => months.indexOf(monthName) + 1;

  // Filter states (default to current month/year)
  const [filterMonth, setFilterMonth] = useState<string>(getMonthName(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterPickerOpen, setFilterPickerOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterMonth, filterYear]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const monthNumber = getMonthNumber(filterMonth);
      const data = await DocumentService.getDocumentsByMonth(monthNumber, filterYear);
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document: DocumentMetadata) => {
    if (document.file_url) {
      window.open(DocumentService.getDownloadUrl(document.file_url), '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Documents</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Documents
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month & Year</label>
              <MonthYearPicker
                selectedMonth={filterMonth}
                selectedYear={filterYear}
                onSelect={(month, year) => {
                  setFilterMonth(month);
                  setFilterYear(year);
                  setFilterPickerOpen(false);
                }}
                isOpen={filterPickerOpen}
                onToggle={() => setFilterPickerOpen(!filterPickerOpen)}
              />
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documents for {filterMonth} {filterYear}
            {!loading && ` (${documents.length})`}
          </h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No documents found for the selected month</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <File className="w-8 h-8 text-red-600" />
                      <div>
                        <h3 className="font-medium text-gray-900">{document.file_name || 'Unnamed Document'}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {document.director_profile?.name || 'Unknown Director'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {document.date ? new Date(document.date).toLocaleDateString() : 'No date'}
                          </span>
                        </div>
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
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorDocuments;