import React from 'react';
import { Table, Panel } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;

const DocumentList = ({ documents, loading }) => {
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  return (
    <Panel bordered className="document-list">
      <Table
        height={400}
        data={documents}
        loading={loading}
        hover={true}
        autoHeight
      >
        <Column width={200} align="left">
          <HeaderCell>Filename</HeaderCell>
          <Cell dataKey="filename" />
        </Column>
        
        <Column width={150} align="left">
          <HeaderCell>Type</HeaderCell>
          <Cell dataKey="content_type" />
        </Column>
        
        <Column width={100} align="right">
          <HeaderCell>Size</HeaderCell>
          <Cell>
            {(rowData) => formatFileSize(rowData.file_size)}
          </Cell>
        </Column>
        
        <Column width={200} align="left">
          <HeaderCell>Uploaded</HeaderCell>
          <Cell>
            {(rowData) => formatDate(rowData.uploaded_at)}
          </Cell>
        </Column>
      </Table>
    </Panel>
  );
};

export default DocumentList;
