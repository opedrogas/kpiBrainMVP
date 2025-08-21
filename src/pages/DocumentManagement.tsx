import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Trash2, 
  Edit2, 
  File,
  Calendar,
  User,
  Search,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { DocumentService, DocumentMetadata } from '../services/documentService';
import MonthYearPicker from '../components/UI/MonthYearPicker';

const DocumentManagement: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [directors, setDirectors] = useState<Array<{id: string, name: string}>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

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

  // Form states
  const [selectedMonth, setSelectedMonth] = useState<string>(getMonthName(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedDirector, setSelectedDirector] = useState<string>('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [editingDocument, setEditingDocument] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');
  const [uploadPickerOpen, setUploadPickerOpen] = useState(false);

  // Filter states
  const [filterMonth, setFilterMonth] = useState<string>(getMonthName(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());
  const [filterDirector, setFilterDirector] = useState<string>('');
  const [filterPickerOpen, setFilterPickerOpen] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  useEffect(() => {
    fetchDirectors();
    fetchDocuments();
  }, [filterMonth, filterYear, filterDirector]);

  const fetchDirectors = async () => {
    try {
      const directorsData = await DocumentService.getDirectors();
      setDirectors(directorsData);
    } catch (error) {
      console.error('Error fetching directors:', error);
    }
  };

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      let documentsData;
      const filterMonthNumber = getMonthNumber(filterMonth);
      if (filterDirector) {
        documentsData = await DocumentService.getDocumentsByMonthAndDirector(
          filterMonthNumber,
          filterYear,
          filterDirector
        );
      } else {
        documentsData = await DocumentService.getDocumentsByMonth(filterMonthNumber, filterYear);
      }
      setDocuments(documentsData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile || !selectedDirector) {
      setError('Please select a file and director');
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const selectedMonthNumber = getMonthNumber(selectedMonth);
      console.log('DocumentManagement Upload Debug:', {
        selectedMonth,
        selectedYear,
        selectedMonthNumber,
        fileName: uploadFile.name
      });
      
      await DocumentService.uploadDocument(
        uploadFile,
        selectedDirector,
        selectedMonthNumber,
        selectedYear
      );
      setSuccess('Document uploaded successfully');
      setUploadFile(null);
      setSelectedDirector('');
      fetchDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };



  const handleDownload = (document: DocumentMetadata) => {
    if (document.file_url) {
      window.open(DocumentService.getDownloadUrl(document.file_url), '_blank');
    }
  };

  const handleDelete = async (document: DocumentMetadata) => {
    if (!confirm(`Are you sure you want to delete "${document.file_name}"?`)) {
      return;
    }

    try {
      await DocumentService.deleteDocument(document.id);
      setSuccess('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete document');
    }
  };

  const handleRename = async (document: DocumentMetadata) => {
    if (!newFileName.trim()) {
      setError('Please enter a new file name');
      return;
    }

    try {
      await DocumentService.updateDocument(document.id, { file_name: newFileName });
      setSuccess('Document renamed successfully');
      setEditingDocument(null);
      setNewFileName('');
      fetchDocuments();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to rename document');
    }
  };

  const startRename = (document: DocumentMetadata) => {
    setEditingDocument(document.id);
    setNewFileName(document.file_name || '');
  };

  const cancelRename = () => {
    setEditingDocument(null);
    setNewFileName('');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Document Management</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-600 hover:text-red-800">×</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700">{success}</span>
            <button onClick={clearMessages} className="ml-auto text-green-600 hover:text-green-800">×</button>
          </div>
        )}

        {/* Upload Section */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Upload New Document
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Month & Year</label>
              <MonthYearPicker
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onSelect={(month, year) => {
                  setSelectedMonth(month);
                  setSelectedYear(year);
                  setUploadPickerOpen(false);
                }}
                isOpen={uploadPickerOpen}
                onToggle={() => setUploadPickerOpen(!uploadPickerOpen)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Director</label>
              <select
                value={selectedDirector}
                onChange={(e) => setSelectedDirector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Director</option>
                {directors.map((director) => (
                  <option key={director.id} value={director.id}>
                    {director.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">File</label>
              <input
                type="file"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleFileUpload}
              disabled={!uploadFile || !selectedDirector || uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>


          </div>
        </div>

        {/* Filter Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Documents
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Director</label>
              <select
                value={filterDirector}
                onChange={(e) => setFilterDirector(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Directors</option>
                {directors.map((director) => (
                  <option key={director.id} value={director.id}>
                    {director.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Documents for {filterMonth} {filterYear}
            {filterDirector && ` - ${directors.find(d => d.id === filterDirector)?.name}`}
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
              <p>No documents found for the selected criteria</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((document) => (
                <div key={document.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <File className="w-8 h-8 text-red-600" />
                      <div>
                        {editingDocument === document.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter new file name"
                            />
                            <button
                              onClick={() => handleRename(document)}
                              className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelRename}
                              className="px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-medium text-gray-900">{document.file_name}</h3>
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
                          </>
                        )}
                      </div>
                    </div>
                    
                    {editingDocument !== document.id && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(document)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => startRename(document)}
                          className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                          title="Rename"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(document)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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

export default DocumentManagement;