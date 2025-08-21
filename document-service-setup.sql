-- Document Service Setup
-- This script sets up the doc_metadata table and storage bucket policies for document management

-- Create doc_metadata table
CREATE TABLE IF NOT EXISTS doc_metadata (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    file_name TEXT,
    director UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_doc_metadata_director ON doc_metadata(director);
CREATE INDEX IF NOT EXISTS idx_doc_metadata_date ON doc_metadata(date);

-- Enable RLS (Row Level Security)
ALTER TABLE doc_metadata ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Documents are viewable by authenticated users" ON doc_metadata;
DROP POLICY IF EXISTS "Documents are insertable by authenticated users" ON doc_metadata;
DROP POLICY IF EXISTS "Documents are updatable by authenticated users" ON doc_metadata;
DROP POLICY IF EXISTS "Documents are deletable by authenticated users" ON doc_metadata;

-- Create RLS policies for doc_metadata table
-- Allow authenticated users to view documents
CREATE POLICY "Documents are viewable by authenticated users" 
    ON doc_metadata FOR SELECT 
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert documents
CREATE POLICY "Documents are insertable by authenticated users" 
    ON doc_metadata FOR INSERT 
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update documents
CREATE POLICY "Documents are updatable by authenticated users" 
    ON doc_metadata FOR UPDATE 
    USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete documents
CREATE POLICY "Documents are deletable by authenticated users" 
    ON doc_metadata FOR DELETE 
    USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at timestamp (reuse existing function)
DROP TRIGGER IF EXISTS update_doc_metadata_updated_at ON doc_metadata;
CREATE TRIGGER update_doc_metadata_updated_at
    BEFORE UPDATE ON doc_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage setup note
-- The DocumentService now uses the existing 'review-files' storage bucket
-- No additional storage setup is required as this bucket should already exist
-- Documents will be stored with the path structure: year/month/director-id/filename
-- This is separate from clinician review files which use: clinician-id/kpi-id/filename

-- Display setup confirmation
SELECT 
    'doc_metadata table created successfully' as status,
    COUNT(*) as initial_record_count
FROM doc_metadata;