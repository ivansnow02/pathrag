import React, { useState, useEffect } from 'react';
import { Progress, Panel, Tag, Loader } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import websocketService from '../../services/websocket';

const UploadProgress = ({ document }) => {
  const [status, setStatus] = useState({
    progress: 0,
    status: document.status || 'uploading',
    message: 'Initializing upload...'
  });

  useEffect(() => {
    // Connect to WebSocket if not already connected
    websocketService.connect();

    // Add document-specific listener
    const removeListener = websocketService.addDocumentListener(document.id, (data) => {
      setStatus({
        progress: data.progress || 0,
        status: data.status || 'uploading',
        message: data.message || 'Processing document...'
      });
    });

    // Request initial status
    websocketService.requestDocumentStatus(document.id);

    // Clean up listener on unmount
    return () => {
      removeListener();
    };
  }, [document.id]);

  // Determine status color and icon
  const getStatusInfo = () => {
    switch (status.status) {
      case 'completed':
        return {
          color: 'green',
          icon: <FontAwesomeIcon icon={faCheckCircle} />,
          tagColor: 'green'
        };
      case 'failed':
        return {
          color: 'red',
          icon: <FontAwesomeIcon icon={faExclamationTriangle} />,
          tagColor: 'red'
        };
      case 'processing':
        return {
          color: 'blue',
          icon: <FontAwesomeIcon icon={faSpinner} spin />,
          tagColor: 'blue'
        };
      default:
        return {
          color: 'orange',
          icon: <FontAwesomeIcon icon={faSpinner} spin />,
          tagColor: 'orange'
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Panel bordered className="upload-progress-panel">
      <div className="upload-progress-header">
        <h4>{document.filename}</h4>
        <Tag color={statusInfo.tagColor}>
          {statusInfo.icon} {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
        </Tag>
      </div>
      
      <div className="upload-progress-bar">
        <Progress.Line
          percent={status.progress}
          strokeColor={statusInfo.color}
          showInfo={false}
        />
        <span className="progress-percentage">{Math.round(status.progress)}%</span>
      </div>
      
      <div className="upload-progress-message">
        {status.message}
      </div>
    </Panel>
  );
};

export default UploadProgress;
