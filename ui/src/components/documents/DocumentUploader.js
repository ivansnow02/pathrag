import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Panel, Loader, Progress, Message, Button } from 'rsuite';
import { documentAPI } from '../../services/api';

const DocumentUploader = ({ onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF, DOCX, and MD files are allowed');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const response = await documentAPI.uploadDocument(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });
      
      setUploadedFile(response.data);
      
      // Poll for document processing status
      const documentId = response.data.id;
      const statusInterval = setInterval(async () => {
        try {
          const statusResponse = await documentAPI.getDocumentStatus(documentId);
          const { progress, status } = statusResponse.data;
          
          setUploadProgress(progress);
          
          if (status === 'completed') {
            clearInterval(statusInterval);
            setUploading(false);
            if (onUploadComplete) onUploadComplete(response.data);
          } else if (status === 'failed') {
            clearInterval(statusInterval);
            setUploading(false);
            setError('Document processing failed');
          }
        } catch (error) {
          clearInterval(statusInterval);
          setUploading(false);
          setError('Failed to get document status');
        }
      }, 2000);
    } catch (error) {
      setUploading(false);
      setError(error.response?.data?.detail || 'Failed to upload document');
    }
  }, [onUploadComplete]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md'],
    },
    disabled: uploading,
    multiple: false,
  });
  
  return (
    <Panel bordered className="document-uploader">
      {error && <Message type="error" closable>{error}</Message>}
      
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="upload-progress">
            <Loader content="Uploading..." />
            <Progress.Line percent={uploadProgress} status="active" />
            <p>Uploading and processing document...</p>
          </div>
        ) : (
          <div className="upload-prompt">
            <p>Drag & drop a document here, or click to select</p>
            <p className="upload-note">Supported formats: PDF, DOCX, MD</p>
          </div>
        )}
      </div>
      
      {uploadedFile && !uploading && (
        <div className="upload-success">
          <Message type="success" closable>
            Document uploaded successfully: {uploadedFile.filename}
          </Message>
          <Button appearance="primary" onClick={() => onUploadComplete(uploadedFile)}>
            View Documents
          </Button>
        </div>
      )}
    </Panel>
  );
};

export default DocumentUploader;
