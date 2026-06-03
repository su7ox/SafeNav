import React from 'react';
import './SafeNavResults.css';

export const FieldRow = ({ label, value, type = "text" }) => {
  if (value === undefined || value === null || value === '') return null;

  const renderValue = () => {
    switch (type) {
      case 'boolean':
        return value ? (
          <><span className="dot text-green">●</span><span className="text-green">Yes</span></>
        ) : (
          <><span className="dot text-grey">●</span><span className="text-grey">No</span></>
        );

      case 'phishing':
        if (value === 'No' || value === 'None' || value === false) {
          return <><span className="dot text-grey">●</span><span className="text-grey">{value || 'No'}</span></>;
        }
        return <><span className="dot text-red">●</span><span className="text-red">{value}</span></>;

      case 'url':
        const truncated = value.length > 35 ? value.substring(0, 35) + '…' : value;
        return <a href={value} target="_blank" rel="noopener noreferrer" className="link-blue">{truncated}</a>;

      default:
        return <span>{value}</span>;
    }
  };

  return (
    <div className="field-row">
      <span className="field-label">{label}</span>
      <div className="field-dots" />
      <span className="field-value">{renderValue()}</span>
    </div>
  );
};