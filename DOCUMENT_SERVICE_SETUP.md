# Document Service Setup Guide

This guide will help you resolve the document upload errors you're experiencing.

## The Problem

You're getting these errors when trying to upload documents:
- `400 (Bad Request)` from Supabase storage API
- `new row violates row-level security policy`

## Root Cause

The main component missing from your Supabase setup is:
1. The `doc_metadata` database table 

**Note:** The document service now uses the existing `review-files` storage bucket, so no new bucket setup is needed.

## Solution Steps

### Step 1: Create the Database Table

Run the SQL script to create the `doc_metadata` table:

```bash
# Execute the SQL setup script in your Supabase project
```

Copy and run the contents of `document-service-setup.sql` in your Supabase SQL Editor.

### Step 2: Verify Storage Bucket

The document service now uses the existing `review-files` storage bucket, so no additional bucket setup is required. Just verify that the `review-files` bucket exists and is properly configured.

### Step 3: Configure Additional Storage Policies (if needed)

The `review-files` bucket should already have the necessary policies. If you encounter storage permission issues, verify the policies for the `review-files` bucket:

**Upload Policy:**
```sql
-- Allow authenticated users to upload
(auth.uid() IS NOT NULL)
```

**Download Policy:**
```sql
-- Allow authenticated users to download  
(auth.uid() IS NOT NULL)
```

**Delete Policy:**
```sql
-- Allow authenticated users to delete
(auth.uid() IS NOT NULL)
```

### Step 4: Verify Setup

After completing the steps above:

1. Check that the `doc_metadata` table exists in your database
2. Verify the `review-files` storage bucket exists and has proper policies
3. Try uploading a document through your application

## File Structure Created

The document service creates files in the `review-files` bucket with this structure:
```
review-files/
├── 2025/
│   ├── 1/
│   │   └── [director-uuid]/
│   │       └── [timestamp]_[random].pdf
│   ├── 2/
│   └── ...
└── ...
```

This structure is separate from the clinician review files, which use:
```
review-files/
└── [clinician-uuid]/
    └── [kpi-uuid]/
        └── [timestamp]_[random].ext
```

## Troubleshooting

### Still getting 400 errors?
- Ensure the `review-files` bucket exists and is accessible
- Check that your Supabase project URL and anon key are correct
- Verify your authentication is working properly

### Still getting RLS policy violations?
- Make sure you ran the complete SQL script
- Check that the user is authenticated when uploading
- Verify the `profiles` table exists and is properly set up

### File size issues?
- Default limit is 50MB for documents
- You can increase this in the `DocumentService.ts` file
- Also check Supabase project limits

## Related Files

- `src/services/documentService.ts` - Main service file
- `src/pages/DocumentManagement.tsx` - UI component
- `document-service-setup.sql` - Database setup script