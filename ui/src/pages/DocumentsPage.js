import React, { useState, useEffect } from 'react';
import { Button, Modal, Message } from 'rsuite';
import Layout from '../components/Layout';
import DocumentList from '../components/documents/DocumentList';
import DocumentUploader from '../components/documents/DocumentUploader';
import { documentAPI } from '../services/api';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch documents
  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await documentAPI.getDocuments();
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Handle upload complete
  const handleUploadComplete = (document) => {
    setShowUploadModal(false);
    fetchDocuments();
  };

  return (
    <Layout>
      <div className="documents-header">
        <h2>Documents</h2>
        <Button appearance="primary" onClick={() => setShowUploadModal(true)}>
          Upload Document
        </Button>
      </div>

      {error && <Message type="error">{error}</Message>}

      <DocumentList documents={documents} loading={loading} />

      <Modal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        size="md"
      >
        <Modal.Header>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <DocumentUploader onUploadComplete={handleUploadComplete} />
        </Modal.Body>

        <Modal.Footer>
          <Button onClick={() => setShowUploadModal(false)} appearance="subtle">
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Layout>
  );
};

export default DocumentsPage;
