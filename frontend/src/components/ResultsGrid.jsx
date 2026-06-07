import React from 'react';
import { ModuleCard } from './ModuleCard';
import './SafeNavResults.css';

export const ResultsGrid = ({ results }) => {
  if (!results || !results.details) return null;
  const d = results.details;

  // Helpers
  const truncate = (str, len) => str?.length > len ? str.substring(0, len) + '…' : str;

  // We need the link structure data to extract the two moved fields
  const link = d.link_structure || {};

// --- 1. SSL & Security (Concept 3: Identity vs. Encryption Split) ---
  const ssl = d.ssl_security || {};
  let sslPills = [...(ssl.warning_flags || [])];
  if (ssl.is_self_signed) sslPills.push("Self-Signed Certificate");

  // simplified consumer-friendly badge
  const sslBadge = ssl.is_valid 
    ? { text: "Connection Secured", color: 'badge-green' }
    : { text: "⚠ Unsecured", color: 'badge-red' };

  // Calculate the Identity status based on the Validation Type
  // OV/EV means a legal business was verified. Everything else (DV) means the identity is hidden.
  const isIdentityVerified = ssl.validation_type && ssl.validation_type.includes("OV/EV");
  const identityValue = isIdentityVerified 
    ? "Verified Business ✅" 
    : "Hidden (Standard) ";

  // The new Plain-English Fields
  const sslFields = [
    { 
      label: "Privacy (Encryption)", 
      value: ssl.is_valid ? 'Private 🔒' : 'Exposed 🔓' 
    },
    { 
      label: "Site Owner Identity", 
      value: identityValue 
    },
    { 
      label: "Security Provider", 
      value: truncate(ssl.issuer, 20) 
    },
    { 
      label: "Certificate Age", 
      value: ssl.days_to_expire ? `${ssl.days_to_expire} days remaining` : 'Unknown' 
    }
  ];

  // --- 2. Phishing Checks (UPGRADED) ---
  const phish = d.phishing_checks || {};
  const phishRisks = [phish.typosquatting, phish.brand_similarity, phish.suspicious_keywords, phish.homograph_attack]
    .some(v => v && v !== 'No' && v !== 'None' && v !== false);
    
  const phishBadge = phishRisks ? { text: "⚠ Risk Detected", color: 'badge-red' } : { text: "Clean", color: 'badge-green' };
  
  const phishFields = [
    { label: "Typosquatting", value: phish.typosquatting || 'No', type: "phishing" },
    { label: "Brand Similarity", value: phish.brand_similarity || 'None', type: "phishing" },
    { label: "Suspicious Keywords", value: phish.suspicious_keywords || 'No', type: "phishing" },
    { label: "Homograph Attack", value: phish.homograph_attack || 'No', type: "phishing" },
    // 🚀 Migrated from Link Structure
    { label: "Obfuscation", value: link.is_obfuscated ? 'Yes' : 'No', type: "phishing" } 
  ];

  // --- 3. IP Intelligence (Streamlined) ---
  const ip = d.ip_intelligence || {};
  
  // Cleanly format the server location (e.g., "United States 🇺🇸 · New York")
  const serverLocation = [ip.hosting_country, ip.hosting_flag, ip.hosting_city]
    .filter(Boolean)
    .join(' ');

  // Cleanly format the network provider/server name (e.g., "Google Cloud · AS15169")
  const networkProvider = [ip.asn_org || ip.isp, ip.asn]
    .filter(Boolean)
    .join(' · ');

  const ipBadge = { 
    text: `${ip.hosting_flag || ''} ${ip.hosting_city || ip.hosting_country || ''}`, 
    color: 'badge-neutral' 
  };
  
  const ipFields = [
    { label: "IP Address", value: ip.ip_address },
    { label: "Server Location", value: serverLocation || "Unknown" },
    { label: "Network Provider", value: networkProvider || "Unknown" },
    { label: "VPN / Proxy", value: ip.is_vpn_or_proxy, type: "boolean" },
    { label: "Is IP Based", value: link.is_ip_based, type: "boolean" } 
  ];

  return (
    <div className="results-grid">
      <ModuleCard title="SSL & Security" icon="🔐" statusBadge={sslBadge} fields={sslFields} warningFlags={sslPills} />
      <ModuleCard title="Phishing Checks" icon="🎣" statusBadge={phishBadge} fields={phishFields} />
      <ModuleCard title="IP Intelligence" icon="🌍" statusBadge={ipBadge} fields={ipFields} warningFlags={ip.warning_flags} />
    </div>
  );
};